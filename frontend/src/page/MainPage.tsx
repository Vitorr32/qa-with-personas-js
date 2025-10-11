import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Tag, Edit2, Trash2, MessageSquare } from 'lucide-react';
import Header from '../features/chat/Header';

// Mock data for personas
const mockPersonas = [
    { id: '1', name: 'Code Expert', description: 'Specialized in software development', tags: ['coding', 'technical'], avatar: '👨‍💻' },
    { id: '2', name: 'Creative Writer', description: 'Storytelling and creative content', tags: ['writing', 'creative'], avatar: '✍️' },
    { id: '3', name: 'Business Advisor', description: 'Business strategy and consulting', tags: ['business', 'strategy'], avatar: '💼' },
    { id: '4', name: 'Life Coach', description: 'Personal development and wellness', tags: ['wellness', 'coaching'], avatar: '🌟' },
    { id: '5', name: 'Data Scientist', description: 'Analytics and machine learning', tags: ['data', 'technical'], avatar: '📊' },
    { id: '6', name: 'Marketing Guru', description: 'Digital marketing strategies', tags: ['marketing', 'business'], avatar: '📱' },
];

const allTags = ['coding', 'technical', 'writing', 'creative', 'business', 'strategy', 'wellness', 'coaching', 'data', 'marketing'];

function MainPage() {
    const [isFilterMode, setIsFilterMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [filteredPersonas, setFilteredPersonas] = useState(mockPersonas);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

    const handleFilterToggle = () => {
        setIsFilterMode(!isFilterMode);
    };

    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachedFiles(Array.from(e.target.files));
        }
    };

    const handleSubmitQuestion = () => {
        console.log('Submitting question:', searchQuery);
        console.log('Files:', attachedFiles);
        // Handle question submission
    };

    React.useEffect(() => {
        let filtered = mockPersonas;

        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedTags.length > 0) {
            filtered = filtered.filter(p =>
                p.tags.some(tag => selectedTags.includes(tag))
            );
        }

        setFilteredPersonas(filtered);
    }, [searchQuery, selectedTags]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Header />

            {/* Main Content */}
            <AnimatePresence mode="wait">
                {!isFilterMode ? (
                    // Google-like centered search
                    <motion.div
                        key="search-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center px-6"
                        style={{ minHeight: 'calc(100vh - 73px)' }}
                    >
                        <motion.div
                            layout
                            className="w-full max-w-3xl"
                        >
                            <motion.h2
                                layout
                                className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent"
                            >
                                Ask Anything
                            </motion.h2>
                            <motion.p
                                layout
                                className="text-center text-gray-600 mb-8 text-lg"
                            >
                                Get answers from thousands of specialized personas
                            </motion.p>

                            <SearchBox
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                attachedFiles={attachedFiles}
                                setAttachedFiles={setAttachedFiles}
                                handleFileChange={handleFileChange}
                                handleSubmitQuestion={handleSubmitQuestion}
                                isFilterMode={isFilterMode}
                            />

                            <div className="flex justify-center gap-3 mt-6">
                                <button
                                    onClick={handleSubmitQuestion}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-200"
                                >
                                    Ask All Personas
                                </button>
                                <button
                                    onClick={handleFilterToggle}
                                    className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300 flex items-center gap-2"
                                >
                                    <Filter className="w-4 h-4" />
                                    Filter Personas
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : (
                    // Filter mode with animated header
                    <motion.div
                        key="filter-mode"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="pb-8"
                    >
                        {/* Animated Header Search */}
                        <motion.div
                            layout
                            initial={{ y: 0 }}
                            animate={{ y: 0 }}
                            className="bg-white border-b border-gray-200 px-6 py-6"
                        >
                            <div className="max-w-7xl mx-auto">
                                <SearchBox
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    attachedFiles={attachedFiles}
                                    setAttachedFiles={setAttachedFiles}
                                    handleFileChange={handleFileChange}
                                    handleSubmitQuestion={handleSubmitQuestion}
                                    isFilterMode={isFilterMode}
                                />
                                <button
                                    onClick={handleFilterToggle}
                                    className="mt-4 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                                >
                                    <X className="w-4 h-4" />
                                    Close Filters
                                </button>
                            </div>
                        </motion.div>

                        {/* Filter Content */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="max-w-7xl mx-auto px-6 mt-6"
                        >
                            {/* Tag Filters */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-blue-600" />
                                    Filter by Tags
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {allTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => handleTagToggle(tag)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedTags.includes(tag)
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Personas Grid */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4">
                                    {filteredPersonas.length} Personas Found
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredPersonas.map((persona, index) => (
                                        <motion.div
                                            key={persona.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-4xl">{persona.avatar}</div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{persona.name}</h4>
                                                        <p className="text-sm text-gray-600">{persona.description}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                                                        <MessageSquare className="w-4 h-4 text-blue-600" />
                                                    </button>
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                                                        <Edit2 className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {persona.tags.map(tag => (
                                                    <span
                                                        key={tag}
                                                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function SearchBox({
    searchQuery,
    setSearchQuery,
    attachedFiles,
    setAttachedFiles,
    handleFileChange,
    handleSubmitQuestion,
    isFilterMode
}: any) {
    return (
        <motion.div layout className="relative">
            <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow">
                <div className="flex items-center px-6 py-4">
                    <Search className="w-6 h-6 text-gray-400 mr-4" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitQuestion()}
                        placeholder="Ask a question or search personas..."
                        className="flex-1 text-lg outline-none text-gray-800 placeholder-gray-400"
                    />
                    <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <input
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <span className="text-2xl">📎</span>
                    </label>
                </div>

                {attachedFiles.length > 0 && (
                    <div className="px-6 pb-4 flex flex-wrap gap-2">
                        {attachedFiles.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full text-sm">
                                <span className="text-blue-700">{file.name}</span>
                                <button
                                    onClick={() => setAttachedFiles(attachedFiles.filter((_, idx) => idx !== i))}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default MainPage;