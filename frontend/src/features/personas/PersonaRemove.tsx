import { motion } from "framer-motion"
import { useState } from "react";
import { Persona } from "../../utils/Persona";
import { AlertTriangle, Search, Trash2 } from "lucide-react";
import PersonaCardRemove from "./PersonaCardRemove";

export default function RemovePersonasSection({ personas, searchQuery, setSearchQuery, selectedTags, setSelectedTags, allTags, selectedPersonas, setSelectedPersonas, onRemove }: any) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleToggleSelect = (id: string) => {
        setSelectedPersonas((prev: string[]) =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        setSelectedPersonas(personas.map((p: Persona) => p.id));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Remove Personas</h2>
                <p className="text-gray-600">Select and remove personas (bulk operation supported)</p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or description..."
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>

                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {allTags.map((tag: string) => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTags((prev: string[]) =>
                                    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                )}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${selectedTags.includes(tag)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-gray-600">{selectedPersonas.length} selected</span>
                    <div className="flex gap-2">
                        <button onClick={handleSelectAll} className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            Select All
                        </button>
                        <button
                            onClick={() => setShowConfirmModal(true)}
                            disabled={selectedPersonas.length === 0}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Remove Selected
                        </button>
                    </div>
                </div>
            </div>

            {/* Personas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personas.map((persona: Persona) => (
                    <PersonaCardRemove
                        key={persona.id}
                        persona={persona}
                        isSelected={selectedPersonas.includes(persona.id)}
                        onToggle={() => handleToggleSelect(persona.id)}
                    />
                ))}
            </div>

            {personas.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-gray-600">No personas found</p>
                </div>
            )}

            {/* Confirm Modal */}
            {showConfirmModal && (
                <ConfirmRemoveModal
                    count={selectedPersonas.length}
                    personaNames={personas.filter((p: Persona) => selectedPersonas.includes(p.id)).map((p: Persona) => p.name)}
                    onConfirm={() => {
                        onRemove(selectedPersonas);
                        setShowConfirmModal(false);
                    }}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
        </motion.div>
    );
}

function ConfirmRemoveModal({ count, personaNames, onConfirm, onCancel }: any) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCancel}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
                <div className="p-6">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                        Confirm Removal
                    </h3>
                    <p className="text-gray-600 text-center mb-4">
                        You are about to permanently delete <span className="font-semibold text-red-600">{count} persona{count !== 1 ? 's' : ''}</span>. This action cannot be undone.
                    </p>

                    {/* List of personas to be removed */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Personas to be removed:</p>
                        <ul className="space-y-1">
                            {personaNames.slice(0, 10).map((name: string, i: number) => (
                                <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                    {name}
                                </li>
                            ))}
                            {personaNames.length > 10 && (
                                <li className="text-sm text-gray-500 italic">
                                    ... and {personaNames.length - 10} more
                                </li>
                            )}
                        </ul>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium"
                        >
                            Yes, Remove
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}