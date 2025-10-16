import { motion } from 'framer-motion';
import { useState } from 'react';
import { Persona } from '../../utils/Persona';
import { Search } from 'lucide-react';
import PersonaCardEdit from '../personas/PersonaCardEdit';
import EditPersonaModal from '../personas/PersonaEditModal';

export default function PersonaEdit({ personas, searchQuery, setSearchQuery, selectedTags, setSelectedTags, allTags, onUpdate }: any) {
    const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Edit Personas</h2>
                <p className="text-gray-600">Search and modify existing personas</p>
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

                {/* Tag Filters */}
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
            </div>

            {/* Personas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personas.map((persona: Persona) => (
                    <PersonaCardEdit
                        key={persona.id}
                        persona={persona}
                        onClick={() => setEditingPersona(persona)}
                    />
                ))}
            </div>

            {personas.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-gray-600">No personas found</p>
                </div>
            )}

            {/* Edit Modal */}
            {editingPersona && (
                <EditPersonaModal
                    persona={editingPersona}
                    onClose={() => setEditingPersona(null)}
                    onSave={(updated: any) => {
                        onUpdate(updated);
                        setEditingPersona(null);
                    }}
                />
            )}
        </motion.div>
    );
}
