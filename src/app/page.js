"use client"
import React, { useState } from 'react';
import { useAuth } from './auth';

export default function LoginPage() {
    const [username, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Set loading state

        try {
            await login(username, password);
        } catch (error) {
            console.error('Login failed:', error.message);
            setErrorMessage(error.message);
        } finally {
            setLoading(false); // Reset loading state
        }
    };

    return (
        <form className="login-page" onSubmit={handleSubmit}>
            <div className='login'>
                <img src='/favicon.svg' alt="Logo" />
            </div>

            <div className="login-info">
                <div className="login-content">
                    <p>Welcome back! Please log in to your account</p>
                    <input type='text' required value={username} onChange={(e) => setIdentifier(e.target.value)} placeholder="Email" />
                    <input type='password' required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                    <button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Log In'}</button>
                    {errorMessage && <p style={{ color: 'red' }} className="error-message">{errorMessage}</p>}
                </div>
            </div>
        </form>
    );
}
