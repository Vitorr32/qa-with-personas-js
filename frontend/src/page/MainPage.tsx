import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, Filter, X, Check, } from 'lucide-react';
import { Persona } from '../utils/Persona';

import QuestionInput from '../features/chat/QuestionInput';
import TagFilter from '../features/personas/TagFilter';
import PersonaGrid from '../features/personas/PersonaGrid';
import PersonaChip from '../features/personas/PersonaChip';
import { Link } from '@tanstack/react-router';
import { useDispatch } from 'react-redux';
import { useNavigate } from '@tanstack/react-router';
import { setQuestion, setFiles, setPersonas, setTags } from '../store/questionSlice';

// Mock data for personas
const mockPersonas: Persona[] = [
    {
        id: '1',
        name: 'Code Expert',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CodeExpert',
        greeting: 'Hello! I\'m here to help you with any coding challenges you might have.',
        description: 'I am a specialized AI assistant with deep knowledge in software development, programming languages, algorithms, and best practices. I can help you debug code, explain complex concepts, review your work, and suggest improvements. Whether you\'re working with JavaScript, Python, Java, or any other language, I\'m here to assist.',
        tags: ['coding', 'technical', 'javascript', 'python', 'debugging', 'algorithms']
    },
    {
        id: '2',
        name: 'Creative Writer',
        greeting: 'Welcome! Let\'s craft some amazing stories together.',
        description: 'As a creative writing specialist, I help bring your ideas to life through compelling narratives, character development, and engaging prose. I can assist with fiction, non-fiction, poetry, screenwriting, and more. Let\'s explore the art of storytelling and create something memorable.',
        tags: ['writing', 'creative', 'storytelling', 'fiction']
    },
    {
        id: '3',
        name: 'Business Advisor',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BusinessAdvisor',
        greeting: 'Ready to take your business to the next level?',
        description: 'With expertise in business strategy, market analysis, and operational efficiency, I provide guidance for entrepreneurs and business leaders. Whether you\'re starting a new venture, scaling operations, or pivoting your business model, I offer insights backed by proven frameworks and real-world experience.',
        tags: ['business', 'strategy', 'consulting', 'entrepreneurship', 'growth']
    }
];


// Mock API call - Replace with real API
const mockFetchTags = async (query: string, selectedTags: string[]): Promise<string[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const allTags = [
        'coding', 'technical', 'writing', 'creative', 'business', 'strategy',
        'wellness', 'coaching', 'data', 'marketing', 'fitness', 'finance',
        'javascript', 'python', 'react', 'nodejs', 'typescript', 'java',
        'design', 'ux', 'ui', 'frontend', 'backend', 'fullstack',
        'ai', 'machine-learning', 'deep-learning', 'nlp', 'computer-vision',
        'blockchain', 'cryptocurrency', 'web3', 'smart-contracts',
        'cloud', 'aws', 'azure', 'gcp', 'devops', 'kubernetes',
        'mobile', 'ios', 'android', 'flutter', 'react-native',
        'database', 'sql', 'nosql', 'mongodb', 'postgresql',
        'testing', 'qa', 'automation', 'cypress', 'jest',
        'agile', 'scrum', 'project-management', 'leadership',
        'sales', 'customer-service', 'crm', 'saas',
        'content-writing', 'copywriting', 'seo', 'social-media',
        'photography', 'video-editing', 'animation', 'graphics',
        'music', 'audio-production', 'sound-design',
        'health', 'nutrition', 'mental-health', 'meditation',
        'education', 'teaching', 'e-learning', 'tutoring',
        'legal', 'law', 'contracts', 'compliance',
        'accounting', 'bookkeeping', 'tax', 'audit',
        'hr', 'recruiting', 'talent-acquisition', 'employee-relations'
    ];

    return allTags
        .filter(tag =>
            tag.toLowerCase().includes(query.toLowerCase()) &&
            !selectedTags.includes(tag)
        )
        .slice(0, 10); // Limit to 10 suggestions
};

