import { motion } from 'framer-motion';
import { Check, Plus } from 'lucide-react';
import { Persona } from '../../utils/Persona';
import PersonaCard from './PersonaCard';

interface PersonaGridProps {
    personas: Persona[];
    selectedPersonas: string[];
    onToggleSelect: (personaId: string) => void;
    onAddAllFiltered: (personaIds: string[]) => void;
}

export default function PersonaGrid({
    personas,
    selectedPersonas,
    onToggleSelect,
    onAddAllFiltered
}: PersonaGridProps) {

    const allFilteredSelected = personas.length > 0 &&
        personas.every(p => selectedPersonas.includes(p.id));

    const addAllFilteredToList = () => {
        onAddAllFiltered(personas.map(p => p.id))
    }

    return (
        <div>
            {/* Header with count and Add All button */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    {personas.length} Persona{personas.length !== 1 ? 's' : ''} Found
                </h3>

                {personas.length > 0 && (
                    <button
                        onClick={addAllFilteredToList}
                        disabled={allFilteredSelected}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${allFilteredSelected
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                            }`}
                    >
                        {allFilteredSelected ? (
                            <>
                                <Check className="w-4 h-4" />
                                All Selected
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Add All to List
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Grid */}
            {personas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {personas.map((persona, index) => (
                        <PersonaCard
                            key={persona.id}
                            persona={persona}
                            isSelected={selectedPersonas.includes(persona.id)}
                            onToggleSelect={onToggleSelect}
                            animationDelay={index * 0.05}
                        />
                    ))}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                >
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No personas found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                </motion.div>
            )}
        </div>
    );
}