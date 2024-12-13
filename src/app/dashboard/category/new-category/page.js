'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth';
import { MdClose } from 'react-icons/md';
import MultiSelect from '@/components/MultiSelect';

export default function CreateCategory() {
    const [categoryData, setCategoryData] = useState({
        name: '',
        pages: []
    });
    const [availablePages, setAvailablePages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const { getToken } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchPages = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('https://ub.mo7tawa.store/api/pages/all', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) throw new Error('Failed to fetch pages');
                const data = await response.json();
                setAvailablePages(data.pages);
            } catch (err) {
                setErrorMessage("Error fetching pages: " + err.message);
            }
        };
        fetchPages();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCategoryData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handlePageSelection = (selectedPages) => {
        setCategoryData(prevData => ({ ...prevData, pages: selectedPages }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const response = await fetch('https://ub.mo7tawa.store/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(categoryData),
            });

            if (!response.ok) {
                throw new Error('Failed to create the category');
            }

            setSuccessMessage("Category created successfully");
            router.push('/dashboard/category');
        } catch (err) {
            setErrorMessage("Error creating the category: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">Create New Category</h3>
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
                        <label>Category Name:</label>
                        <input
                            type="text"
                            name="name"
                            value={categoryData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Select Pages:</label>
                        <MultiSelect
                            options={availablePages}
                            value={categoryData.pages}
                            onChange={handlePageSelection}
                            placeholder="Select pages..."
                        />
                    </div>
                    <button className='sub-button' type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Category'}
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
