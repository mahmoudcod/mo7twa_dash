'use client';
import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdOutlineEdit, MdDelete } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import Link from 'next/link';
import { useAuth } from '@/app/auth';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';
export default function Users() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [users, setUsers] = useState([]);
    const { getToken } = useAuth();
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const pageSize = 30;
    const [token, setToken] = useState(null); // New state for the token

    useEffect(() => {
        const fetchToken = () => {
            const retrievedToken = getToken();
            setToken(retrievedToken);
        };
        fetchToken();
    }, [getToken]);

    useEffect(() => {
        if (token) { // Only fetch users if the token is available
            fetchUsers();
        }
    }, [currentPage, token]); // Depend on token as well

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
            setUsers(response.data.users); // Assuming your API returns a structure with users
            setTotalCount(response.data.totalCount); // Assuming your API returns totalCount
        } catch (error) {
            setErrorMessage("خطأ في جلب المستخدمين: " + error.message);
        } finally {
            setLoading(false);
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

    if (loading) return <div>جاري التحميل...</div>;

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">المستخدمين: {totalCount}</h3>
                    {/* <Link href="/dashboard/users/new-user" className="addButton">إضافة مستخدم جديد</Link> */}
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
                                <th>تاريخ الإنشاء</th>
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
                                    <td>{formatArabicDate(user.createdAt)}</td>
                                    <td>
                                        {/* <Link href={`/dashboard/users/${user._id}`}>
                                            <MdOutlineEdit style={{ color: "#4D4F5C" }} />
                                        </Link> */}
                                        <RiDeleteBin6Line onClick={() => handleDeleteUser(user._id)} className='delete' style={{ margin: "0px 10px" }} />
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
                    <button className='arrow' onClick={prevPage} disabled={currentPage === 1}><MdKeyboardArrowRight /></button>
                    {pageNumbers}
                    <button className='arrow' onClick={nextPage} disabled={currentPage === totalPages}><MdKeyboardArrowLeft /></button>
                </div>
            </main>
        </>
    );
}
