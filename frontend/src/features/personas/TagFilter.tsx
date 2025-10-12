
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Search, Loader } from 'lucide-react';

interface TagFilterProps {
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
    onFetchTags: (query: string, selectedTags: string[]) => Promise<string[]>; // API call function
}

export default function TagFilter({ selectedTags, onTagsChange, onFetchTags }: TagFilterProps) {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout>(null);

    // Fetch tags when input changes
    useEffect(() => {
        if (inputValue.length !== 0) {
            // Clear previous timer
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            // Set new timer
            debounceTimerRef.current = setTimeout(async () => {
                setIsLoading(true);
                try {
                    const fetchFunction = onFetchTags;
                    const tags = await fetchFunction(inputValue, selectedTags);
                    setSuggestions(tags);
                    setShowDropdown(tags.length > 0);
                } catch (error) {
                    console.error('Error fetching tags:', error);
                    setSuggestions([]);
                } finally {
                    setIsLoading(false);
                }
            }, 300); // 300ms debounce
        } else {
            setSuggestions([]);
            setShowDropdown(false);
            setIsLoading(false);
        }

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [inputValue, selectedTags, onFetchTags]);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddTag = (tag: string) => {
        if (!selectedTags.includes(tag)) {
            onTagsChange([...selectedTags, tag]);
        }
        setInputValue('');
        setSuggestions([]);
        setShowDropdown(false);
        setHighlightedIndex(-1);
        inputRef.current?.focus();
    };

    const handleRemoveTag = (tagToRemove: string) => {
        onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev =>
                prev < suggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter' && highlightedIndex >= 0) {
            e.preventDefault();
            handleAddTag(suggestions[highlightedIndex]);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
            setHighlightedIndex(-1);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        setHighlightedIndex(-1);
    };

    return (
        <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                Filter by Tags
            </h3>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {selectedTags.map(tag => (
                        <motion.div
                            key={tag}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-lg shadow-blue-200"
                        >
                            <span className="text-sm">{tag}</span>
                            <button
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:bg-blue-700 rounded p-0.5 transition-colors"
                                aria-label={`Remove ${tag}`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                    <button
                        onClick={() => onTagsChange([])}
                        className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* Autocomplete Input */}
            <div className="relative">
                <div className="relative bg-white rounded-xl border-2 border-gray-200 focus-within:border-blue-500 transition-colors">
                    <div className="flex items-center px-4 py-3">
                        <Search className="w-5 h-5 text-gray-400 mr-3" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => {
                                if (suggestions.length > 0) {
                                    setShowDropdown(true);
                                }
                            }}
                            placeholder="Type to search tags..."
                            className="flex-1 text-base outline-none text-gray-800 placeholder-gray-400"
                        />
                        {isLoading && (
                            <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                        )}
                    </div>
                </div>

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                    {showDropdown && suggestions.length > 0 && (
                        <motion.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden"
                        >
                            <div className="max-h-64 overflow-y-auto">
                                {suggestions.map((tag, index) => (
                                    <button
                                        key={tag}
                                        onClick={() => handleAddTag(tag)}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 ${highlightedIndex === index
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Tag className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium">{tag}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {inputValue.length !== 0 && !isLoading && suggestions.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                        No tags found matching "{inputValue}"
                    </p>
                )}
            </div>
        </div>
    );
}