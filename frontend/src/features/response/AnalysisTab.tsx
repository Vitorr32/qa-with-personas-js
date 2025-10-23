import { Brain } from "lucide-react";

export default function AnalysisTab() {
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
                            <h2 className="text-xl font-bold text-gray-900">AI Analysis</h2>
                            <p className="text-sm text-gray-600">Comprehensive response analysis</p>
                        </div>
                    </div>

                    {analysis.status === 'idle' && (
                        <button
                            onClick={onStartAnalysis}
                            disabled={!canAnalyze}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Start Analysis
                        </button>
                    )}

                    {analysis.status === 'analyzing' && (
                        <div className="flex items-center gap-2 text-purple-600">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-medium">Analyzing...</span>
                        </div>
                    )}

                    {analysis.status === 'completed' && (
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">Analysis Complete</span>
                        </div>
                    )}
                </div>

                {/* Summary */}
                {(analysis.status === 'analyzing' || analysis.status === 'completed') && (
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
                            {analysis.summary}
                            {analysis.status === 'analyzing' && (
                                <motion.span
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    className="inline-block w-2 h-4 bg-purple-500 ml-1"
                                />
                            )}
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Key Insights */}
            {analysis.status === 'completed' && (
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
                                {analysis.keyPoints.map((point, index) => (
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
                                {analysis.disagreements.map((point, index) => (
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
                            {analysis.consensus}
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
                                Word Frequency
                            </h3>
                            <WordCloud words={analysis.wordFrequency} />
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
                            <SentimentChart sentiment={analysis.sentiment} />
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
                        <ThemesList themes={analysis.themes} />
                    </motion.div>
                </>
            )}

            {/* Idle State */}
            {analysis.status === 'idle' && (
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
const AnalysisPanel: React.FC<{
    analysis: AnalysisData;
    onStartAnalysis: () => void;
    canAnalyze: boolean;
}> = ({ analysis, onStartAnalysis, canAnalyze }) => {

};
