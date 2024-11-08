'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth';

export default function CreateProduct() {
    const [productData, setProductData] = useState({
        name: '',
        promptLimit: 0,
        accessPeriodDays: 30, // Default to 30 days
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

    // Fetch categories and pages on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token')
                const headers = {
                    Authorization: token ? `Bearer ${token}` : '',
                };

                // Fetch categories
                const categoryResponse = await fetch('https://mern-ordring-food-backend.onrender.com/api/categories', {
                    headers
                });
                if (!categoryResponse.ok) throw new Error('Failed to fetch categories');
                const categoryData = await categoryResponse.json();
                setCategories(categoryData.categories);

                // Fetch pages
                const pageResponse = await fetch('https://mern-ordring-food-backend.onrender.com/api/pages/all', {
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

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProductData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handlePagesChange = (e) => {
        const selectedPages = Array.from(e.target.selectedOptions).map(option => option.value);
        setProductData((prevData) => ({ ...prevData, pages: selectedPages }));
    };

    const handleCategoryChange = (e) => {
        const selectedCategories = Array.from(e.target.selectedOptions).map(option => option.value);
        setProductData((prevData) => ({ ...prevData, category: selectedCategories }));
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = getToken();
        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const response = await fetch('https://mern-ordring-food-backend.onrender.com/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({
                    ...productData,
                    accessPeriodDays: parseInt(productData.accessPeriodDays) // Ensure it's a number
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
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
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
                        <select
                            name="pages"
                            value={productData.pages}
                            onChange={handlePagesChange}
                            required
                            multiple
                            className="h-32"
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
                            value={productData.category}
                            onChange={handleCategoryChange}
                            required
                            multiple
                            className="h-32"
                        >
                            {categories.map((category) => (
                                <option key={category._id} value={category._id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button className="sub-button" type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Product'}
                    </button>
                </form>
            </main>
        </>
    );
}