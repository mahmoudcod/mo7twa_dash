'use client'
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

export default function CreatePage() {
    const [pageData, setPageData] = useState({
        name: '',
        description: '',
        image: null,
        category: [],
        instructions: '',
        status: 'draft'
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [token, setToken] = useState(null);
    const { getToken } = useAuth();
    const router = useRouter();

    // Separate function for uploading markdown editor images
    const uploadMarkdownImage = async (file) => {
        const currentToken = getToken();
        if (!currentToken) {
            throw new Error('Authentication token not found');
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('https://mern-ordring-food-backend.onrender.com/api/pages/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to upload image');
            }

            const data = await response.json();
            return data.url;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
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
                const imageUrl = await uploadMarkdownImage(file);
                return imageUrl;
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Failed to upload image: ' + (error.message || 'Unknown error'));
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
                console.error(err.message);
            }
        };

        if (token) {
            fetchCategories();
        }
    }, [getToken]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPageData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleCategoryChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
        setPageData((prevData) => ({ ...prevData, category: selectedOptions }));
    };

    const handleDescriptionChange = ({ text }) => {
        setPageData((prevData) => ({ ...prevData, description: text }));
    };

    const handleImageChange = (e) => {
        setPageData((prevData) => ({ ...prevData, image: e.target.files[0] }));
    };

    const handleStatusChange = (e) => {
        const { value } = e.target;
        setPageData((prevData) => ({ ...prevData, status: value }));
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
                const imageUrl = await uploadMarkdownImage(file);
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

    // Validate if page can be published
    const canPublish = () => {
        return pageData.name && 
               pageData.description && 
               pageData.category.length > 0 && 
               pageData.instructions;
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = getToken();
        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        // Validate if trying to publish
        if (pageData.status === 'published' && !canPublish()) {
            setErrorMessage('Cannot publish: Please fill in all required fields');
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', pageData.name);
            formData.append('description', pageData.description);
            pageData.category.forEach((categoryId) => {
                formData.append('category', categoryId);
            });
            formData.append('instructions', pageData.instructions);
            formData.append('status', pageData.status);
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

            setSuccessMessage(`Page created successfully as ${pageData.status}`);
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
                            config={mdEditorConfig}
                        />
                        <LinkImagePopup
                            isOpen={isPopupOpen}
                            onRequestClose={() => setIsPopupOpen(false)}
                            onSubmit={handlePopupSubmit}
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
                    <div className="form-group" style={{ width: '100%' }}>
                        <label>Boxing Bot:</label>
                        <textarea
                            value={pageData.instructions}
                            name="instructions"
                            onChange={handleInputChange}
                            rows="10"
                            style={{ width: '100%', direction: 'ltr', overflowY: 'scroll' }}
                            placeholder="Enter detailed instructions here..."
                        />
                    </div>
                    <div className="form-group">
                        <label>Status:</label>
                        <select
                            name="status"
                            value={pageData.status}
                            onChange={handleStatusChange}
                            className="status-select"
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                        {pageData.status === 'published' && !canPublish() && (
                            <small className="status-warning">
                                All required fields must be filled to publish
                            </small>
                        )}
                    </div>
                    <button 
                        className='sub-button' 
                        type="submit" 
                        disabled={loading || (pageData.status === 'published' && !canPublish())}
                    >
                        {loading ? 'Creating...' : `Create Page as ${pageData.status}`}
                    </button>
                </form>
            </main>

            <style jsx>{`
                .status-select {
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    width: 100%;
                    margin-top: 5px;
                }
                .status-warning {
                    color: #ff6b6b;
                    font-size: 12px;
                    margin-top: 5px;
                    display: block;
                }
                .sub-button:disabled {
                    background-color: #cccccc;
                    cursor: not-allowed;
                }
            `}</style>
        </>
    );
}
