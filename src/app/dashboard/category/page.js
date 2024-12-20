'use client'

import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdOutlineEdit, MdDelete, MdClose } from 'react-icons/md';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { useAuth } from '@/app/auth';
import Link from 'next/link';

export default function CategoryManagement() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [pageSize] = useState(10);
    const { getToken } = useAuth();
    const [categories, setCategories] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const fetchedToken = getToken();
                setToken(fetchedToken);
            } catch (err) {
                setErrorMessage('Failed to fetch token');
            }
        };
        fetchToken();
    }, [getToken]);

    useEffect(() => {
        if (token) {
            fetchCategories();
        }
    }, [currentPage, token]);

    const fetchCategories = async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const response = await fetch(`https://ub.mo7tawa.store/api/categories?page=${currentPage}&limit=${pageSize}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch categories');
            const data = await response.json();
            setCategories(data.categories);
            setTotalCount(data.totalCount);
            setTotalPages(data.totalPages);
        } catch (err) {
            setErrorMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteSelectedCategories = async () => {
        if (window.confirm('Are you sure you want to delete selected categories?')) {
            try {
                await Promise.all(
                    selectedCategories.map((categoryId) =>
                        fetch(`https://ub.mo7tawa.store/api/categories/${categoryId}`, {
                            method: 'DELETE',
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        })
                    )
                );
                setSelectedCategories([]);
                setSuccessMessage("Selected categories deleted successfully");
                fetchCategories();
            } catch (error) {
                setErrorMessage('Error deleting selected categories');
            }
        }
    };

    const deleteCategory = async (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await fetch(`https://ub.mo7tawa.store/api/categories/${categoryId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setSuccessMessage("Category deleted successfully");
                fetchCategories();
            } catch (error) {
                setErrorMessage('Error deleting category');
            }
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <main className="head">
            <div className="head-title">
                <h3 className="title">Categories: {totalCount}</h3>
                <Link href="/dashboard/category/new-category" className="addButton">
                    Add New Category
                </Link>
            </div>

            {selectedCategories.length > 0 && (
                <button className="delete-button" onClick={deleteSelectedCategories}>
                    <MdDelete />
                    Delete Selected
                </button>
            )}

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

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.length === categories.length}
                                    onChange={() => {
                                        if (selectedCategories.length === categories.length) {
                                            setSelectedCategories([]);
                                        } else {
                                            setSelectedCategories(categories.map((category) => category._id));
                                        }
                                    }}
                                />
                            </th>
                            <th>Category Name</th>
                            <th>Subcategories</th>
                            <th>Settings</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((category) => (
                            <tr key={category._id}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedCategories.includes(category._id)}
                                        onChange={() => {
                                            const updatedSelectedCategories = selectedCategories.includes(category._id)
                                                ? selectedCategories.filter((id) => id !== category._id)
                                                : [...selectedCategories, category._id];
                                            setSelectedCategories(updatedSelectedCategories);
                                        }}
                                    />
                                </td>
                                <td>{category.name}</td>
                                <td>
                                    {category.subcategories && category.subcategories.map(sub => sub.name).join(', ')}
                                </td>
                                <td>
                                    <Link href={`/dashboard/category/${category._id}`}>
                                        <MdOutlineEdit style={{ color: '#4D4F5C', fontSize: '20px', transition: 'color 0.3s' }} className="icon" />
                                    </Link>
                                    <RiDeleteBin6Line
                                        onClick={() => deleteCategory(category._id)}
                                        className="delete icon"
                                        style={{ margin: '0px 10px', cursor: 'pointer', color: '#4D4F5C', fontSize: '20px', transition: 'color 0.3s' }}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .icon:hover {
                    color: #3B3D4A;
                }
            `}</style>

            <div className="pagination">
                <button
                    className="arrow"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    <MdKeyboardArrowLeft />
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                    className="arrow"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    <MdKeyboardArrowRight />
                </button>
            </div>
        </main>
    );
}
