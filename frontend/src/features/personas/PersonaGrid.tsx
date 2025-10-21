import { motion } from 'framer-motion';
import { Check, Plus } from 'lucide-react';
import { Persona } from '../../utils/Persona';
import PersonaCard from './PersonaCard';
import { use, useEffect, useMemo, useState } from 'react';
import { Tag } from '../../utils/Tag';
import { useGetPersonasQuery } from '../../store/apiSlice';

interface PersonaGridProps {
    searchQuery: string;
    selectedTags?: Tag[];
    selectedPersonas: Persona[];
    onToggleSelect: (personaId: Persona) => void;
    onAddAllFiltered: (personaIds: Persona[]) => void;
}

export default function PersonaGrid({
    searchQuery,
    selectedTags = [],
    selectedPersonas = [],
    onToggleSelect,
    onAddAllFiltered
}: PersonaGridProps) {

    const [pageSize] = useState(20);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [items, setItems] = useState<Persona[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const queryArgs = useMemo(() => ({
        pageSize,
        cursor,
        inputQuery: searchQuery,
        tags: selectedTags,
        refreshKey,
    }), [pageSize, cursor, searchQuery, selectedTags, refreshKey]);

    const allFilteredSelected = useMemo(() => {
        return items.length > 0 &&
            items.every(p => selectedPersonas.find(q => p.id === q.id));
    }, [items, selectedPersonas]);

    const { data: personasPage, isLoading: loadingPersonas } = useGetPersonasQuery(queryArgs);

    useEffect(() => {
        if (!personasPage) return;

        console.log('Fetched personasPage:', personasPage);

        // personasPage might be the legacy array or the new paged shape
        const newItems: Persona[] = Array.isArray(personasPage) ? personasPage : personasPage?.items || [];
        const newHasMore = Array.isArray(personasPage) ? false : personasPage.hasMore;

        // if cursor is undefined, it's the first page -> replace
        if (!cursor) {
            setItems(newItems);
        } else {
            setItems((prev) => [...prev, ...newItems]);
        }
        setHasMore(newHasMore);
    }, [personasPage]);

    // reset pagination when filters change
    useEffect(() => {
        setCursor(undefined);
        setItems([]);
        setRefreshKey((k) => k + 1);
    }, [searchQuery, selectedTags]);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    {items.length} Persona{items.length !== 1 ? 's' : ''} Found
                </h3>

                {items.length > 0 && (
                    <button
                        onClick={() => onAddAllFiltered(items)}
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
            {items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((persona, index) => (
                        <PersonaCard
                            key={persona.id}
                            persona={persona}
                            isSelected={Boolean(selectedPersonas.find(p => p.id == persona.id))}
                            onToggleSelect={() => onToggleSelect(persona)}
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