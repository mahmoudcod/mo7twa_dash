'use client';
import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdOutlineEdit, MdDelete, MdContentCopy, MdClose } from 'react-icons/md';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { useAuth } from '@/app/auth';
import Link from 'next/link';
import Markdown from 'react-markdown';

export default function Post() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPosts, setSelectedPosts] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
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
            fetchPages();
        }
    }, [currentPage, token]);

    const fetchPages = async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const response = await fetch(`https://ub.mo7tawa.store/api/pages/all?page=${currentPage}&limit=${pageSize}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch pages');
            const data = await response.json();
            setPages(data.pages);
            setTotalCount(data.totalCount);
        } catch (err) {
            setErrorMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    const clonePage = async (pageId, pageName) => {
        if (window.confirm(`Are you sure you want to clone "${pageName}"? A copy will be created with "(Copy)" added to its name.`)) {
            try {
                const response = await fetch(`https://ub.mo7tawa.store/api/pages/${pageId}/clone`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                if (!response.ok) throw new Error('Failed to clone page');
                
                setSuccessMessage("Page cloned successfully");
                // Refresh the pages list
                fetchPages();
            } catch (error) {
                setErrorMessage('Error cloning page');
            }
        }
    };

    const deleteSelectedPosts = async () => {
        if (window.confirm('Are you sure you want to delete selected pages?')) {
            try {
                await Promise.all(
                    selectedPosts.map((postId) =>
                        fetch(`https://ub.mo7tawa.store/api/pages/${postId}`, {
                            method: 'DELETE',
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        })
                    )
                );
                setSelectedPosts([]);
                setSuccessMessage("Selected pages deleted successfully");
                fetchPages();
            } catch (error) {
                setErrorMessage('Error deleting selected pages');
            }
        }
    };

    const deletePage = async (pageId, pageName) => {
        if (window.confirm(`Are you sure you want to delete "${pageName}"?`)) {
            try {
                await fetch(`https://ub.mo7tawa.store/api/pages/${pageId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setSuccessMessage("Page deleted successfully");
                fetchPages();
            } catch (error) {
                setErrorMessage('Error deleting page');
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
                                <td><Markdown>{item.description.slice(0, 100)}</Markdown></td>
                                <td>
                                    {item.image && <img src={item.image} alt={item.name} style={{ width: '50px' }} />}
                                </td>
                                <td className="settings-column">
                                    <Link href={`/dashboard/pages/${item._id}`}>
                                        <MdOutlineEdit style={{ color: '#4D4F5C', fontSize: '20px', transition: 'color 0.3s' }} className="icon" />
                                    </Link>
                                    <MdContentCopy 
                                        onClick={() => clonePage(item._id, item.name)}
                                        className="clone icon"
                                        style={{ margin: '0px 10px', cursor: 'pointer', color: '#4D4F5C', fontSize: '20px', transition: 'color 0.3s' }}
                                        title="Clone page"
                                    />
                                    <RiDeleteBin6Line
                                        onClick={() => deletePage(item._id, item.name)}
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
