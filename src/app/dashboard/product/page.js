'use client';
import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdOutlineEdit, MdDelete } from 'react-icons/md';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { useAuth } from '@/app/auth';
import Link from 'next/link';

export default function Products() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [deleteSuccess, setDeleteSuccess] = useState(false);
    const [pageSize] = useState(10);
    const { getToken } = useAuth();
    const [products, setProducts] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState({});
    const [pages, setPages] = useState({});
    const [token, setToken] = useState(null);

    useEffect(() => {
        const fetchToken = async () => {
            const fetchedToken = localStorage.getItem('token');
            setToken(fetchedToken);
        };
        fetchToken();
    }, [getToken]);

    useEffect(() => {
        if (token) {
            fetchProducts();
            fetchCategories();
            fetchPages();
        }
    }, [token, currentPage]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`https://mern-ordring-food-backend.onrender.com/api/products?page=${currentPage}&limit=${pageSize}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setProducts(data.products);
            setTotalCount(data.totalCount);
        } catch (err) {
            setError('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('https://mern-ordring-food-backend.onrender.com/api/categories', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            const categoryMap = {};
            data.categories.forEach(category => {
                categoryMap[category._id] = category.name;
            });
            setCategories(categoryMap);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Failed to fetch categories');
        }
    };

    const fetchPages = async () => {
        try {
            const response = await fetch('https://mern-ordring-food-backend.onrender.com/api/pages/all', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            const pageMap = {};
            data.pages.forEach(page => {
                pageMap[page._id] = page.name;
            });
            setPages(pageMap);
        } catch (err) {
            console.error('Error fetching pages:', err);
            setError('Failed to fetch pages');
        }
    };

    const getCategoryName = (product) => {
        if (Array.isArray(product.category)) {
            return product.category.map(catId => categories[catId] || 'Unknown').join(', ');
        }
        if (typeof product.category === 'string') {
            return categories[product.category] || 'Unknown';
        }
        if (product.category && product.category._id) {
            return categories[product.category._id] || product.category.name || 'Unknown';
        }
        return 'Unknown';
    };

    const getPageName = (product) => {
        if (Array.isArray(product.pages)) {
            return product.pages.map(pageId => pages[pageId] || 'Unknown').join(', ');
        }
        if (typeof product.pages === 'string') {
            return pages[product.pages] || 'Unknown';
        }
        if (product.pages && product.pages._id) {
            return pages[product.pages._id] || product.pages.name || 'Unknown';
        }
        return 'Unknown';
    };
    const deleteSelectedProducts = async () => {
        if (window.confirm('Are you sure you want to delete selected products?')) {
            try {
                const deleteRequests = selectedProducts.map((productId) =>
                    fetch(`https://mern-ordring-food-backend.onrender.com/api/products/${productId}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` },
                    })
                );

                const results = await Promise.all(deleteRequests);

                // Check if all deletions were successful (status 200 or 204)
                const allSuccessful = results.every(response => response.ok);
                if (allSuccessful) {
                    setDeleteSuccess(true);
                    setSelectedProducts([]);
                    fetchProducts(); // Reload products after deletion
                } else {
                    setError('Error deleting selected products. Please try again.');
                }
            } catch (error) {
                setError('An error occurred while deleting products');
            }
        }
    };


    const deleteProduct = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await fetch(`https://mern-ordring-food-backend.onrender.com/api/products/${productId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setDeleteSuccess(true);
                fetchProducts();
            } catch (error) {
                setError('Error deleting product');
            }
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <main className="head">
            <div className="head-title">
                <h3 className="title">Products: {totalCount}</h3>
                <Link href="/dashboard/product/new-product" className="addButton">
                    Add New Product
                </Link>
            </div>

            {selectedProducts.length > 0 && (
                <button className="delete-button" onClick={deleteSelectedProducts}>
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
                                    checked={selectedProducts.length === products.length}
                                    onChange={() => {
                                        if (selectedProducts.length === products.length) {
                                            setSelectedProducts([]);
                                        } else {
                                            setSelectedProducts(products.map((product) => product._id));
                                        }
                                    }}
                                />
                            </th>
                            <th>Name</th>
                            <th>Prompt Limit</th>
                            <th>Access Period</th>
                            <th>Category</th>
                            <th>Pages</th>
                            <th>Active Users</th>
                            <th>Settings</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((item) => (
                            <tr key={item._id}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.includes(item._id)}
                                        onChange={() => {
                                            const updatedSelectedProducts = selectedProducts.includes(item._id)
                                                ? selectedProducts.filter((id) => id !== item._id)
                                                : [...selectedProducts, item._id];
                                            setSelectedProducts(updatedSelectedProducts);
                                        }}
                                    />
                                </td>
                                <td>{item.name}</td>
                                <td>{item.promptLimit}</td>
                                <td>{item.accessPeriodDays} days</td>
                                <td>{getCategoryName(item)}</td>
                                <td>{getPageName(item)}</td>
                                <td>{item.userAccess?.length || 0}</td>
                                <td>
                                    <Link href={`/dashboard/product/${item._id}`}>
                                        <MdOutlineEdit style={{ color: '#4D4F5C' }} />
                                    </Link>
                                    <RiDeleteBin6Line
                                        onClick={() => deleteProduct(item._id)}
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