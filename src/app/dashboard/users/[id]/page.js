'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation'; // For modern router handling
import axios from 'axios';

const API_BASE_URL = 'https://mern-ordring-food-backend.onrender.com';

export default function UserDetails() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id'); // Fetch the dynamic ID from the URL

    const [user, setUser] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchUserDetails();
        }
    }, [id]);

    const fetchUserDetails = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/auth/admin/users/${id}`);
            setUser(response.data);
        } catch (error) {
            setErrorMessage("خطأ في جلب تفاصيل المستخدم: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>جاري التحميل...</div>;
    if (errorMessage) return <div className="error-message">{errorMessage}</div>;

    return (
        <div className="user-details">
            <h1>تفاصيل المستخدم</h1>
            <p><strong>البريد الإلكتروني:</strong> {user.email}</p>
            <p><strong>رقم الهاتف:</strong> {user.phone}</p>
            <p><strong>الدولة:</strong> {user.country}</p>
            <p><strong>مؤكد:</strong> {user.isConfirmed ? 'نعم' : 'لا'}</p>
            <p><strong>التاريخ:</strong> {new Date(user.createdAt).toLocaleString('ar')}</p>
        </div>
    );
}
