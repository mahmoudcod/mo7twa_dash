'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth';
import { MdClose } from 'react-icons/md';

const CreateAdminPage = () => {
    const router = useRouter();
    const { getToken } = useAuth();
    const token = getToken();

    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        country: '',
        password: '',
        adminSecret: ''
    });
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsLoading(true);

        try {
            const response = await fetch('https://ub.mo7tawa.store/api/auth/create-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error creating admin');
            }

            setSuccessMessage("Admin created successfully");
            router.push('/dashboard/users');
        } catch (error) {
            setErrorMessage("Error creating admin: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">create admin</h3>
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
                        <label> email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label> phone:</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>country:</label>
                        <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label> password:</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>  adminSecret:</label>
                        <input
                            type="password"
                            name="adminSecret"
                            value={formData.adminSecret}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button className="sub-button" type="submit" disabled={isLoading}>
                        {isLoading ? ' Creating...' : ' '}
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
};

export default CreateAdminPage;
