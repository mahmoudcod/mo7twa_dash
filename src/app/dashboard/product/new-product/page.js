'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth';
import { MdClose } from 'react-icons/md';
import MultiSelect from '@/components/MultiSelect';

export default function CreateProduct() {
    const [productData, setProductData] = useState({
        name: '',
        description: '',
        promptLimit: 0,
        accessPeriodDays: 30,
        pages: [],
        category: []
    });
    const [pages, setPages] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const { getToken } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token')
                const headers = {
                    Authorization: token ? `Bearer ${token}` : '',
                };

                const categoryResponse = await fetch('https://ub.mo7tawa.store/api/categories', {
                    headers
                });
                if (!categoryResponse.ok) throw new Error('Failed to fetch categories');
                const categoryData = await categoryResponse.json();
                setCategories(categoryData.categories);

                const pageResponse = await fetch('https://ub.mo7tawa.store/api/pages/all', {
                    headers
                });
                if (!pageResponse.ok) throw new Error('Failed to fetch pages');
                const pageData = await pageResponse.json();
                setPages(pageData.pages);
            } catch (err) {
                setErrorMessage(err.message);
            }
        };

        fetchData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProductData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handlePagesChange = (selectedPages) => {
        setProductData((prevData) => ({ ...prevData, pages: selectedPages }));
    };

    const handleCategoryChange = (selectedCategories) => {
        setProductData((prevData) => ({ ...prevData, category: selectedCategories }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = getToken();
        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const response = await fetch('https://ub.mo7tawa.store/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({
                    ...productData,
                    accessPeriodDays: parseInt(productData.accessPeriodDays)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create the product');
            }

            setSuccessMessage("Product created successfully");
            router.push('/dashboard/product');
        } catch (err) {
            setErrorMessage("Error creating the product: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">Create New Product</h3>
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
                <form className="content" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Product Name:</label>
                        <input
                            type="text"
                            name="name"
                            value={productData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Description:</label>
                        <textarea
                            name="description"
                            value={productData.description}
                            onChange={handleInputChange}
                            required
                            rows="4"
                            className="w-full p-2 border rounded"
                            placeholder="Enter product description..."
                        />
                    </div>
                    <div className="form-group">
                        <label>Prompt Limit:</label>
                        <input
                            type="number"
                            name="promptLimit"
                            value={productData.promptLimit}
                            onChange={handleInputChange}
                            required
                            min="0"
                        />
                    </div>
                    <div className="form-group">
                        <label>Access Period (days):</label>
                        <input
                            type="number"
                            name="accessPeriodDays"
                            value={productData.accessPeriodDays}
                            onChange={handleInputChange}
                            required
                            min="1"
                            max="365"
                        />
                        <small className="text-gray-500">
                            Number of days users can access this product after purchase
                        </small>
                    </div>
                    <div className="form-group">
                        <label>Pages:</label>
                        <MultiSelect
                            options={pages}
                            value={productData.pages}
                            onChange={handlePagesChange}
                            placeholder="Select pages..."
                        />
                    </div>
                    <div className="form-group">
                        <label>Categories:</label>
                        <MultiSelect
                            options={categories}
                            value={productData.category}
                            onChange={handleCategoryChange}
                            placeholder="Select categories..."
                        />
                    </div>
                    <button className="sub-button" type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Product'}
                    </button>
                </form>
            </main>

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
            `}</style>
        </>
    );
}
