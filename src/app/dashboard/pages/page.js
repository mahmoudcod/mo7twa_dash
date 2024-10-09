'use client';
import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdOutlineEdit, MdDelete } from 'react-icons/md';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { useAuth } from '@/app/auth';
import Link from 'next/link';

export default function Post() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPosts, setSelectedPosts] = useState([]);
    const [deleteSuccess, setDeleteSuccess] = useState(false);
    const [pageSize] = useState(10);
    const { getToken } = useAuth();
    const [pages, setPages] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSmallScreen, setSmallScreen] = useState(false);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const isSmallScreen = window.innerWidth < 768;
        setSmallScreen(isSmallScreen);
    }, []);

    useEffect(() => {
        const fetchToken = async () => {
            const fetchedToken = getToken();
            setToken(fetchedToken);
            await fetchPages(fetchedToken);
        };
        fetchToken();
    }, [getToken]);

    const fetchPages = async (token) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`https://mern-ordring-food-backend.onrender.com/api/pages/all?page=${currentPage}&limit=${pageSize}`, {
                headers: {
                    Authorization: token ? `Bearer ${token}` : '',
                },
            });
            if (!response.ok) throw new Error('Failed to fetch pages');
            const data = await response.json();
            setPages(data.pages);
            setTotalCount(data.totalCount);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchPages(token);
        }
    }, [currentPage, token]);

    const deleteSelectedPosts = async () => {
        if (window.confirm('Are you sure you want to delete selected pages?')) {
            try {
                await Promise.all(
                    selectedPosts.map((postId) =>
                        fetch(`https://mern-ordring-food-backend.onrender.com/api/pages/${postId}`, {
                            method: 'DELETE',
                            headers: {
                                Authorization: token ? `Bearer ${token}` : '',
                            },
                        })
                    )
                );
                setSelectedPosts([]);
                setDeleteSuccess(true);
                fetchPages(token);
            } catch (error) {
                console.error('Error deleting selected pages:', error.message);
            }
        }
    };

    const deletePage = async (pageId) => {
        if (window.confirm('Are you sure you want to delete this page?')) {
            try {
                await fetch(`https://mern-ordring-food-backend.onrender.com/api/pages/${pageId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: token ? `Bearer ${token}` : '',
                    },
                });
                setDeleteSuccess(true);
                fetchPages(token);
            } catch (error) {
                console.error('Error deleting page:', error.message);
            }
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <main className="head">
            <div className="head-title">
                <h3 className="title">Pages: {totalCount}</h3>
                <Link href="/dashboard/pages/new-page" className="addButton">
                    Add New Page
                </Link>
            </div>

            {selectedPosts.length > 0 && (
                <button className="delete-button" onClick={deleteSelectedPosts}>
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
                                    checked={selectedPosts.length === pages.length}
                                    onChange={() => {
                                        if (selectedPosts.length === pages.length) {
                                            setSelectedPosts([]);
                                        } else {
                                            setSelectedPosts(pages.map((page) => page._id));
                                        }
                                    }}
                                />
                            </th>
                            <th>Page Name</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Image</th>
                            <th>Settings</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pages.map((item) => (
                            <tr key={item._id}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedPosts.includes(item._id)}
                                        onChange={() => {
                                            const updatedSelectedPosts = selectedPosts.includes(item._id)
                                                ? selectedPosts.filter((id) => id !== item._id)
                                                : [...selectedPosts, item._id];
                                            setSelectedPosts(updatedSelectedPosts);
                                        }}
                                    />
                                </td>
                                <td>{item.name}</td>
                                <td>{item.description}</td>
                                <td>{item.category ? item.category.name : 'N/A'}</td>
                                {/* <td>{item.user ? item.user.email : 'N/A'}</td> */}
                                <td>
                                    {item.image && <img src={item.image} alt={item.name} style={{ width: '50px' }} />}
                                </td>
                                <td>
                                    <Link href={`/dashboard/pages/${item._id}`}>
                                        <MdOutlineEdit style={{ color: '#4D4F5C' }} />
                                    </Link>
                                    <RiDeleteBin6Line
                                        onClick={() => deletePage(item._id)}
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
