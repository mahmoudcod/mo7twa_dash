'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth';

export default function Register() {
    const [userData, setUserData] = useState({
        email: '',
        phone: '',
        country: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const { getToken } = useAuth();
    const router = useRouter();

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData((prevData) => ({ ...prevData, [name]: value }));
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const response = await fetch('https://mern-ordring-food-backend.onrender.com/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to register');
            }

            setSuccessMessage("Registration successful. Waiting for admin confirmation.");
            router.push('/dashboard/users');
        } catch (err) {
            setErrorMessage("Error during registration: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">Register New Account</h3>
                </div>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                <form className="content" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={userData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Phone Number:</label>
                        <input
                            type="tel"
                            name="phone"
                            value={userData.phone}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Country:</label>
                        <input
                            type="text"
                            name="country"
                            value={userData.country}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            name="password"
                            value={userData.password}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <button className="sub-button" type="submit" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
            </main>
        </>
    );
}