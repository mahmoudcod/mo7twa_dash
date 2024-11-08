'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';

const AuthContext = createContext();

const axiosWithAuth = (token) => {
    const instance = axios.create({
        baseURL: 'https://mern-ordring-food-backend.onrender.com/api/auth',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return instance;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initializeAuth = async () => {
            const token = Cookies.get('jwt');
            if (token) {
                setUser(token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await axios.post('https://mern-ordring-food-backend.onrender.com/api/auth/login', { email, password });
            const token = response.data.token;
            if (!token) throw new Error('JWT token not found in response');
            setUser(token);
            Cookies.set('jwt', token, { expires: 7 });
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            router.push('/dashboard/pages');
        } catch (error) {
            console.error('Login failed:', error);
            throw new Error('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
        }
    };

    const logout = () => {
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        Cookies.remove('jwt');
        router.push('/');
    };

    const getToken = () => user;


    return (
        <AuthContext.Provider value={{ user, login, logout, getToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);