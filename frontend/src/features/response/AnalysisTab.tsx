import { AlertCircle, BarChart3, Brain, CheckCircle2, Hash, Loader2, MessageSquare, PieChart } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { useFetchAnalysisMutation } from "../../store/apiSlice";
import { useState } from "react";
import { ResponseStatus } from "../../types/utils";
import { motion } from 'framer-motion';
import { extractMessageFromErrorAndToast } from "../../utils/Toasts";
import { generateCompleteAnalysis } from "../../utils/parser";
import SentimentChart from "./SentimentChart";
import ThemesList from "./ThemesList";
import { WordCloud } from "@isoterik/react-word-cloud";
import { AnalysisData } from "../../utils/interfaces";

interface AnalysisTabProps {
    canAnalyze: boolean;
}

export default function AnalysisTab({ canAnalyze }: AnalysisTabProps) {
    const { t } = useTranslation();
    const question = useSelector((state: RootState) => state.question.question);
    const responses = useSelector((state: RootState) => state.question.responses);
    const fileIds = useSelector((state: RootState) => state.question.fileIds);
    const [getAnalysis] = useFetchAnalysisMutation();

    const [analysisStatus, setAnalysisStatus] = useState<ResponseStatus>('idle');
    const [analysisData, setAnalysisData] = useState<AnalysisData>()

    async function onStartAnalysis() {
        try {
            setAnalysisStatus('pending');
            // Trigger analysis API call
            const formattedResponses = Object.entries(responses).map(([persona, resp]) => ({ persona, response: resp }));
            const analysisRaw = await getAnalysis({ question, responses: formattedResponses, fileIds });
            setAnalysisData(generateCompleteAnalysis(analysisRaw.data?.analysis || "", responses));
            setAnalysisStatus('completed');
        } catch (err) {
            extractMessageFromErrorAndToast(err, "Analysis failed");
        }
    }

    return (
        <div className="space-y-6">
            {/* Analysis Header */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{t('analysistab.analysisTitle')}</h2>
                            <p className="text-sm text-gray-600">{t('analysistab.subtitle')}</p>
                        </div>
                    </div>

                    {analysisStatus === "idle" && (
                        <button
                            onClick={onStartAnalysis}
                            disabled={!canAnalyze}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {t('analysistab.startAnalysis')}
                        </button>
                    )}

                    {analysisStatus === "pending" && (
                        <div className="flex items-center gap-2 text-purple-600">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-medium">{t('analysistab.analyzing')}</span>
                        </div>
                    )}

                    {analysisStatus === "completed" && (
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">{t('analysistab.analysisComplete')}</span>
                        </div>
                    )}
                </div>

                {/* Summary */}
                {/* {analysisStatus === "completed" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100"
                    >
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Executive Summary
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                            {analysis.status === 'analyzing' && (
                                <motion.span
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    className="inline-block w-2 h-4 bg-purple-500 ml-1"
                                />
                            )}
                        </p>
                    </motion.div>
                )} */}
            </div>

            {/* Key Insights */}
            {analysisStatus === 'completed' && analysisData && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Key Points */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
                        >
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                Key Points
                            </h3>
                            <ul className="space-y-3">
                                {analysisData.keyPoints.map((point, index) => (
                                    <motion.li
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + index * 0.1 }}
                                        className="flex items-start gap-2 text-sm text-gray-700"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                                        {point}
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Disagreements */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
                        >
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                                Points of Divergence
                            </h3>
                            <ul className="space-y-3">
                                {analysisData.divergences.map((point, index) => (
                                    <motion.li
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + index * 0.1 }}
                                        className="flex items-start gap-2 text-sm text-gray-700"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                                        {point}
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>

                    {/* Consensus */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
                    >
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            Consensus View
                        </h3>
                        <p className="text-gray-700 bg-blue-50 rounded-lg p-4 border border-blue-100">
                            {analysisData.consensus}
                        </p>
                    </motion.div>

                    {/* Data Visualizations */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Word Cloud */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
                        >
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Hash className="w-5 h-5 text-blue-600" />
                                Word Cloud
                            </h3>
                            <WordCloud words={analysisData.wordFrequency} width={400} height={300} fontSize={(word) => {
                                // Normalize value between min and max
                                const normalized = (word.value - 10) / (100 - 10);
                                const size = 16 + normalized * (100 - 10);
                                return size;
                            }} />
                        </motion.div>

                        {/* Sentiment Analysis */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
                        >
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-purple-600" />
                                Sentiment Distribution
                            </h3>
                            <SentimentChart sentimentDistribution={analysisData.sentimentDistribution} />
                        </motion.div>
                    </div>

                    {/* Themes */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
                    >
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-indigo-600" />
                            Common Themes
                        </h3>
                        <ThemesList themes={analysisData.themes} />
                    </motion.div>
                </>
            )}

            {/* Idle State */}
            {analysisStatus === 'idle' && (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
                    <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Analyze</h3>
                    <p className="text-gray-600 mb-6">
                        {canAnalyze
                            ? "Click 'Start Analysis' to generate insights from all persona responses"
                            : "Complete all persona responses first to enable analysis"}
                    </p>
                </div>
            )}
        </div>
    );
}
