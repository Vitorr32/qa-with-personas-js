import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check, LoaderPinwheel, Save } from "lucide-react";
import { useGetPromptsQuery, useGetBedrockModelsQuery, useUpdatePromptsMutation } from "../../store/apiSlice";
import { extractMessageFromErrorAndToast, successToast } from "../../utils/Toasts";
import LoadingContainer from "../utils/LoadingContainer";

export default function PromptsEditor() {
    const { t } = useTranslation();
    const { data, isLoading } = useGetPromptsQuery();
    const [updatePrompts, { isLoading: isSaving }] = useUpdatePromptsMutation();

    const [saved, setSaved] = useState(false);
    const [mainPrompt, setMainPrompt] = useState('');
    const [analystPrompt, setAnalystPrompt] = useState('');
    const [temperature, setTemperature] = useState(0.7);
    const [analystModel, setAnalystModel] = useState<string | null>(null);
    const [responseModel, setResponseModel] = useState<string | null>(null);

    const provider = (import.meta.env.VITE_LLM_PROVIDER || 'openai').toLowerCase();
    const isBedrock = provider === 'bedrock';
    const { data: models, isLoading: isLoadingModels } = useGetBedrockModelsQuery(undefined, { skip: !isBedrock });

    // Sync query data into local state when it arrives
    useEffect(() => {
        if (data) {
            setMainPrompt(data.mainPrompt || '');
            setAnalystPrompt(data.analystPrompt || '');
            setTemperature(typeof data.temperature === 'number' ? data.temperature : 0.7);
            setAnalystModel((data as any).analystModel ?? null);
            setResponseModel((data as any).responseModel ?? null);
        }
    }, [data]);

    const handleSave = async () => {
        setSaved(false);
        try {
            // Clamp temperature on save as an extra safety
            const clampedTemp = Math.max(0.1, Math.min(2, Number(temperature) || 0.7));
            await updatePrompts({
                mainPrompt,
                analystPrompt,
                temperature: clampedTemp,
                analystModel: isBedrock ? (analystModel || undefined) : undefined,
                responseModel: isBedrock ? (responseModel || undefined) : undefined,
            }).unwrap();
            setSaved(true);
            successToast("Prompts updated succesfully!");
            // hide the saved indicator after a short delay
            setTimeout(() => setSaved(false), 2000);
        } catch (err: any) {
            extractMessageFromErrorAndToast(err, "Failed to update prompts");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            <LoadingContainer isLoading={isLoading}>
                <>
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('prompts.title')}</h2>
                        <p className="text-gray-600">{t('prompts.subtitle')}</p>
                    </div>

                    {/* Main Prompt */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg mb-4">
                        <label className="block mb-2">
                            <span className="text-sm font-semibold text-gray-700">{t('prompts.mainLabel')}</span>
                            <span className="text-xs text-gray-500 ml-2">{t('prompts.mainHelp')}</span>
                        </label>
                        <textarea
                            value={mainPrompt}
                            onChange={(e) => setMainPrompt(e.target.value)}
                            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            placeholder={t('prompts.mainPlaceholder')}
                        />
                        <p className="text-xs text-gray-500 mt-2">{t('prompts.charCount', { count: mainPrompt.length || 0 })}</p>

                        {isBedrock && (
                            <div className="mt-4">
                                <label className="block mb-2">
                                    <span className="text-sm font-semibold text-gray-700">{t('prompts.responseModelLabel', 'Response Model')}</span>
                                    <span className="text-xs text-gray-500 ml-2">{t('prompts.responseModelHelp', 'Select the Bedrock model to generate responses. Leave as "Default" to use environment configuration.')}</span>
                                </label>
                                <select
                                    value={responseModel ?? ''}
                                    onChange={(e) => setResponseModel(e.target.value || null)}
                                    disabled={isLoadingModels}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    <option value="">{t('prompts.defaultEnvOption', 'Default (env)')}</option>
                                    {(models || []).map((m) => (
                                        <option key={m.modelId} value={m.modelId}>
                                            {`${m.providerName || ''} ${m.modelName || m.modelId}`} {m.contextWindow ? t('prompts.ctxAbbrev', { count: m.contextWindow }) : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Analyst Prompt */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg mb-4">
                        <label className="block mb-2">
                            <span className="text-sm font-semibold text-gray-700">{t('prompts.analystLabel')}</span>
                            <span className="text-xs text-gray-500 ml-2">{t('prompts.analystHelp')}</span>
                        </label>
                        <textarea
                            value={analystPrompt}
                            onChange={(e) => setAnalystPrompt(e.target.value)}
                            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            placeholder={t('prompts.analystPlaceholder')}
                        />
                        <p className="text-xs text-gray-500 mt-2">{t('prompts.charCount', { count: analystPrompt.length || 0 })}</p>

                        {isBedrock && (
                            <div className="mt-4">
                                <label className="block mb-2">
                                    <span className="text-sm font-semibold text-gray-700">{t('prompts.analystModelLabel', 'Analyst Model')}</span>
                                    <span className="text-xs text-gray-500 ml-2">{t('prompts.analystModelHelp', 'Select the Bedrock model to use for analysis. Leave as "Default" to use environment configuration.')}</span>
                                </label>
                                <select
                                    value={analystModel ?? ''}
                                    onChange={(e) => setAnalystModel(e.target.value || null)}
                                    disabled={isLoadingModels}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    <option value="">{t('prompts.defaultEnvOption', 'Default (env)')}</option>
                                    {(models || []).map((m) => (
                                        <option key={m.modelId} value={m.modelId}>
                                            {`${m.providerName || ''} ${m.modelName || m.modelId}`} {m.contextWindow ? t('prompts.ctxAbbrev', { count: m.contextWindow }) : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Temperature */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg mb-4">
                        <label className="block mb-2">
                            <span className="text-sm font-semibold text-gray-700">{t('prompts.temperatureLabel', 'Temperature')}</span>
                            <span className="text-xs text-gray-500 ml-2">{t('prompts.temperatureHelp', 'Controls randomness for main prompt questions (0.1–2.0)')}</span>
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min={0.1}
                                max={2}
                                step={0.1}
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                className="flex-1"
                            />
                            <input
                                type="number"
                                min={0.1}
                                max={2}
                                step={0.1}
                                value={Number.isFinite(temperature) ? temperature : 0.7}
                                onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    if (isNaN(v)) { setTemperature(0.7); return; }
                                    setTemperature(v);
                                }}
                                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{t('prompts.temperatureRange', 'Allowed range: 0.1 – 2.0')}</p>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-60"
                    >
                        {isSaving ? <LoaderPinwheel className="w-5 h-5 animate-spin" /> : (saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />)}
                        {saved ? t('prompts.saved') : (isSaving ? t('prompts.saving') : t('prompts.saveButton'))}
                    </button>
                </>
            </LoadingContainer>
        </motion.div>
    );
}
