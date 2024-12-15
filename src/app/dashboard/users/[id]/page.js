'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth';
import { MdClose } from 'react-icons/md';

const API_BASE_URL = 'https://ub.mo7tawa.store';

export default function EditUser({ params }) {
    const [userData, setUserData] = useState({
        email: '',
        phone: '',
        country: '',
        isConfirmed: false,
        productAccess: []
    });
    const [selectedProduct, setSelectedProduct] = useState('');
    const [productAccess, setProductAccess] = useState({
        endDate: '',
        promptLimit: '',
        isActive: true
    });
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const { getToken } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = getToken();
                const headers = {
                    Authorization: token ? `Bearer ${token}` : '',
                };

                const userResponse = await fetch(`${API_BASE_URL}/api/auth/admin/users/${params.id}`, {
                    headers
                });
                if (!userResponse.ok) throw new Error('Failed to fetch user');
                const user = await userResponse.json();
                setUserData(user);

                const productsResponse = await fetch(`${API_BASE_URL}/api/products`, { headers });
                if (!productsResponse.ok) throw new Error('Failed to fetch products');
                const productsData = await productsResponse.json();
                setProducts(productsData.products || []);

                if (user.productAccess && user.productAccess.length > 0) {
                    const firstAccess = user.productAccess[0];
                    setSelectedProduct(firstAccess.productId);
                    setProductAccess({
                        endDate: new Date(firstAccess.endDate).toISOString().split('T')[0],
                        promptLimit: firstAccess.promptLimit || 0,
                        isActive: firstAccess.isActive
                    });
                }
            } catch (err) {
                setErrorMessage(err.message);
            }
        };

        fetchData();
    }, [params.id, getToken]);

    const handleProductChange = (e) => {
        const productId = e.target.value;
        setSelectedProduct(productId);
        
        const access = userData.productAccess?.find(
            access => access.productId === productId
        );
        
        if (access) {
            setProductAccess({
                endDate: new Date(access.endDate).toISOString().split('T')[0],
                promptLimit: access.promptLimit || 0,
                isActive: access.isActive
            });
        } else {
            setProductAccess({
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                promptLimit: 0,
                isActive: true
            });
        }
    };

    const handleAccessChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProductAccess(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProduct) {
            setErrorMessage("Please select a product");
            return;
        }

        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const token = getToken();
            const response = await fetch(
                `${API_BASE_URL}/api/auth/admin/users/${params.id}/product-access/${selectedProduct}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: token ? `Bearer ${token}` : '',
                    },
                    body: JSON.stringify({
                        endDate: new Date(productAccess.endDate).toISOString(),
                        promptLimit: parseInt(productAccess.promptLimit),
                        isActive: productAccess.isActive
                    })
                }
            );

            if (!response.ok) {
                const responseData = await response.json();
                throw new Error(responseData.message || 'Failed to update product access');
            }

            setUserData(prevData => ({
                ...prevData,
                productAccess: prevData.productAccess.map(access => 
                    access.productId === selectedProduct
                        ? {
                            ...access,
                            endDate: new Date(productAccess.endDate).toISOString(),
                            promptLimit: parseInt(productAccess.promptLimit),
                            isActive: productAccess.isActive
                        }
                        : access
                )
            }));

            setSuccessMessage("Product access updated successfully");
            
            setTimeout(() => {
                router.push('/dashboard/users');
            }, 1500);
        } catch (err) {
            setErrorMessage("Error updating product access: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Get current product access details
    const currentAccess = selectedProduct ? 
        userData.productAccess?.find(access => access.productId === selectedProduct) 
        : null;
    const selectedProductDetails = products.find(p => p._id === selectedProduct);

    return (
        <main className="head">
            <div className="head-title">
                <h3 className="title">Edit User Product Access</h3>
            </div>
            {errorMessage && (
                <div className="error-message">
                    {errorMessage}
                    <button className="message-close" onClick={() => setErrorMessage(null)}>
                        <MdClose />
                    </button>
                </div>
            )}
            {successMessage && (
                <div className="success-message">
                    {successMessage}
                    <button className="message-close" onClick={() => setSuccessMessage(null)}>
                        <MdClose />
                    </button>
                </div>
            )}
            
            <div className="content">
                <div className="user-info mb-6 bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-lg font-bold mb-2">User Information</h4>
                    <p><strong>Email:</strong> {userData.email}</p>
                    <p><strong>Phone:</strong> {userData.phone}</p>
                    <p><strong>Country:</strong> {userData.country}</p>
                    <p><strong>Status:</strong> {userData.isConfirmed ? 'Confirmed' : 'Not Confirmed'}</p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <form className="settings-form" onSubmit={handleSubmit}>
                        <div className="form-group mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Product:</label>
                            <select
                                value={selectedProduct}
                                onChange={handleProductChange}
                                required
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Choose a product</option>
                                {products.map((product) => (
                                    <option key={product._id} value={product._id}>
                                        {product.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedProduct && (
                            <>
                                <div className="form-group mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date:</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={productAccess.endDate}
                                        onChange={handleAccessChange}
                                        required
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="form-group mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Limit:</label>
                                    <input
                                        type="number"
                                        name="promptLimit"
                                        value={productAccess.promptLimit}
                                        onChange={handleAccessChange}
                                        min="0"
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter prompt limit"
                                    />
                                </div>

                                <div className="form-group mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={productAccess.isActive}
                                            onChange={handleAccessChange}
                                            className="form-checkbox h-4 w-4 text-blue-600"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Active Access</span>
                                    </label>
                                </div>

                                {currentAccess && (
                                    <div className="current-settings mt-6 p-4 bg-gray-50 rounded-lg">
                                        <h4 className="text-lg font-bold mb-2">Current Access Details</h4>
                                        <div className="space-y-2">
                                            <p><strong>Product:</strong> {selectedProductDetails?.name}</p>
                                            <p><strong>End Date:</strong> {new Date(currentAccess.endDate).toLocaleDateString()}</p>
                                            <p><strong>Prompt Limit:</strong> {currentAccess.promptLimit || 0}</p>
                                            <p><strong>Usage Count:</strong> {currentAccess.usageCount || 0}</p>
                                            <p><strong>Remaining Prompts:</strong> {(currentAccess.promptLimit || 0) - (currentAccess.usageCount || 0)}</p>
                                            <p><strong>Status:</strong> {currentAccess.isActive ? 'Active' : 'Inactive'}</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <button 
                            className="sub-button mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                            type="submit" 
                            disabled={loading || !selectedProduct}
                        >
                            {loading ? 'Updating...' : 'Update Access'}
                        </button>
                    </form>
                </div>
            </div>

            <style jsx>{`
                .message-close {
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 10px;
                }
                
                .message-close:hover {
                    opacity: 0.8;
                }

                .error-message {
                    @apply bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 flex items-center justify-between;
                }

                .success-message {
                    @apply bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 flex items-center justify-between;
                }
            `}</style>
        </main>
    );
}
