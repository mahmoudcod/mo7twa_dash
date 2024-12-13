'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { MdClose, MdArrowBack, MdFileDownload, } from 'react-icons/md';
import ReactMarkdown from 'react-markdown';
import * as XLSX from 'xlsx';

const API_BASE_URL = 'http://ub.mo7tawa.store';

const UserDetails = () => {
    const { id } = useParams();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filteredInteractions, setFilteredInteractions] = useState([]);

    useEffect(() => {
        if (id) fetchUserDetails();
    }, [id]);

    useEffect(() => {
        if (user?.aiInteractions) {
            filterInteractions();
        }
    }, [user, startDate, endDate]);

    const fetchUserDetails = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication token not found.');

            const response = await axios.get(`${API_BASE_URL}/api/auth/admin/users/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const userData = response.data;
            setUser(userData);
            setFilteredInteractions(userData.aiInteractions || []);
            if (userData.avatar) {
                setImageUrl(`${API_BASE_URL}${userData.avatar.url}`);
            }
        } catch (error) {
            setErrorMessage('Error fetching user details: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const filterInteractions = () => {
        if (!user?.aiInteractions) return;

        let filtered = [...user.aiInteractions];

        if (startDate) {
            filtered = filtered.filter(ai => 
                new Date(ai.timestamp) >= new Date(startDate)
            );
        }

        if (endDate) {
            filtered = filtered.filter(ai => 
                new Date(ai.timestamp) <= new Date(endDate + 'T23:59:59')
            );
        }

        setFilteredInteractions(filtered);
    };

    const exportToExcel = () => {
        if (!filteredInteractions.length) return;

        const data = filteredInteractions.map((ai) => ({
            'User Input': ai.userInput,
            'AI Output': ai.aiOutput,
            'Timestamp': new Date(ai.timestamp).toLocaleString(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'AI Interactions');

        const fileName = startDate || endDate 
            ? `User_${id}_AI_Interactions_${startDate || 'start'}_to_${endDate || 'end'}.xlsx`
            : `User_${id}_AI_Interactions.xlsx`;
        XLSX.writeFile(workbook, fileName);
        setSuccessMessage('Data exported successfully');
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
        </div>
    );

    return (
        <main className="user-details-container">
            <div className="user-details-header">
                <h2 className="user-details-title">User Details</h2>
                <button 
                    className="back-button" 
                    onClick={() => router.push('/dashboard/users')}
                >
                    <MdArrowBack /> Back
                </button>
            </div>

            {errorMessage && (
                <div className="message error-message">
                    {errorMessage}
                    <button className="message-close" onClick={() => setErrorMessage('')}>
                        <MdClose />
                    </button>
                </div>
            )}
            
            {successMessage && (
                <div className="message success-message">
                    {successMessage}
                    <button className="message-close" onClick={() => setSuccessMessage('')}>
                        <MdClose />
                    </button>
                </div>
            )}

            <div className="content">
                <div className="user-info">
                    <div className="info-card">
                        <h3>Basic Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Email</label>
                                <p>{user?.email}</p>
                            </div>
                            <div className="info-item">
                                <label>Phone</label>
                                <p>{user?.phone}</p>
                            </div>
                            <div className="info-item">
                                <label>Country</label>
                                <p>{user?.country}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="filter-section">
                    <h3>Filter Interactions</h3>
                    <div className="filter-content">
                        <div className="date-filters">
                            <div className="date-input">
                                <label>From Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="date-input">
                                <label>To Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="filter-actions">
                            <div className="results-count">
                                Results Count: <span>{filteredInteractions.length}</span>
                            </div>
                            <button 
                                className="export-button" 
                                onClick={exportToExcel}
                                disabled={!filteredInteractions.length}
                            >
                                <MdFileDownload /> Export to Excel
                            </button>
                        </div>
                    </div>
                </div>

                <div className="interactions-section">
                    <h3>Track Outputs</h3>
                    <div className="ai-interactions">
                        {filteredInteractions.map((ai) => (
                            <div key={ai._id} className="ai-card">
                                <div className="ai-content">
                                    <div className="ai-input">
                                        <strong>User Input</strong>
                                        <p>{ai.userInput}</p>
                                    </div>
                                    <div className="ai-output">
                                        <strong>Outputs</strong>
                                          <ReactMarkdown
       
        >{ai.aiOutput}</ReactMarkdown>
                                    </div>
                                </div>
                                <div className="ai-timestamp">
                                    {new Date(ai.timestamp).toLocaleString()}
                                </div>
                            </div>
                        ))}
                        {filteredInteractions.length === 0 && (
                            <div className="no-results">
                                No interactions in the selected period
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default UserDetails;
