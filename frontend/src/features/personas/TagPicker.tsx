
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag as TagIcon, Search, Loader } from 'lucide-react';
import { Tag } from '../../utils/Tag';
import { useGetTagsQuery } from '../../store/apiSlice';

interface TagPickerProps {
    selectedTags?: Tag[]; // Tags to prepopulate as selected
    onTagPicked: (tags: Tag[]) => void;
    title?: string;
    allowNewTags?: boolean;
}

// Small debounce helper
function useDebouncedValue<T>(value: T, delay = 250) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

export default function TagPicker({ selectedTags = [], onTagPicked, title, allowNewTags = false }: TagPickerProps) {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState('');
    const debouncedInput = useDebouncedValue(inputValue, 250);
    const [showDropdown, setShowDropdown] = useState(false);
    const [openUpwards, setOpenUpwards] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // use RTK Query to fetch tags matching the debounced input
    const { data: tags = [], isFetching } = useGetTagsQuery(
        debouncedInput && debouncedInput.length > 0 ? debouncedInput : undefined
    );

    // Derive suggestions excluding already selected
    const suggestions = useMemo(() => tags.filter(t => !selectedTags.some(st => st.id === t.id)), [tags, selectedTags]);

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
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Decide whether to open dropdown upwards based on viewport space
    useEffect(() => {
        function updateDirection() {
            const el = inputRef.current;
            if (!el) return setOpenUpwards(false);
            const rect = el.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            // estimated dropdown height (max-h-64 ~= 256px)
            const estHeight = 256;
            // open upwards if there is less space below than estimated and more space above
            setOpenUpwards(spaceBelow < Math.min(200, estHeight) && spaceAbove > spaceBelow);
        }

        if (showDropdown) updateDirection();
        window.addEventListener('resize', updateDirection);
        window.addEventListener('scroll', updateDirection, true);
        return () => {
            window.removeEventListener('resize', updateDirection);
            window.removeEventListener('scroll', updateDirection, true);
        };
    }, [showDropdown, debouncedInput, suggestions.length]);

    const handleAddTag = (tag: Tag) => {
        if (!selectedTags.some(t => t.id === tag.id)) {
            onTagPicked([...selectedTags, tag]);
        }
        setInputValue('');
        setShowDropdown(false);
        setHighlightedIndex(-1);
        inputRef.current?.focus();
    };

    const handleRemoveTag = (tagToRemove: Tag) => {
        onTagPicked(selectedTags.filter(tag => tag.id !== tagToRemove.id));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
            setShowDropdown(true);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                handleAddTag(suggestions[highlightedIndex]);
            } else if (inputValue.trim().length > 0) {
                if (allowNewTags) {
                    const name = inputValue.trim();
                    const id = `${name.replace(/\s+/g, '-').toLowerCase()}-${Math.floor(Math.random() * 100000)}`;
                    const newTag: Tag = { id, name };
                    handleAddTag(newTag);
                } else {
                    setShowDropdown(false);
                }
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
            setHighlightedIndex(-1);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        setHighlightedIndex(-1);
        if (e.target.value.length > 0) setShowDropdown(true);
    };

    return (
        <>
            {title && (
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TagIcon className="w-5 h-5 text-blue-600" />
                    {title}
                </h3>
            )}

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {selectedTags.map(tag => (
                        <motion.div
                            key={tag.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-lg shadow-blue-200"
                        >
                            <span className="text-sm">{tag.name}</span>
                            <button
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:bg-blue-700 rounded p-0.5 transition-colors"
                                aria-label={t('tagpicker.ariaRemove', { name: tag.name })}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                    <button
                        onClick={() => onTagPicked([])}
                        className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {t('tagpicker.clearAll')}
                    </button>
                </div>
            )}

            {/* Autocomplete Input */}
            <div className="relative">
                <div className="relative bg-white rounded-xl border-2 border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors">
                    <div className="flex items-center px-4 py-3">
                        <Search className="w-5 h-5 text-gray-400 mr-3" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => {
                                if (suggestions.length > 0) setShowDropdown(true);
                            }}
                            placeholder={t('tagpicker.inputPlaceholder')}
                            className="flex-1 text-base outline-none"
                            aria-autocomplete="list"
                            aria-expanded={showDropdown}
                        />
                        {isFetching && <Loader className="w-5 h-5 text-blue-600 animate-spin" />}
                    </div>
                </div>

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                    {showDropdown && (
                        <motion.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute z-50 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden ${openUpwards ? 'mb-2 bottom-full' : 'mt-2 top-full'}`}
                        >
                            <div className="max-h-64 overflow-y-auto">
                                {suggestions.length > 0 ? suggestions.map((tag, index) => (
                                    <button
                                        key={tag.id}
                                        onClick={() => handleAddTag(tag)}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 ${highlightedIndex === index ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        type="button"
                                    >
                                        <TagIcon className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium">{tag.name}</span>
                                    </button>
                                )) : (
                                    allowNewTags ? (
                                        <div className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-700">{t('tagpicker.noTagsFound')}</div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const name = inputValue.trim();
                                                        if (!name) return;
                                                        const id = `${name.replace(/\s+/g, '-').toLowerCase()}-${Math.floor(Math.random() * 100000)}`;
                                                        const newTag: Tag = { id, name };
                                                        handleAddTag(newTag);
                                                    }}
                                                    className="px-3 py-1 bg-blue-600 cursor-pointer text-white rounded-md text-sm"
                                                >
                                                    {t('tagpicker.createTag', { name: inputValue })}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 text-sm text-gray-500">{t('tagpicker.noTagsFound')}</div>
                                    )
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {inputValue.length !== 0 && !isFetching && suggestions.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">{t('tagpicker.noMatchingFound', { value: inputValue })}</p>
                )}
            </div>
        </>
    );
}