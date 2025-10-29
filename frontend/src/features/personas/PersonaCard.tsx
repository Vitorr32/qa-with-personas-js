import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Info, X, Tag } from 'lucide-react';
import { Persona } from '../../utils/Persona';
import { getPersonaAvatar } from '../../utils/Avatar';
import TagChipList from '../utils/TagChipList';

interface PersonaCardProps {
    persona: Persona;
    isSelected: boolean;
    onToggleSelect: () => void;
    animationDelay?: number;
}


export default function PersonaCard({ persona, isSelected, onToggleSelect, animationDelay = 0 }: PersonaCardProps) {
    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't toggle if clicking on details button
        if ((e.target as HTMLElement).closest('.details-button')) {
            return;
        }
        onToggleSelect();
    };

    const handleDetailsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowModal(true);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: animationDelay }}
                onClick={handleCardClick}
                className={`bg-white rounded-xl p-6 border-2 cursor-pointer transition-all relative ${isSelected
                    ? 'border-blue-500 shadow-lg shadow-blue-200 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
            >
                {/* Header with Avatar, Name, and Checkbox */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {getPersonaAvatar(persona)}
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate text-lg">
                                {persona.name}
                            </h4>
                        </div>
                    </div>

                    {/* Checkbox */}
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ml-2 ${isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                        }`}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                </div>

                {/* Greeting */}
                <p className={`text-sm mb-3 line-clamp-2 italic ${isSelected ? 'text-gray-700' : 'text-gray-600'
                    }`}>
                    "{persona.greeting}"
                </p>

                {/* Tags and Details Button */}
                <div className="flex items-center justify-between">
                    <TagChipList tags={persona.tags} />

                    {/* Details Button */}
                    <button
                        onClick={handleDetailsClick}
                        className="details-button flex-shrink-0 ml-2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        aria-label={t('personacard.ariaViewDetails')}
                    >
                        <Info className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
            </motion.div>

            {/* Details Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white relative">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    {getPersonaAvatar(persona)}

                                    <div className="flex-1">
                                        <h2 className="text-3xl font-bold mb-2">{persona.name}</h2>
                                        <p className="text-white/90 italic">"{persona.greeting}"</p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="px-6 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                                {/* Description */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <Info className="w-5 h-5 text-blue-600" />
                                        {t('personacard.description')}
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {persona.description}
                                    </p>
                                </div>

                                {/* Tags */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Tag className="w-5 h-5 text-blue-600" />
                                        {t('personacard.tagsLabel', { count: persona.tags.length })}
                                    </h3>
                                    <TagChipList tags={persona.tags} full/>
                                </div>

                                {/* Metadata */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('personacard.metadata')}</h3>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p><span className="font-medium">{t('personacard.id')}:</span> {persona.id}</p>
                                        <p><span className="font-medium">{t('personacard.totalTags')}:</span> {persona.tags.length}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                                >
                                    {t('personacard.close')}
                                </button>
                                <button
                                    onClick={() => {
                                        onToggleSelect();
                                        setShowModal(false);
                                    }}
                                    className={`px-4 py-2 rounded-lg transition-colors font-medium ${isSelected
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    {isSelected ? t('personacard.removeFromSelection') : t('personacard.addToSelection')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}