'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth';

export default function EditProduct({ params }) {
    const [productData, setProductData] = useState({
        name: '',
        promptLimit: 0,
        accessPeriodDays: 30, // Default to 30 days, like in CreateProduct
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
                const token = localStorage.getItem('token');
                const headers = {
                    Authorization: token ? `Bearer ${token}` : '',
                };

                // Fetch product data
                const productResponse = await fetch(`https://mern-ordring-food-backend.onrender.com/api/products/${params.id}`, {
                    headers
                });
                if (!productResponse.ok) throw new Error('Failed to fetch product');
                const product = await productResponse.json();

                // Normalize category and pages data
                const normalizedCategories = product.category ? product.category.map(cat => (typeof cat === 'object' ? cat._id : cat)) : [];
                const normalizedPages = product.pages ? product.pages.map(page => (typeof page === 'object' ? page._id : page)) : [];

                setProductData({
                    ...product,
                    accessPeriodDays: product.accessPeriodDays || 30,
                    category: normalizedCategories,
                    pages: normalizedPages
                });

                // Fetch categories
                const categoryResponse = await fetch('https://mern-ordring-food-backend.onrender.com/api/categories', { headers });
                if (!categoryResponse.ok) throw new Error('Failed to fetch categories');
                const categoryData = await categoryResponse.json();
                setCategories(categoryData.categories || []);

                // Fetch pages
                const pageResponse = await fetch('https://mern-ordring-food-backend.onrender.com/api/pages/all', { headers });
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

    const handlePagesChange = (e) => {
        const selectedPages = Array.from(e.target.selectedOptions, option => option.value);
        setProductData(prev => ({ ...prev, pages: selectedPages }));
    };

    const handleCategoryChange = (e) => {
        const selectedCategories = Array.from(e.target.selectedOptions, option => option.value);
        setProductData(prev => ({ ...prev, category: selectedCategories }));
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
                promptLimit: parseInt(productData.promptLimit, 10),
                accessPeriodDays: parseInt(productData.accessPeriodDays, 10),
                pages: productData.pages,
                category: productData.category
            };

            const response = await fetch(`https://mern-ordring-food-backend.onrender.com/api/products/${params.id}`, {
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
            router.push('/dashboard/product');
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
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
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
                        <select
                            name="pages"
                            multiple
                            className="h-32"
                            value={productData.pages || []}
                            onChange={handlePagesChange}
                            required
                        >
                            {pages.map((page) => (
                                <option key={page._id} value={page._id}>
                                    {page.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Categories:</label>
                        <select
                            name="category"
                            multiple
                            className="h-32"
                            value={productData.category || []}
                            onChange={handleCategoryChange}
                            required
                        >
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button className="sub-button" type="submit" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Product'}
                    </button>
                </form>
            </main>
        </>
    );
}
