'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import Modal from 'react-modal';

const mdParser = new MarkdownIt();

function LinkImagePopup({ isOpen, onRequestClose, onSubmit }) {
    const [url, setUrl] = useState('');
    const [altText, setAltText] = useState('');

    const handleSubmit = () => {
        onSubmit({ url, altText });
        onRequestClose();
    };

    return (
        <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Link/Image Popup">
            <h2>Insert Link or Image</h2>
            <input
                type="text"
                placeholder="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
            />
            <input
                type="text"
                placeholder="Alt Text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
            />
            <button onClick={handleSubmit}>Insert</button>
        </Modal>
    );
}

export default function EditPage({ params }) {
    const { id } = params;
    const [pageData, setPageData] = useState({
        name: '',
        description: '',
        image: null,
        category: [],
        instructions: '',
        status: 'draft'
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { getToken } = useAuth();
    const router = useRouter();
    const [token, setToken] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const uploadImageToServer = async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('name', pageData.name);
        formData.append('description', pageData.description);
        formData.append('instructions', pageData.instructions);
        formData.append('status', pageData.status);
        
        pageData.category.forEach((categoryId) => {
            formData.append('category', categoryId);
        });

        const response = await fetch(`https://mern-ordring-food-backend.onrender.com/api/pages/${id}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload image');
        }

        const data = await response.json();
        return data.image;
    };

    const mdEditorConfig = {
        view: {
            menu: true,
            md: true,
            html: true
        },
        canView: {
            menu: true,
            md: true,
            html: true,
            fullScreen: true,
            hideMenu: true
        },
        onImageUpload: async (file) => {
            try {
                const imageUrl = await uploadImageToServer(file);
                return imageUrl;
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Failed to upload image. Please try again.');
                return '';
            }
        },
        onCustomIconClick: {
            image: () => setIsPopupOpen(true),
            link: () => setIsPopupOpen(true)
        }
    };

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
                    category: Array.isArray(data.category) ? data.category.map((cat) => cat._id) : [],
                    instructions: data.userInstructions,
                    status: data.status || 'draft'
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

    const handleCategoryCheckboxChange = (e, categoryId) => {
        if (e.target.checked) {
            setPageData((prevData) => ({
                ...prevData,
                category: [...prevData.category, categoryId]
            }));
        } else {
            setPageData((prevData) => ({
                ...prevData,
                category: prevData.category.filter((id) => id !== categoryId)
            }));
        }
    };

    const handleDescriptionChange = ({ text }) => {
        setPageData((prevData) => ({ ...prevData, description: text }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPageData((prevData) => ({ ...prevData, image: file }));
        }
    };

    const handleStatusChange = (e) => {
        setPageData((prevData) => ({ ...prevData, status: e.target.value }));
    };

    const handleIconClick = () => {
        setIsPopupOpen(true);
    };

    const handlePopupSubmit = async ({ url, altText }) => {
        if (url.startsWith('data:') || url.startsWith('blob:')) {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
                const imageUrl = await uploadImageToServer(file);
                url = imageUrl;
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Failed to upload image. Please try again.');
                return;
            }
        }

        const imageMarkdown = `![${altText}](${url})`;
        setPageData(prevData => ({
            ...prevData,
            description: prevData.description + '\n' + imageMarkdown
        }));
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
            formData.append('status', pageData.status);

            pageData.category.forEach((categoryId) => {
                formData.append('category', categoryId);
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

            setSuccessMessage('Page updated successfully');
            router.push('/dashboard/pages');
        } catch (err) {
            setErrorMessage('Error updating the page: ' + err.message);
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
                            renderHTML={(text) => mdParser.render(text)}
                            onChange={handleDescriptionChange}
                            config={mdEditorConfig}
                        />
                        <LinkImagePopup
                            isOpen={isPopupOpen}
                            onRequestClose={() => setIsPopupOpen(false)}
                            onSubmit={handlePopupSubmit}
                        />
                    </div>
                    <div className="form-group" style={{ width: '100%' }}>
                        <label>Boxing Bot:</label>
                        <textarea
                            value={pageData.instructions}
                            name="instructions"
                            onChange={handleInputChange}
                            rows="20"
                            style={{ width: '100%', direction: 'ltr' }}
                            placeholder="Enter detailed instructions here..."
                        />
                    </div>
                    <div className="form-group">
                        <label>Image:</label>
                        {pageData.image && typeof pageData.image === 'string' && (
                            <div>
                                <img src={pageData.image} alt="Current Page Image" style={{ maxWidth: '200px', maxHeight: '200px' }} />
                            </div>
                        )}
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
                    <div className="form-group">
                        <label>Status:</label>
                        <select
                            name="status"
                            value={pageData.status}
                            onChange={handleStatusChange}
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>
                    <button className="sub-button" type="submit" disabled={isLoading}>
                        {isLoading ? 'Updating...' : 'Save Changes'}
                    </button>
                </form>
            </main>
        </>
    );
}
