'use client'

import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdOutlineEdit, MdDelete } from 'react-icons/md';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { useAuth } from '@/app/auth';
import Link from 'next/link';

export default function CategoryManagement() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [deleteSuccess, setDeleteSuccess] = useState(false);
    const [pageSize] = useState(10);
    const { getToken } = useAuth();
    const [categories, setCategories] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const fetchedToken = getToken();
                setToken(fetchedToken);
            } catch (err) {
                setError('Failed to fetch token');
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
        setError(null);
        try {
            const response = await fetch(`https://mern-ordring-food-backend.onrender.com/api/categories?page=${currentPage}&limit=${pageSize}`, {
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
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteSelectedCategories = async () => {
        if (window.confirm('Are you sure you want to delete selected categories?')) {
            try {
                await Promise.all(
                    selectedCategories.map((categoryId) =>
                        fetch(`https://mern-ordring-food-backend.onrender.com/api/categories/${categoryId}`, {
                            method: 'DELETE',
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        })
                    )
                );
                setSelectedCategories([]);
                setDeleteSuccess(true);
                fetchCategories();
            } catch (error) {
                setError('Error deleting selected categories');
            }
        }
    };

    const deleteCategory = async (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await fetch(`https://mern-ordring-food-backend.onrender.com/api/categories/${categoryId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setDeleteSuccess(true);
                fetchCategories();
            } catch (error) {
                setError('Error deleting category');
            }
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

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

            {deleteSuccess && <div className="success-message">Deleted successfully</div>}
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
                                        <MdOutlineEdit style={{ color: '#4D4F5C' }} />
                                    </Link>
                                    <RiDeleteBin6Line
                                        onClick={() => deleteCategory(category._id)}
                                        className="delete"
                                        style={{ margin: '0px 10px' }}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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