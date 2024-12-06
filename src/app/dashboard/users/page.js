'use client';
import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdDelete } from "react-icons/md";
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
    const [loadingAccess, setLoadingAccess] = useState({});
    const pageSize = 30;
    const [token, setToken] = useState(null);
    const [products, setProducts] = useState([]);
    const [userProducts, setUserProducts] = useState({});

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
const fetchUsers = async () => {
    setLoading(true);
    try {
        // First, fetch all products to create a product ID to name mapping
        const productsResponse = await axios.get(`${API_BASE_URL}/api/products`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const productMap = productsResponse.data.products.reduce((acc, product) => {
            acc[product._id] = product.name;
            return acc;
        }, {});

        // Then fetch users
        const response = await axios.get(`${API_BASE_URL}/api/auth/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
            params: {
                page: currentPage,
                limit: pageSize,
            },
        });

        // Process users and map product names
        const usersWithProductInfo = response.data.users.map(user => {
            // Map product IDs to names
            const productsWithAccess = user.productAccess.map(productAccessItem => ({
                productId: productAccessItem.productId,
                productName: productMap[productAccessItem.productId] || 'Unknown Product',
                isActive: productAccessItem.isActive
            }));

            return {
                ...user,
                productsWithAccess
            };
        });

        setUsers(usersWithProductInfo);
        setTotalCount(response.data.totalCount);

        // Prepare product access information for userProducts state
        const productAccess = {};
        usersWithProductInfo.forEach(user => {
            productAccess[user._id] = user.productsWithAccess.map(product => ({
                _id: product.productId,
                name: product.productName,
                accessStatus: product.isActive ? 'active' : 'inactive'
            }));
        });
        
        setUserProducts(productAccess);
        setProducts(productsResponse.data.products);

    } catch (error) {
        setErrorMessage("خطأ في جلب المستخدمين: " + error.message);
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
            // Use the new admin route for granting product access
            const response = await axios.post(
                `${API_BASE_URL}/api/auth/admin/users/${userId}/grant-product-access`, 
                { productId }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refetch user's products to get the updated list
            const productsResponse = await axios.get(
                `${API_BASE_URL}/api/auth/admin/users/${userId}/products`, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state with the new products
            setUserProducts(prev => ({
                ...prev,
                [userId]: productsResponse.data.products.map(product => ({
                    _id: product._id,
                    name: product.name,
                    accessStatus: product.accessStatus
                }))
            }));

            setSuccessMessage(`تم منح الوصول للمنتج بنجاح`);

        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            setErrorMessage(`خطأ أثناء منح الوصول للمنتج: ${errorMsg}`);
        } finally {
            setLoadingAccess({ ...loadingAccess, [userId]: false });
        }
    };
const revokeProductAccess = async (userId, productId, productName) => {
  // Confirm dialog
  if (!confirm(`هل أنت متأكد من أنك تريد إلغاء وصول المستخدم إلى ${productName}؟`)) {
    return;
  }

  // Update loading state
  setLoadingAccess({ ...loadingAccess, [userId]: true });
  setErrorMessage(null);
  setSuccessMessage(null);

  try {
    // Updated URL to include the correct API path
    const response = await axios.delete(
      `${API_BASE_URL}/api/auth/admin/users/${userId}/product-access/${productId}`,
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );

    // Check if the operation was successful based on the success flag
    if (response.data.success) {
      // Update local state based on the backend response
      setUserProducts(prev => {
        const updatedProducts = prev[userId].filter(
          product => product.productId !== productId
        );
        return {
          ...prev,
          [userId]: updatedProducts
        };
      });

      // Set success message from backend response
      setSuccessMessage(response.data.message || 'تم إلغاء الوصول إلى المنتج بنجاح');
      
      // Optionally update any counters or stats based on remainingAccess
      if (typeof response.data.remainingAccess === 'number') {
        // Update any UI elements that show the number of products
        // setProductCount(response.data.remainingAccess);
      }
    } else {
      // Handle case where operation was not successful but didn't throw an error
      throw new Error(response.data.message || 'فشل في إلغاء الوصول إلى المنتج');
    }
  } catch (error) {
    // Enhanced error handling
    const errorMsg = error.response?.data?.message || 
                    error.response?.data?.error || 
                    error.message || 
                    'حدث خطأ غير معروف';
    setErrorMessage(`خطأ أثناء إلغاء الوصول إلى المنتج: ${errorMsg}`);
    console.error('Error details:', error.response || error);
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
        {user.productsWithAccess?.map(product => (
            <span key={product.productId} className="product-tag">
                {product.productName}
                <span className={`access-status ${product.isActive ? 'active' : 'inactive'}`}>
                    {product.isActive ? 'نشط' : 'غير نشط'}
                </span>
                <button
                    onClick={() => revokeProductAccess(user._id, product.productId, product.productName)}
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