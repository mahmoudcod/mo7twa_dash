'use client';
import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdOutlineEdit, MdDelete } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import Link from 'next/link';
import { FaEye } from "react-icons/fa";
import { useAuth } from '@/app/auth';
import axios from 'axios';

const API_BASE_URL = 'https://mern-ordring-food-backend.onrender.com';

export default function Users() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [users, setUsers] = useState([]);
    const { getToken } = useAuth();
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingAccess, setLoadingAccess] = useState({}); // Track loading state for each user
    const pageSize = 30;
    const [token, setToken] = useState(null);
    const [products, setProducts] = useState([]);
    const [userProducts, setUserProducts] = useState({}); // Track products for each user

    useEffect(() => {
        const fetchToken = () => {
            const retrievedToken = getToken();
            setToken(retrievedToken);
        };
        fetchToken();
    }, [getToken]);

    useEffect(() => {
        if (token) {
            fetchUsers();
            fetchProducts();
        }
    }, [currentPage, token]);

    // Fetch users with their products
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/auth/admin/users`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: currentPage,
                    limit: pageSize,
                },
            });
            setUsers(response.data.users);
            setTotalCount(response.data.totalCount);

            // Fetch product access for each user
            const productAccess = {};
            await Promise.all(response.data.users.map(async (user) => {
                try {
                    const productsResponse = await axios.get(`${API_BASE_URL}/api/auth/admin/users/${user._id}/products`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    productAccess[user._id] = productsResponse.data.products;
                } catch (error) {
                    console.error(`Error fetching products for user ${user._id}:`, error);
                    productAccess[user._id] = [];
                }
            }));
            setUserProducts(productAccess);
        } catch (error) {
            setErrorMessage("خطأ في جلب المستخدمين: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(response.data.products);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    // Enhanced assignProductToUser with loading state and better error handling
    const assignProductToUser = async (userId, productId) => {
        if (!productId) return; // Don't proceed if no product is selected

        setLoadingAccess({ ...loadingAccess, [userId]: true });
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            // Check if user already has access to this product
            const userCurrentProducts = userProducts[userId] || [];
            if (userCurrentProducts.some(p => p._id === productId)) {
                setErrorMessage("المستخدم لديه بالفعل حق الوصول إلى هذا المنتج");
                return;
            }

            const response = await axios.post(
                `${API_BASE_URL}/api/products/${productId}/grant-access`,
                { userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccessMessage(`تم منح الوصول للمنتج بنجاح`);

            // Update local state with new product access
            setUserProducts(prev => ({
                ...prev,
                [userId]: [...(prev[userId] || []), response.data.product]
            }));

        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            setErrorMessage(`خطأ أثناء منح الوصول للمنتج: ${errorMsg}`);
        } finally {
            setLoadingAccess({ ...loadingAccess, [userId]: false });
        }
    };
    const handleDeleteUser = async (userId) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            await axios.delete(`${API_BASE_URL}/api/auth/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccessMessage("تم الحذف بنجاح");
            fetchUsers();
        } catch (error) {
            setErrorMessage("خطأ أثناء الحذف: " + error.message);
        }
    };
    const confirmUser = async (userId) => {
        try {
            await axios.post(`${API_BASE_URL}/api/auth/admin/confirm-user/${userId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccessMessage("تم تأكيد المستخدم بنجاح");
            fetchUsers();
        } catch (error) {
            setErrorMessage("خطأ أثناء تأكيد المستخدم: " + error.message);
        }
    };


    const toggleUserSelection = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const selectAllUsers = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(user => user._id));
        }
    };
    const revokeProductAccess = async (userId, productId, productName) => {
    if (!confirm(`هل أنت متأكد من أنك تريد إلغاء وصول المستخدم إلى ${productName}؟`)) {
        return;
    }

    setLoadingAccess({ ...loadingAccess, [userId]: true });
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
        await axios.delete(
            `${API_BASE_URL}/api/auth/admin/users/${userId}/products/${productId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // Update local state to remove the product
        setUserProducts(prev => ({
            ...prev,
            [userId]: prev[userId].filter(product => product._id !== productId)
        }));

        setSuccessMessage('تم إلغاء الوصول إلى المنتج بنجاح');
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        setErrorMessage(`خطأ أثناء إلغاء الوصول إلى المنتج: ${errorMsg}`);
    } finally {
        setLoadingAccess({ ...loadingAccess, [userId]: false });
    }
};

    const deleteSelectedUsers = async () => {
        const confirmDelete = window.confirm("هل انت متاكد انك تريد حذف المستخدمين المختارين?");
        if (confirmDelete) {
            try {
                await Promise.all(selectedUsers.map(userId => handleDeleteUser(userId)));
                setSelectedUsers([]);
            } catch (error) {
                console.error("خطأ أثناء الحذف:", error.message);
            }
        }
    };

    const formatArabicDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('ar', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            timeZone: 'UTC'
        });
    };

    // Pagination logic
    const totalPages = Math.ceil(totalCount / pageSize);
    const maxPagesToShow = 5;
    const middlePage = Math.ceil(maxPagesToShow / 2);
    let startPage = currentPage <= middlePage ? 1 : currentPage - middlePage + 1;
    let endPage = startPage + maxPagesToShow - 1;
    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
            <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={currentPage === i ? "act-num page-num" : "page-num"}
            >
                {i}
            </button>
        );
    }

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    if (loading) return <div className="loading-spinner">جاري التحميل...</div>;

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">المستخدمين: {totalCount}</h3>
                           <Link href="/dashboard/users/new-user" className="addButton">
                    Add New user
                </Link>
                </div>

                {selectedUsers.length > 0 && (
                    <button className='delete-button' onClick={deleteSelectedUsers}>
                        <MdDelete /> حذف جميع المختارين
                    </button>
                )}

                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" checked={selectedUsers.length === users.length} onChange={selectAllUsers} /></th>
                                <th>البريد الإلكتروني</th>
                                <th>رقم الهاتف</th>
                                <th>الدولة</th>
                                <th>مؤكد</th>
                                <th>المنتجات الحالية</th>
                                <th>إضافة منتج</th>
                                <th>الإعدادات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id}>
                                    <td><input type='checkbox' checked={selectedUsers.includes(user._id)} onChange={() => toggleUserSelection(user._id)} /></td>
                                    <td>{user.email}</td>
                                    <td>{user.phone}</td>
                                    <td>{user.country}</td>
                                    <td>{user.isConfirmed ? 'نعم' : 'لا'}</td>
                               <td>
    <div className="current-products">
        {userProducts[user._id]?.map(product => (
            <span key={product._id} className="product-tag">
                {product.name}
                <button
                    onClick={() => revokeProductAccess(user._id, product._id, product.name)}
                    className="revoke-access-btn"
                    disabled={loadingAccess[user._id]}
                >
                    <RiDeleteBin6Line className="delete-icon" />
                </button>
            </span>
        ))}
    </div>
