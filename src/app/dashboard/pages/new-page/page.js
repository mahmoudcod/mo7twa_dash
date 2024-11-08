'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

export default function CreatePage() {
    const [pageData, setPageData] = useState({
        name: '',
        description: '',
        image: null,
        category: [],
        instructions: ''
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const { getToken } = useAuth();
    const router = useRouter();

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch('https://mern-ordring-food-backend.onrender.com/api/categories', {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : '',
                    },
                });
                if (!response.ok) throw new Error('Failed to fetch categories');
                const data = await response.json();
                if (Array.isArray(data.categories)) {
                    setCategories(data.categories);
                } else {
                    throw new Error('Categories data is not an array');
                }
            } catch (err) {
                setErrorMessage(err.message);
            }
        };

        fetchCategories();
    }, []);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPageData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleDescriptionChange = ({ text }) => {
        setPageData((prevData) => ({ ...prevData, description: text }));
    };

    const handleImageChange = (e) => {
        setPageData((prevData) => ({ ...prevData, image: e.target.files[0] }));
    };

    const handleCategoryChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
        setPageData((prevData) => ({ ...prevData, category: selectedOptions }));
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = getToken();
        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const formData = new FormData();
            formData.append('name', pageData.name);
            formData.append('description', pageData.description);
            pageData.category.forEach((categoryId, index) => {
                formData.append(`category`, categoryId);  // Append each category separately
            });
            formData.append('instructions', pageData.instructions);
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
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create the page');
            }

            setSuccessMessage("Page created successfully");
            router.push('/dashboard/pages');
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
                    <div className="form-group" style={{ width: '100%' }}>
                        <label>Description:</label>
                        <MdEditor
                            value={pageData.description}
                            style={{ height: '300px' }}
                            renderHTML={(text) => mdParser.render(text)}
                            onChange={handleDescriptionChange}
                            view={{ html: false }}  // Disables the preview
                        />
                    </div>
                    <div className="form-group">
                        <label>Categories:</label>
                        <select
                            name="categories"
                            value={pageData.category}
                            onChange={handleCategoryChange}
                            required
                            multiple
                        >
                            {categories.map((category) => (
                                <option key={category._id} value={category._id}>
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
