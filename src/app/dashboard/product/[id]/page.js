'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth';
import { MdClose } from 'react-icons/md';
import MultiSelect from '@/components/MultiSelect';

export default function EditProduct({ params }) {
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
    const [categoryPages, setCategoryPages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const { getToken } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = {
                    Authorization: token ? `Bearer ${token}` : '',
                };

                const productResponse = await fetch(`https://ub.mo7tawa.store/api/products/${params.id}`, {
                    headers
                });
                if (!productResponse.ok) throw new Error('Failed to fetch product');
                const product = await productResponse.json();

                const normalizedCategories = product.category ? product.category.map(cat => (typeof cat === 'object' ? cat._id : cat)) : [];
                const normalizedPages = product.pages ? product.pages.map(page => (typeof page === 'object' ? page._id : page)) : [];

                // Fetch pages for initial categories
                const pagesInCategories = new Set();
                await Promise.all(normalizedCategories.map(async (categoryId) => {
                    const categoryResponse = await fetch(`https://ub.mo7tawa.store/api/categories/${categoryId}`, { headers });
                    if (categoryResponse.ok) {
                        const data = await categoryResponse.json();
                        if (data.pages) {
                            data.pages.forEach(page => pagesInCategories.add(typeof page === 'object' ? page._id : page));
                        }
                    }
                }));

                setCategoryPages(Array.from(pagesInCategories));

                setProductData({
                    ...product,
                    accessPeriodDays: product.accessPeriodDays || 30,
                    category: normalizedCategories,
                    pages: normalizedPages.filter(pageId => !pagesInCategories.has(pageId))
                });

                const categoryResponse = await fetch('https://ub.mo7tawa.store/api/categories', { headers });
                if (!categoryResponse.ok) throw new Error('Failed to fetch categories');
                const categoryData = await categoryResponse.json();
                setCategories(categoryData.categories || []);

                const pageResponse = await fetch('https://ub.mo7tawa.store/api/pages/all', { headers });
                if (!pageResponse.ok) throw new Error('Failed to fetch pages');
                const pageData = await pageResponse.json();
                setPages(pageData.pages || []);
            } catch (err) {
                setErrorMessage(err.message);
            }
        };

        fetchData();
    }, [params.id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProductData(prev => ({ ...prev, [name]: value }));
    };

    const handlePagesChange = (selectedPages) => {
        setProductData(prev => ({ ...prev, pages: selectedPages }));
    };

    const handleCategoryChange = async (selectedCategories) => {
        setProductData(prev => ({ ...prev, category: selectedCategories }));
        
        try {
            const token = localStorage.getItem('token');
            const headers = {
                Authorization: token ? `Bearer ${token}` : '',
            };

            // Fetch pages for all selected categories
            const pagesInCategories = new Set();
            await Promise.all(selectedCategories.map(async (categoryId) => {
                const response = await fetch(`https://ub.mo7tawa.store/api/categories/${categoryId}`, { headers });
                if (response.ok) {
                    const data = await response.json();
                    if (data.pages) {
                        data.pages.forEach(page => pagesInCategories.add(typeof page === 'object' ? page._id : page));
                    }
                }
            }));

            setCategoryPages(Array.from(pagesInCategories));

            // Remove any selected pages that are now in the selected categories
            setProductData(prev => ({
                ...prev,
                pages: prev.pages.filter(pageId => !pagesInCategories.has(pageId))
            }));
        } catch (error) {
            console.error('Error fetching category pages:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const token = getToken();
            const submissionData = {
                name: productData.name,
                description: productData.description,
                promptLimit: parseInt(productData.promptLimit, 10),
                accessPeriodDays: parseInt(productData.accessPeriodDays, 10),
                pages: productData.pages,
                category: productData.category
            };

            const response = await fetch(`https://ub.mo7tawa.store/api/products/${params.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify(submissionData)
            });

            if (!response.ok) {
                const responseData = await response.json();
                throw new Error(responseData.message || 'Failed to update the product');
            }

            setSuccessMessage("Product updated successfully");
        } catch (err) {
            setErrorMessage("Error updating the product: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">Edit Product</h3>
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
                            value={productData.name || ''}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Description:</label>
                        <textarea
                            name="description"
                            value={productData.description || ''}
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
                            value={productData.promptLimit || 0}
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
                            value={productData.accessPeriodDays || 30}
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
                            options={pages.filter(page => !categoryPages.includes(page._id))}
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
                        {loading ? 'Updating...' : 'Update Product'}
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