</td>

                                    <td>
                                        <div className="product-assign-container">
                                            <select
                                                onChange={(e) => assignProductToUser(user._id, e.target.value)}
                                                disabled={loadingAccess[user._id]}
                                                defaultValue=""
                                                className="product-select"
                                            >
                                                <option value="">اختر المنتج</option>
                                                {products
                                                    .filter(product => !userProducts[user._id]?.some(p => p._id === product._id))
                                                    .map((product) => (
                                                        <option key={product._id} value={product._id}>
                                                            {product.name}
                                                        </option>
                                                    ))}
                                            </select>
                                            {loadingAccess[user._id] && <span className="loading-indicator">...</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <RiDeleteBin6Line
                                            onClick={() => handleDeleteUser(user._id)}
                                            className='delete'
                                            style={{ margin: "0px 10px" }}
                                        />
                                              <Link href={`/dashboard/users/show/${user._id}`}>
                                        <FaEye style={{ color: '#4D4F5C' }} />
                                    </Link>   
                                        {!user.isConfirmed && (
                                            <button onClick={() => confirmUser(user._id)}>تأكيد</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pagination">
                    <button className='arrow' onClick={prevPage} disabled={currentPage === 1}>
                        <MdKeyboardArrowRight />
                    </button>
                    {pageNumbers}
                    <button className='arrow' onClick={nextPage} disabled={currentPage === totalPages}>
                        <MdKeyboardArrowLeft />
                    </button>
                </div>
            </main>
        </>
    );
}