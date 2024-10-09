'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth';

export default function CreatePage() {
    const [pageData, setPageData] = useState({ name: '', description: '', image: null, category: '', instructions: '' });
    const [categories, setCategories] = useState([]); // State to store fetched categories
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const { getToken } = useAuth();
    const router = useRouter();

    // Fetch categories on component mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('https://mern-ordring-food-backend.onrender.com/api/categories'); // Adjust the endpoint to your API
                if (!response.ok) throw new Error('Failed to fetch categories');
                const data = await response.json();
                setCategories(data); // Assuming the response is an array of categories
            } catch (err) {
                setErrorMessage("Error fetching categories: " + err.message);
            }
        };
        fetchCategories();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPageData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleImageChange = (e) => {
        setPageData((prevData) => ({ ...prevData, image: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        const token = getToken();
        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const formData = new FormData();
            formData.append('name', pageData.name);
            formData.append('description', pageData.description);
            formData.append('category', pageData.category); // Add the selected category to the form data
            formData.append('instructions', pageData.instructions); // Add user instructions to the form data
            if (pageData.image) {
                formData.append('image', pageData.image);
            }

            const response = await fetch('https://mern-ordring-food-backend.onrender.com/api/pages', {
                method: 'POST',
                headers: {
                    Authorization: token ? `Bearer ${token}` : '',
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to create the page');
            }

            setSuccessMessage("Page created successfully");
            router.push('/dashboard/pages'); // Redirect after successful creation
        } catch (err) {
            setErrorMessage("Error creating the page: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">Create New Page</h3>
                </div>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                <form className="content" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Page Name:</label>
                        <input
                            type="text"
                            name="name"
                            value={pageData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Description:</label>
                        <textarea
                            name="description"
                            value={pageData.description}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Category:</label>
                        <select
                            name="category"
                            value={pageData.category}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Select a category</option>
                            {categories.map((category) => (
                                <option key={category._id} value={category._id}> {/* Use _id as value */}
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Image:</label>
                        <input
                            type="file"
                            name="image"
                            onChange={handleImageChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>User Instructions:</label>
                        <textarea
                            name="instructions"
                            value={pageData.instructions}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <button className='sub-button' type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Page'}
                    </button>
                </form>
            </main>
        </>
    );
}
