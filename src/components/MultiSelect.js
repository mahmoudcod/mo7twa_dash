'use client';
import React, { useState, useRef, useEffect } from 'react';

export default function MultiSelect({ options, value, onChange, placeholder = "Select items..." }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const searchRef = useRef(null);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchRef.current) {
            searchRef.current.focus();
        }
    }, [isOpen]);

    const filteredOptions = options.filter(option => 
        option.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !value.includes(option._id)
    );

    const handleRemoveItem = (itemId) => {
        onChange(value.filter(id => id !== itemId));
    };

    const handleSelectItem = (itemId) => {
        onChange([...value, itemId]);
        setSearchTerm('');
    };

    const selectedItems = options.filter(option => value.includes(option._id));

    return (
        <div className="multi-select-container" ref={dropdownRef}>
            <div className="selected-items" onClick={() => setIsOpen(true)}>
                {selectedItems.length === 0 && (
                    <span className="placeholder">{placeholder}</span>
                )}
                {selectedItems.map(item => (
                    <span key={item._id} className="selected-tag">
                        {item.name}
                        <button
                            type="button"
                            className="remove-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(item._id);
                            }}
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>

            {isOpen && (
                <div className="dropdown">
                    <input
                        ref={searchRef}
                        type="text"
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="options-list">
                        {filteredOptions.length === 0 ? (
                            <div className="no-options">No items found</div>
                        ) : (
                            filteredOptions.map(option => (
                                <div
                                    key={option._id}
                                    className="option"
                                    onClick={() => handleSelectItem(option._id)}
                                >
                                    {option.name}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .multi-select-container {
                    position: relative;
                    width: 100%;
                }

                .selected-items {
                    min-height: 38px;
                    padding: 4px 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    cursor: text;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px;
                    align-items: center;
                }

                .placeholder {
                    color: #999;
                }

                .selected-tag {
                    background-color: #e9ecef;
                    border-radius: 4px;
                    padding: 2px 8px;
                    margin: 2px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 14px;
                }

                .remove-btn {
                    background: none;
                    border: none;
                    color: #666;
                    cursor: pointer;
                    padding: 0 4px;
                    font-size: 16px;
                    line-height: 1;
                }

                .remove-btn:hover {
                    color: #333;
                }

                .dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    margin-top: 4px;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    z-index: 1000;
                }

                .search-input {
                    width: 100%;
                    padding: 8px;
                    border: none;
                    border-bottom: 1px solid #ddd;
                    outline: none;
                }

                .options-list {
                    max-height: 200px;
                    overflow-y: auto;
                }

                .option {
                    padding: 8px;
                    cursor: pointer;
                }

                .option:hover {
                    background-color: #f8f9fa;
                }

                .no-options {
                    padding: 8px;
                    color: #666;
                    text-align: center;
                }
            `}</style>
        </div>
    );
}
