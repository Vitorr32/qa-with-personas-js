import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, Filter, X, Check, } from 'lucide-react';
import { Persona } from '../utils/Persona';

import QuestionInput from '../features/chat/QuestionInput';
import TagFilter from '../features/personas/TagFilter';
import PersonaGrid from '../features/personas/PersonaGrid';
import PersonaChip from '../features/personas/PersonaChip';
import { Link, useRouter } from '@tanstack/react-router';
import { useDispatch } from 'react-redux';
import { useNavigate } from '@tanstack/react-router';
import { setQuestion, setFiles, setPersonas, setTags } from '../store/questionSlice';
import Sidebar from '../features/settings/SideBar';


export default function SettingsPage() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const router = useRouter();
    const [isFilterMode, setIsFilterMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [questionInput, setQuestionInput] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [toAskList, setToAskList] = useState<string[]>([]);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

    const handleBackToQuestion = () => {
        setIsFilterMode(false);
    };

    console.log(router.state)

    return (
        <AnimatePresence mode="wait">
            <motion.div
                layout
                className="w-full"
            >
                <div className="flex items-center justify-between mb-4 p-4 px-6">
                    <h2 className="text-2xl font-bold text-gray-800">Application Settings</h2>
                </div>

                <hr className="w-5/6 mx-auto" />

                <motion.div className='flex'>
                    <div className="w-1/4">
                        <Sidebar />
                    </div>
                    <div className="w-3/4">
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}