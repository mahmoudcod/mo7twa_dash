'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth';

export default function EditCategory({ params }) {
  const [categoryData, setCategoryData] = useState({
    name: '',
    pages: []
  });
  const [availablePages, setAvailablePages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { getToken } = useAuth();
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    const fetchCategoryAndPages = async () => {
      try {
        const token = getToken();
        const [categoryResponse, pagesResponse] = await Promise.all([
          fetch(`https://mern-ordring-food-backend.onrender.com/api/categories/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('https://mern-ordring-food-backend.onrender.com/api/pages/all', {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (!categoryResponse.ok || !pagesResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const [categoryData, pagesData] = await Promise.all([
          categoryResponse.json(),
          pagesResponse.json()
        ]);

        setCategoryData({
          name: categoryData.name,
          pages: categoryData.pages.map(page => page._id)
        });
        setAvailablePages(pagesData.pages);
      } catch (err) {
        setErrorMessage("Error fetching data: " + err.message);
      }
    };

    fetchCategoryAndPages();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handlePageSelection = (e) => {
    const selectedPages = Array.from(e.target.selectedOptions, option => option.value);
    setCategoryData(prevData => ({ ...prevData, pages: selectedPages }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`https://mern-ordring-food-backend.onrender.com/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        throw new Error('Failed to update the category');
      }

      setSuccessMessage("Category updated successfully");
      router.push('/dashboard/category');
    } catch (err) {
      setErrorMessage("Error updating the category: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="head">
        <div className="head-title">
          <h3 className="title">Edit Category</h3>
        </div>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        <form className="content" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category Name:</label>
            <input
              type="text"
              name="name"
              value={categoryData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Select Pages:</label>
            <select
              multiple
              name="pages"
              value={categoryData.pages}
              onChange={handlePageSelection}
            >
              {Array.isArray(availablePages) && availablePages.length > 0 ? (
                availablePages.map((page) => (
                  <option key={page._id} value={page._id}>
                    {page.name}
                  </option>
                ))
              ) : (
                <option disabled>No pages available</option>
              )}
            </select>
          </div>
          <button className='sub-button' type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Category'}
          </button>
        </form>
      </main>
    </>
  );
}