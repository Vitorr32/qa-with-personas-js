import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Filter, Check, } from 'lucide-react';

import QuestionInput from '../features/chat/QuestionInput';
import PersonaGrid from '../features/personas/PersonaGrid';
import PersonaChip from '../features/personas/PersonaChip';
import { useDispatch } from 'react-redux';
import { useNavigate } from '@tanstack/react-router';
import { setQuestion, setFiles, setPersonas, setTags } from '../store/questionSlice';
import { useCheckOpenAIFileMutation } from '../store/apiSlice';
import { errorToast, successToast } from '../utils/Toasts';
import { Tag } from '../utils/Tag';
import { Persona } from '../utils/Persona';
import { mergeArraysOfObjects } from '../utils/utils';
import SearchBox from '../features/utils/SearchBox';

export default function MainPage() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isFilterMode, setIsFilterMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [questionInput, setQuestionInput] = useState('');
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [toAskList, setToAskList] = useState<Persona[]>([]);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

    const handleFilterToggle = () => {
        setIsFilterMode(!isFilterMode);
        if (!isFilterMode) {
            setSearchQuery('');
        }
    };

    const handleToggleToAskList = (persona: Persona) => {
        setToAskList(prev =>
            prev.find((q) => q.id === persona.id)
                ? prev.filter(q => q.id !== persona.id)
                : [...prev, persona]
        );
    };

    const handleBulkToggleToAskList = (personas: Persona[]) => {
        setToAskList(prev => {
            return mergeArraysOfObjects(prev, personas)
        })
    };

    const [checkOpenAIFileTrigger] = useCheckOpenAIFileMutation();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        const accepted: File[] = [];
        for (const f of files) {
            try {
                const res: any = await checkOpenAIFileTrigger(f);
                // RTK mutation returns { data } or { error }
                if (res && res.data && (res.data.ok || res.data.accepted)) {
                    accepted.push(f);
                    successToast(`File ${f.name} accepted`);
                } else if (res && res.data && res.data.reason) {
                    errorToast(`File ${f.name} rejected: ${res.data.reason}`);
                } else if (res && res.error) {
                    errorToast(`File ${f.name} rejected: ${JSON.stringify(res.error)}`);
                } else {
                    errorToast(`File ${f.name} rejected: invalid`);
                }
            } catch (err: any) {
                errorToast(`File ${f.name} check failed: ${err?.message || 'error'}`);
            }
        }
        if (accepted.length > 0) setAttachedFiles(accepted);
        e.currentTarget.value = '';
    };

    const handleSubmitQuestion = () => {
        dispatch(setQuestion(questionInput))
        dispatch(setFiles(attachedFiles))
        dispatch(setPersonas(toAskList))
        dispatch(setTags(selectedTags))

        navigate({
            to: "/response"
        })
    };

    const handleBackToQuestion = () => {
        setIsFilterMode(false);
    };

    return (
        <AnimatePresence mode="wait">
            {!isFilterMode ? (
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
                                ? t('mainpage.selectedPersonaCount', { count: toAskList.length })
                                : t('mainpage.defaultPersonaText')}
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
                                    ? t('mainpage.askPersona', { count: toAskList.length })
                                    : t('mainpage.askAllPersonas')}
                            </button>
                            <button
                                onClick={handleFilterToggle}
                                className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300 flex items-center gap-2"
                            >
                                <Filter className="w-4 h-4" />
                                {toAskList.length > 0 ? t('mainpage.editSelection') : t('mainpage.selectPersonas')}
                            </button>
                        </div>

                        {/* Selected Personas Preview */}
                        {toAskList.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 bg-white rounded-xl p-6 border border-gray-200"
                            >
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('mainpage.selectedPersonas')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {toAskList.map((persona, index) => {
                                        return persona ? (
                                            <PersonaChip key={persona.id} persona={persona} onRemove={handleToggleToAskList} animationDelay={index * 0.05} />
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
                                <h2 className="text-2xl font-bold text-gray-800">{t('mainpage.selectPersonas')}</h2>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-full font-medium">
                                        {t('mainpage.selectedBadge', { count: toAskList.length })}
                                    </span>
                                    <button
                                        onClick={handleBackToQuestion}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        {t('common.done')}
                                    </button>
                                </div>
                            </div>

                            {/* Search Box */}
                            <SearchBox setSearchQuery={setSearchQuery} searchQuery={searchQuery} selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
                        </div>
                    </motion.div>

                    {/* Filter Content */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="max-w-7xl mx-auto px-6 mt-6"
                    >
                        <PersonaGrid selectedTags={selectedTags} searchQuery={searchQuery} selectedPersonas={toAskList} onToggleSelect={handleToggleToAskList} onAddAllFiltered={handleBulkToggleToAskList} />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

    );
}