export default function MainPage() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isFilterMode, setIsFilterMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [questionInput, setQuestionInput] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [toAskList, setToAskList] = useState<string[]>([]);
    const [filteredPersonas, setFilteredPersonas] = useState(mockPersonas);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

    const handleFilterToggle = () => {
        setIsFilterMode(!isFilterMode);
        if (!isFilterMode) {
            // Entering filter mode - reset search
            setSearchQuery('');
        }
    };

    const handleTagToggle = (tags: string[]) => {
        setSelectedTags(tags);
    };

    const handleToggleToAskList = (personaId: string) => {
        setToAskList(prev =>
            prev.includes(personaId)
                ? prev.filter(id => id !== personaId)
                : [...prev, personaId]
        );
    };

    const handleBulkToggleToAskList = (personaIds: string[]) => {
        setToAskList(prev => {
            // Merge arrays and then create a Set to remove duplicates.
            const combinedArray = [...prev, ...personaIds];
            const uniqueElementsSet = new Set(combinedArray);
            return [...uniqueElementsSet];
        })
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachedFiles(Array.from(e.target.files));
        }
    };

    const handleSubmitQuestion = () => {
        dispatch(setQuestion(questionInput))
        dispatch(setFiles(attachedFiles))
        dispatch(setPersonas(toAskList))
        dispatch(setTags(selectedTags))

        navigate({
            to: "/results"
        })
    };

    const handleBackToQuestion = () => {
        setIsFilterMode(false);
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
        <AnimatePresence mode="wait">
            {!isFilterMode ? (
                // Google-like centered question input
                <motion.div
                    key="question-center"
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
                        <Link to="/results" className="[&.active]:font-bold">
                            Home
                        </Link>
                        <motion.h2
                            layout
                            className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent"
                        >
                            {t("search.title")}
                        </motion.h2>
                        <motion.p
                            layout
                            className="text-center text-gray-600 mb-8 text-lg"
                        >
                            {toAskList.length > 0
                                ? `Get answers from ${toAskList.length} selected persona${toAskList.length > 1 ? 's' : ''}`
                                : 'Get answers from thousands of specialized personas'}
                        </motion.p>

                        {/* Question Input Box */}
                        <QuestionInput
                            questionInput={questionInput}
                            setQuestionInput={setQuestionInput}
                            attachedFiles={attachedFiles}
                            setAttachedFiles={setAttachedFiles}
                            handleFileChange={handleFileChange}
                            handleSubmitQuestion={handleSubmitQuestion}
                        />

                        <div className="flex justify-center gap-3 mt-6">
                            <button
                                onClick={handleSubmitQuestion}
                                disabled={!questionInput.trim()}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {toAskList.length > 0
                                    ? `Ask ${toAskList.length} Persona${toAskList.length > 1 ? 's' : ''}`
                                    : 'Ask All Personas'}
                            </button>
                            <button
                                onClick={handleFilterToggle}
                                className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300 flex items-center gap-2"
                            >
                                <Filter className="w-4 h-4" />
                                {toAskList.length > 0 ? 'Edit Selection' : 'Select Personas'}
                            </button>
                        </div>

                        {/* Selected Personas Preview */}
                        {toAskList.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 bg-white rounded-xl p-6 border border-gray-200"
                            >
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Selected Personas:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {toAskList.map((id, index) => {
                                        const persona = mockPersonas.find(p => p.id === id);
                                        return persona ? (
                                            <PersonaChip key={id} persona={persona} onRemove={handleToggleToAskList} animationDelay={index * 0.05} />
                                        ) : null;
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            ) : (
                // Filter/Selection mode
                <motion.div
                    key="filter-mode"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pb-8"
                >
                    {/* Search Header */}
                    <motion.div
                        layout
                        className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10"
                    >
                        <div className="max-w-7xl mx-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-gray-800">Select Personas</h2>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-full font-medium">
                                        {toAskList.length} selected
                                    </span>
                                    <button
                                        onClick={handleBackToQuestion}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        Done
                                    </button>
                                </div>
                            </div>

                            {/* Search Box */}
                            <div className="relative bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex items-center px-4 py-3">
                                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search personas by name or description..."
                                        className="flex-1 text-base outline-none bg-transparent text-gray-800 placeholder-gray-400"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                                        >
                                            <X className="w-4 h-4 text-gray-500" />
                                        </button>
                                    )}
                                </div>
                            </div>
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
                        <TagFilter selectedTags={selectedTags} onTagsChange={handleTagToggle} onFetchTags={mockFetchTags} />

                        <PersonaGrid personas={filteredPersonas} selectedPersonas={toAskList} onToggleSelect={handleToggleToAskList} onAddAllFiltered={handleBulkToggleToAskList} />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

    );
}