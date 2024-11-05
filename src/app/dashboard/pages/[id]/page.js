'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

export default function EditPage({ params }) {
    const { id } = params;
    const [pageData, setPageData] = useState({ name: '', description: '', image: null, category: [], instructions: '' });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { getToken } = useAuth();
    const router = useRouter();
    const [token, setToken] = useState(null);

    useEffect(() => {
        const token = getToken();
        setToken(token);

        const fetchPage = async () => {
            setLoading(true);
            setErrorMessage(null);
            try {
                const response = await fetch(`https://mern-ordring-food-backend.onrender.com/api/pages/${id}`, {
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
                    category: Array.isArray(data.categoyr) ? data.category : [],
                    instructions: data.userInstructions
                });
            } catch (err) {
                setErrorMessage(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchCategories = async () => {
            try {
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

        if (token) {
            fetchPage();
            fetchCategories();
        }
    }, [id, getToken, token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPageData((prevData) => ({ ...prevData, [name]: value }));
    };

    // const handleCategoryChange = (e) => {
    //     const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    //     setPageData(prevData => ({ ...prevData, category: selectedOptions }));
    // };
    const handleCategoryCheckboxChange = (e, categoryId) => {
        if (e.target.checked) {
            // Add category if checked
            setPageData(prevData => ({
                ...prevData,
                category: [...prevData.category, categoryId]
            }));
        } else {
            // Remove category if unchecked
            setPageData(prevData => ({
                ...prevData,
                category: prevData.category.filter(id => id !== categoryId)
            }));
        }
    };



    const handleDescriptionChange = ({ text }) => {
        setPageData((prevData) => ({ ...prevData, description: text }));
    };

    const handleImageChange = (e) => {
        setPageData((prevData) => ({ ...prevData, image: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', pageData.name);
            formData.append('description', pageData.description);
            formData.append('instructions', pageData.instructions);

            // Append the categories as an array of IDs
            pageData.category.forEach(categoryId => {
                formData.append('category', categoryId);  // Assuming the backend accepts multiple 'category' fields
            });

            if (pageData.image) {
                formData.append('image', pageData.image);
            }

            const response = await fetch(`https://mern-ordring-food-backend.onrender.com/api/pages/${id}`, {
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
                    <div className="form-group" style={{ width: '100%' }}>
                        <label>Description:</label>
                        <MdEditor
                            value={pageData.description}
                            style={{ height: '300px' }}
                            renderHTML={(text) => mdParser.render(text)}
                            onChange={handleDescriptionChange}
                            view={{ html: false }}  // This disables the preview
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
                        <label>Categories:</label>
                        <div>
                            {categories.map((category) => (
                                <div key={category._id}>
                                    <input
                                        type="checkbox"
                                        id={category._id}
                                        value={category._id}
                                        checked={pageData.category.includes(category._id)}
                                        onChange={(e) => handleCategoryCheckboxChange(e, category._id)}
                                    />
                                    <label htmlFor={category._id}>{category.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>


                    <button className='sub-button' type="submit" disabled={isLoading}>
                        {isLoading ? 'Updating...' : 'Save Changes'}
                    </button>
                </form>
            </main>
        </>
    );
}