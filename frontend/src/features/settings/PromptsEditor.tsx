import { useState } from "react";
import { motion } from 'framer-motion';
import { Check, Save } from "lucide-react";

export default function PromptsEditor({ mainPrompt, setMainPrompt, analystPrompt, setAnalystPrompt }: any) {
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        // API call here
        console.log('Saving prompts:', { mainPrompt, analystPrompt });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">System Prompts</h2>
                <p className="text-gray-600">Configure the default prompts for the system</p>
            </div>

            {/* Main Prompt */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <label className="block mb-2">
                    <span className="text-sm font-semibold text-gray-700">Main Prompt</span>
                    <span className="text-xs text-gray-500 ml-2">Used for general queries</span>
                </label>
                <textarea
                    value={mainPrompt}
                    onChange={(e) => setMainPrompt(e.target.value)}
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    placeholder="Enter the main system prompt..."
                />
                <p className="text-xs text-gray-500 mt-2">{mainPrompt.length} characters</p>
            </div>

            {/* Analyst Prompt */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <label className="block mb-2">
                    <span className="text-sm font-semibold text-gray-700">Analyst Prompt</span>
                    <span className="text-xs text-gray-500 ml-2">Used for analyzing responses</span>
                </label>
                <textarea
                    value={analystPrompt}
                    onChange={(e) => setAnalystPrompt(e.target.value)}
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    placeholder="Enter the analyst prompt..."
                />
                <p className="text-xs text-gray-500 mt-2">{analystPrompt.length} characters</p>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-200 flex items-center gap-2"
            >
                {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {saved ? 'Saved!' : 'Save Prompts'}
            </button>
        </motion.div>
    );
}
