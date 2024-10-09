'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth';

export default function EditPage({ params }) {
    const { id } = params; // Get the page id from the route params
    const [pageData, setPageData] = useState({ name: '', description: '', image: null, category: '', instructions: '' });
    const [categories, setCategories] = useState([]); // State to store the available categories
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { getToken } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const token = getToken();

        // Fetch the page data
        const fetchPage = async () => {
            setLoading(true);
            setErrorMessage(null);
            try {
                const response = await fetch(`http://localhost:8000/api/pages/${id}`, {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : '',
                    },
                });
                if (!response.ok) throw new Error('Failed to fetch page');
                const data = await response.json();
                setPageData({
                    name: data.name,
                    description: data.description,
                    image: data.image,
                    category: data.category,
                    instructions: data.userInstructions // Load user instructions as well
                });
            } catch (err) {
                setErrorMessage(err.message);
            } finally {
                setLoading(false);
            }
        };

        // Fetch the categories data
        const fetchCategories = async () => {
            const token = getToken();
            try {
                const response = await fetch('http://localhost:8000/api/categories', {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : '',
                    },
                });
                if (!response.ok) throw new Error('Failed to fetch categories');
                const data = await response.json();
                setCategories(data); // Store the fetched categories
            } catch (err) {
                setErrorMessage(err.message);
            }
        };

        fetchPage();
        fetchCategories();
    }, [id, getToken]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPageData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleImageChange = (e) => {
        setPageData((prevData) => ({ ...prevData, image: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = getToken();
        setErrorMessage(null);
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', pageData.name);
            formData.append('description', pageData.description);
            formData.append('instructions', pageData.instructions); // Include user instructions
            if (pageData.image) {
                formData.append('image', pageData.image);
            }
            formData.append('category', pageData.category); // Category ID is included

            const response = await fetch(`http://localhost:8000/api/pages/${id}`, {
                method: 'PUT',
                headers: {
                    Authorization: token ? `Bearer ${token}` : '',
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to update the page');
            }

            setSuccessMessage("Page updated successfully");
            router.push('/dashboard/pages');
        } catch (err) {
            setErrorMessage("Error updating the page: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (errorMessage) return <p>Error: {errorMessage}</p>;

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">Edit Page: {pageData.name}</h3>
                </div>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                <form className="content" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Page Name:</label>
                        <input
                            type="text"
                            value={pageData.name}
                            name="name"
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Description:</label>
                        <textarea
                            value={pageData.description}
                            name="description"
                            onChange={handleInputChange}
                            required
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
                    <div className="form-group">
                        <label>Image:</label>
                        <input
                            type="file"
                            onChange={handleImageChange}
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
                                <option key={category.id} value={category._id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>

                    </div>
                    <button className='sub-button' type="submit" disabled={isLoading}>
                        {isLoading ? 'Updating...' : 'Save Changes'}
                    </button>
                </form>
            </main>
        </>
    );
}
