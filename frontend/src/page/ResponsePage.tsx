import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, CheckCircle2, Brain } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { ResponseStatus } from '../types/utils';
import ResponseCard from '../features/response/ResponseCard';
import { useDispatch } from 'react-redux';
import { useGetPersonasQuery } from '../store/apiSlice';
import { setPersonas, cleanResponses } from '../store/questionSlice';
import AnalysisTab from '../features/response/AnalysisTab';
import { useTranslation } from 'react-i18next';

export default function ResponsesPage() {
    const { t } = useTranslation();
    const question = useSelector((state: RootState) => state.question.question);
    const toAskPersonas = useSelector((state: RootState) => state.question.personas);
    const attachedFiles = useSelector((state: RootState) => state.question.attachedFiles);
    const responses = useSelector((state: RootState) => state.question.responses);
    const [responsesStatus, setResponsesStatus] = useState<Map<string, ResponseStatus>>(new Map<string, ResponseStatus>());
    const [activeTab, setActiveTab] = useState<'responses' | 'analysis'>('responses');
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [allCompleted, setAllCompleted] = useState(false);
    const [completedCount, setCompletedCount] = useState(0);
    const dispatch = useDispatch();
    const shouldFetchAllPersonas = Boolean(question && question.trim().length > 0 && (toAskPersonas?.length ?? 0) === 0);
    // use RTK Query hook to fetch personas when needed
    const { data: personasQueryData } = useGetPersonasQuery({ pageSize: 10000 }, { skip: !shouldFetchAllPersonas });

    useEffect(() => {
        setAllCompleted([...responsesStatus.values()].every(status => status === 'completed' || status === 'error'));
        setCompletedCount([...responsesStatus.values()].filter(status => status === 'completed' || status === 'error').length);
    }, [responsesStatus]);

    const listenToBroadcastOfPersonaState = (personaId: string, state: ResponseStatus) => {
        setResponsesStatus(prev => {
            return new Map(prev).set(personaId, state)
        });
    }

    // Setup function: 1) If no personas in store but there's a question, fetch all personas and populate store
    //                 2) Clean up any previous responses 
    useEffect(() => {
        let mounted = true;

        const doSetup = async () => {
            // If there's nothing to do, skip
            if (!question || question.trim().length === 0) return;

            // only run setup if we have a question and there are no personas to ask
            const needPersonas = (toAskPersonas?.length ?? 0) === 0;
            if (!needPersonas) return;
            setIsSettingUp(true);

            try {
                // 1) fetch all personas if needed - the useGetPersonasQuery hook will run when shouldFetchAllPersonas is true
                if (needPersonas && personasQueryData) {
                    const items = personasQueryData?.items ?? (Array.isArray(personasQueryData) ? personasQueryData : []);
                    if (mounted && items && items.length > 0) {
                        dispatch(setPersonas(items));
                    }
                }

                // 2 ) Clean up previous responses
                setResponsesStatus(new Map<string, ResponseStatus>());
                dispatch(cleanResponses());
            } finally {
                if (mounted) setIsSettingUp(false);
            }
        };

        // Run setup once when component mounts or when question/attachedFiles change
        doSetup();

        return () => { mounted = false; };
    }, [question, toAskPersonas?.length, attachedFiles?.length, personasQueryData]);


    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('response.personaResponses')}</h1>
                    <p className="text-gray-600">
                        {t('response.askingPersonasAbout', {
                            count: toAskPersonas.length,
                            question: question
                        })}
                    </p>
                </div>

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200 sticky top-0 bg-gray-50 z-10">
                    <div className="flex gap-1">
                        <button
                            onClick={() => setActiveTab('responses')}
                            className={`px-6 py-3 font-medium transition-colors relative ${activeTab === 'responses'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                {t('response.responsesTab')}
                                {Object.keys(responses).length > 0 && (
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${allCompleted ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {completedCount}/{Object.keys(responses).length}
                                    </span>
                                )}
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`px-6 py-3 font-medium transition-colors relative ${activeTab === 'analysis'
                                ? 'text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4" />
                                {t('response.analysisTab')}
                            </div>
                        </button>
                    </div>
                </div>

                {activeTab === 'responses' && (
                    <div className="mb-6 flex items-center justify-between">
                        {Object.keys(responses).length > 0 && (
                            <div className="text-sm text-gray-600">
                                {t('response.completedCounter', { completed: completedCount, total: Object.keys(responses).length })}
                            </div>
                        )}

                        {allCompleted && Object.keys(responses).length && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2 text-green-600 font-medium"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                {t('response.allReceived')}
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'responses' ? (
                        <motion.div
                            key="responses"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isSettingUp ? (
                                <div className="p-6 text-center text-gray-600">{t('response.preparingPersonas')}</div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {toAskPersonas.map(persona => {
                                        return (
                                            <ResponseCard
                                                key={persona.id}
                                                persona={persona}
                                                broadcastState={(status) => listenToBroadcastOfPersonaState(persona.id, status)}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="analysis"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <AnalysisTab canAnalyze={allCompleted && completedCount > 0} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};