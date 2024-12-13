'use client';
import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdDelete, MdClose } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaEye, FaEdit } from "react-icons/fa";
import Link from 'next/link';
import { useAuth } from '@/app/auth';
import axios from 'axios';
import styles from './styles.module.css';

const API_BASE_URL = 'https://ub.mo7tawa.store';

export default function Users() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [users, setUsers] = useState([]);
    const { getToken } = useAuth();
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingAccess, setLoadingAccess] = useState({});
    const pageSize = 30;
    const [token, setToken] = useState(null);
    const [products, setProducts] = useState([]);
    const [userProducts, setUserProducts] = useState({});

    // Initialize token
    useEffect(() => {
        const fetchToken = () => {
            const retrievedToken = getToken();
            setToken(retrievedToken);
        };
        fetchToken();
    }, [getToken]);

    // Fetch initial data
    useEffect(() => {
        if (token) {
            fetchUsers();
            fetchProducts();
        }
    }, [currentPage, token]);

    // Auto-check product access status
    useEffect(() => {
        if (!token || users.length === 0) return;

        const checkStatus = async () => {
            const now = new Date();
            let updatedUsers = false;

            const newUsers = users.map(user => {
                const updatedProducts = user.productsWithAccess.map(product => {
                    if (product.endDate && new Date(product.endDate) <= now && product.isActive) {
                        updatedUsers = true;
                        return { ...product, isActive: false };
                    }
                    return product;
                });

                if (updatedProducts.some(p => !p.isActive)) {
                    updateUserProductStatus(user._id, updatedProducts);
                }

                return {
                    ...user,
                    productsWithAccess: updatedProducts
                };
            });

            if (updatedUsers) {
                setUsers(newUsers);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 60000);

        return () => clearInterval(interval);
    }, [token, users]);

    const updateUserProductStatus = async (userId, products) => {
        try {
            await axios.post(
                `${API_BASE_URL}/api/auth/admin/users/${userId}/update-product-status`,
                { products },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error('Error updating product status:', error);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const productsResponse = await axios.get(`${API_BASE_URL}/api/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const productMap = productsResponse.data.products.reduce((acc, product) => {
                acc[product._id] = product.name;
                return acc;
            }, {});

            const response = await axios.get(`${API_BASE_URL}/api/auth/admin/users`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: currentPage,
                    limit: pageSize,
                },
            });

            const usersWithProductInfo = response.data.users.map(user => {
                const productsWithAccess = user.productAccess.map(access => ({
                    productId: access.productId,
                    productName: productMap[access.productId] || 'Unknown Product',
                    isActive: access.isActive,
                    endDate: access.endDate,
                    startDate: access.startDate
                }));

                return {
                    ...user,
                    productsWithAccess
                };
            });

            setUsers(usersWithProductInfo);
            setTotalCount(response.data.totalCount);

            const productAccess = {};
            usersWithProductInfo.forEach(user => {
                productAccess[user._id] = user.productsWithAccess;
            });
            
            setUserProducts(productAccess);
            setProducts(productsResponse.data.products);

        } catch (error) {
            setErrorMessage("Error fetching users: " + error.message);
            console.error(error);
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

    const assignProductToUser = async (userId, productId) => {
        if (!productId) return;

        setLoadingAccess({ ...loadingAccess, [userId]: true });
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/auth/admin/users/${userId}/grant-product-access`,
                { productId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setUsers(prevUsers => 
                prevUsers.map(user => {
                    if (user._id === userId) {
                        const newProduct = {
                            productId,
                            productName: products.find(p => p._id === productId)?.name || 'Unknown Product',
                            isActive: true,
                            endDate: response.data.endDate
                        };
                        return {
                            ...user,
                            productsWithAccess: [...user.productsWithAccess, newProduct]
                        };
                    }
                    return user;
                })
            );

            setSuccessMessage('Product access granted successfully');
        } catch (error) {
            setErrorMessage(`Error granting product access: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoadingAccess({ ...loadingAccess, [userId]: false });
        }
    };

    const revokeProductAccess = async (userId, productId, productName) => {
        if (!confirm(`Are you sure you want to revoke user access to ${productName}؟`)) {
            return;
        }

        setLoadingAccess({ ...loadingAccess, [userId]: true });
        try {
            await axios.delete(
                `${API_BASE_URL}/api/auth/admin/users/${userId}/product-access/${productId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setUsers(prevUsers => 
                prevUsers.map(user => {
                    if (user._id === userId) {
                        return {
                            ...user,
                            productsWithAccess: user.productsWithAccess.filter(
                                product => product.productId !== productId
                            )
                        };
                    }
                    return user;
                })
            );

            setSuccessMessage('Product access revoked successfully');
        } catch (error) {
            setErrorMessage(`Error revoking product access: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoadingAccess({ ...loadingAccess, [userId]: false });
        }
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

    const pageNumbers = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i
    );

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <main className="head">
            <div className="head-title">
                <h3 className="title">Users: {totalCount}</h3>
                <Link href="/dashboard/users/new-user" className="addButton">
                    Add New User
                </Link>
            </div>

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
                            <th>Email</th>
                            <th>Phone Number</th>
                            <th>Country</th>
                            <th>Confirmed</th>
                            <th>Current Products</th>
                            <th>Add Product</th>
                            <th>Settings</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td>{user.email}</td>
                                <td>{user.phone}</td>
                                <td>{user.country}</td>
                                <td>{user.isConfirmed ? 'Yes' : 'No'}</td>
                                <td>
                                    <div className={styles.currentProducts}>
                                        {user.productsWithAccess?.map(product => (
                                            <div key={product.productId} className={styles.productTag}>
                                                <span className={styles.productName}>
                                                    {product.productName}
                                                </span>
                                                <span className={`${styles.statusBadge} ${product.isActive ? styles.activeStatus : styles.inactiveStatus}`}>
                                                    <span className={styles.statusIcon}></span>
                                                    {product.isActive ? 'Active' : 'Expired'}
                                                </span>
                                                <button
                                                    onClick={() => revokeProductAccess(user._id, product.productId, product.productName)}
                                                    className={styles.deleteButton}
                                                    disabled={loadingAccess[user._id]}
                                                >
                                                    <RiDeleteBin6Line />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.productAssignContainer}>
                                        <select
                                            onChange={(e) => assignProductToUser(user._id, e.target.value)}
                                            disabled={loadingAccess[user._id]}
                                            defaultValue=""
                                            className={styles.productSelect}
                                        >
                                            <option value="">Select Product</option>
                                            {products
                                                .filter(product => !user.productsWithAccess?.some(p => p.productId === product._id))
                                                .map(product => (
                                                    <option key={product._id} value={product._id}>
                                                        {product.name}
                                                    </option>
                                                ))}
                                        </select>
                                        {loadingAccess[user._id] && <span className={styles.loadingIndicator}>...</span>}
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.actions}>
                                        <RiDeleteBin6Line
                                            onClick={() => handleDeleteUser(user._id)}
                                            className={styles.actionIcon}
                                        />
                                        <Link href={`/dashboard/users/show/${user._id}`}>
                                            <FaEye className={styles.actionIcon} />
                                        </Link>
                                        <Link href={`/dashboard/users/${user._id}?id=${user._id}`}>
                                            <FaEdit className={styles.actionIcon} />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <button 
                    className='arrow' 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                >
                    <MdKeyboardArrowRight />
                </button>
                {pageNumbers.map(number => (
                    <button
                        key={number}
                        onClick={() => setCurrentPage(number)}
                        className={currentPage === number ? "act-num page-num" : "page-num"}
                    >
                        {number}
                    </button>
                ))}
                <button 
                    className='arrow' 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    disabled={currentPage === totalPages}
                >
                    <MdKeyboardArrowLeft />
                </button>
            </div>
        </main>
    );
}
