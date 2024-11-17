'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import * as XLSX from 'xlsx';

const API_BASE_URL = 'https://mern-ordring-food-backend.onrender.com';

const UserDetails = () => {
    const { id } = useParams();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
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
            setErrorMessage('Error fetching user details:' + (error.response?.data?.message || error.message));
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

        // Prepare data for the Excel sheet
        const data = filteredInteractions.map((ai) => ({
            'User Input': ai.userInput,
            'AI Output': ai.aiOutput,
            'Timestamp': new Date(ai.timestamp).toLocaleString(),
        }));

        // Create a worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'AI Interactions');

        // Generate Excel file and download it
        const fileName = startDate || endDate 
            ? `User_${id}_AI_Interactions_${startDate || 'start'}_to_${endDate || 'end'}.xlsx`
            : `User_${id}_AI_Interactions.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    if (loading) return <div>جاري التحميل...</div>;
    if (errorMessage) return <div className="error-message">{errorMessage}</div>;
    if (!user) return <div>لم يتم العثور على المستخدم.</div>;

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">تفاصيل المستخدم</h3>
                </div>
                <div className="content">
                    <div className="form-group">
                        <label>البريد الإلكتروني:</label>
                        <p>{user.email}</p>
                    </div>
                    <div className="form-group">
                        <label>الهاتف:</label>
                        <p>{user.phone}</p>
                    </div>
                    <div className="form-group">
                        <label>البلد:</label>
                        <p>{user.country}</p>
                    </div>
                    
                    <div className="filter-section">
                        <div className="date-filters">
                            <div className="date-input">
                                <label>من تاريخ:</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="date-input">
                                <label>إلى تاريخ:</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="results-count">
                            عدد النتائج: {filteredInteractions.length}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>تتبع المخرجات:</label>
                        <div className="ai-interactions">
                            {filteredInteractions.map((ai) => (
                                <div key={ai._id} className="ai-card">
                                    <div className="ai-input">
                                        <strong>مدخلات المستخدم:</strong>
                                        <p>{ai.userInput}</p>
                                    </div>
                                    <div className="ai-output">
                                        <strong>المخرجات:</strong>
                                        <p>{ai.aiOutput}</p>
                                    </div>
                                    <div className="ai-timestamp">
                                        <small>تاريخ التفاعل: {new Date(ai.timestamp).toLocaleString()}</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="sub-button" type="button" onClick={() => router.push('/dashboard/users')}>
                        رجوع
                    </button>
                    <button 
                        className="export-button" 
                        type="button" 
                        onClick={exportToExcel}
                        disabled={!filteredInteractions.length}
                    >
                        تصدير إلى Excel ({filteredInteractions.length})
                    </button>
                </div>
            </main>

            <style jsx>{`
                .content {
                    display: flex;
                    flex-direction: column;
                }

                .filter-section {
                    margin: 1rem 0;
                    padding: 1rem;
                    background-color: #f5f5f5;
                    border-radius: 8px;
                }

                .date-filters {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .date-input {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .date-input input {
                    padding: 0.5rem;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }

                .results-count {
                    font-size: 0.9rem;
                    color: #666;
                }

                .ai-interactions {
                    display: grid;
                    gap: 1rem;
                }

                .ai-card {
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    padding: 1rem;
                    background-color: #f9f9f9;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                }

                .ai-input,
                .ai-output {
                    margin-bottom: 1rem;
                }

                .ai-input p,
                .ai-output p {
                    background-color: #eef1f3;
                    padding: 0.5rem;
                    border-radius: 4px;
                    margin-top: 0.5rem;
                }

                .ai-timestamp {
                    font-size: 0.9rem;
                    color: #666;
                    text-align: right;
                }

                .export-button {
                    background-color: #4caf50;
                    color: white;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 1rem;
                    margin-top: 10px;
                }

                .export-button:disabled {
                    background-color: #cccccc;
                    cursor: not-allowed;
                }

                .export-button:hover:not(:disabled) {
                    background-color: #45a049;
                }
            `}</style>
        </>
    );
};

export default UserDetails;