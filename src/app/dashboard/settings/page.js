'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth';

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
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/auth/create-admin', {
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

            setSuccessMessage("تم إنشاء المسؤول بنجاح");
            router.push('/dashboard');
        } catch (error) {
            setErrorMessage("خطأ أثناء إنشاء المسؤول: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">إنشاء مسؤول جديد</h3>
                </div>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                <form className="content" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>البريد الإلكتروني:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>رقم الهاتف:</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>الدولة:</label>
                        <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>كلمة المرور:</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>رمز المسؤول السري:</label>
                        <input
                            type="password"
                            name="adminSecret"
                            value={formData.adminSecret}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button className="sub-button" type="submit" disabled={isLoading}>
                        {isLoading ? 'جاري الإنشاء...' : 'إنشاء مسؤول'}
                    </button>
                </form>
            </main>
        </>
    );
};

export default CreateAdminPage;