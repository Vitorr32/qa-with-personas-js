import { motion } from 'framer-motion';
import { Check, Plus, Shuffle, ChevronDown } from 'lucide-react';
import { Persona } from '../../utils/Persona';
import PersonaCard from './PersonaCard';
import { useEffect, useMemo, useState } from 'react';
import { Tag } from '../../utils/Tag';
import { useGetPersonasQuery } from '../../store/apiSlice';
import LoadingContainer from '../utils/LoadingContainer';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const [pageSize] = useState(20);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
    const [items, setItems] = useState<Persona[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [isRandomMenuOpen, setIsRandomMenuOpen] = useState(false);
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

    const { data: personasPage, isLoading: loadingPersonas, isFetching } = useGetPersonasQuery(queryArgs);

    useEffect(() => {
        if (!personasPage) return;

        // personasPage might be the legacy array or the new paged shape
        const newItems: Persona[] = Array.isArray(personasPage) ? personasPage : personasPage?.items || [];
        const newHasMore = Array.isArray(personasPage) ? false : personasPage.hasMore;
        const newNextCursor = Array.isArray(personasPage) ? undefined : personasPage.nextCursor;
        const newTotalCount = Array.isArray(personasPage)
            ? newItems.length
            : (personasPage.totalCount ?? newItems.length);

        // if cursor is undefined, it's the first page -> replace
        if (!cursor) {
            setItems(newItems);
        } else {
            setItems((prev) => [...prev, ...newItems]);
        }
        setHasMore(newHasMore);
        setNextCursor(newNextCursor);
        setTotalCount(newTotalCount);
    }, [personasPage]);

    // reset pagination when filters change
    useEffect(() => {
        setCursor(undefined);
        setNextCursor(undefined);
        setItems([]);
        setRefreshKey((k) => k + 1);
    }, [searchQuery, selectedTags]);

    // Fetch all personas matching current filters (across all pages)
    const fetchAllFiltered = async (): Promise<Persona[]> => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL as string;
        const params = new URLSearchParams();
        // Use the backend's max page size to minimize round trips
        params.set('pageSize', '500');
        if (searchQuery && searchQuery.trim().length > 0) params.set('inputQuery', searchQuery);
        if (selectedTags && selectedTags.length > 0) {
            params.set('tags', JSON.stringify(selectedTags.map(t => t.id)));
        }

        const all: Persona[] = [];
        let localCursor: string | undefined = undefined;

        // Loop through all pages using the opaque nextCursor provided by backend
        while (true) {
            if (localCursor) params.set('cursor', localCursor);
            else params.delete('cursor');

            // Attach auth header like apiSlice
            const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
            const headers = new Headers();
            headers.set('Accept', 'application/json');
            if (token) headers.set('Authorization', `Bearer ${token}`);

            const res = await fetch(`${baseUrl}/personas?${params.toString()}`, { method: 'GET', headers });
            if (!res.ok) break;
            const data = await res.json();

            const pageItems: Persona[] = Array.isArray(data) ? data : (data?.items ?? []);
            all.push(...pageItems);

            const next: string | undefined = Array.isArray(data) ? undefined : data?.nextCursor;
            if (!next) break;
            localCursor = next;
        }
        return all;
    };

    const handleAddAll = async () => {
        try {
            setIsBulkLoading(true);
            const all = await fetchAllFiltered();
            if (all.length > 0) onAddAllFiltered(all);
        } finally {
            setIsBulkLoading(false);
        }
    };

    const sampleRandom = (arr: Persona[], n: number): Persona[] => {
        const need = Math.min(n, arr.length);
        if (need <= 0) return [];
        // Fisher-Yates shuffle (partial)
        const copy = arr.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy.slice(0, need);
    };

    const handleAddRandom = async (count: number) => {
        try {
            setIsBulkLoading(true);
            const all = await fetchAllFiltered();
            const sampled = sampleRandom(all, count);
            if (sampled.length > 0) onAddAllFiltered(sampled);
        } finally {
            setIsBulkLoading(false);
            setIsRandomMenuOpen(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    {t('personagrid.foundCount', { count: totalCount })}
                </h3>

                {items.length > 0 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleAddAll}
                            disabled={allFilteredSelected || isBulkLoading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${allFilteredSelected || isBulkLoading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                                }`}
                        >
                            {allFilteredSelected ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    {t('personagrid.allSelected')}
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    {isBulkLoading ? t('common.loading') : t('personagrid.addAll')}
                                </>
                            )}
                        </button>

                        {/* Random subset dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsRandomMenuOpen((v) => !v)}
                                disabled={allFilteredSelected || isBulkLoading}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all border ${allFilteredSelected || isBulkLoading
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                                    }`}
                            >
                                <Shuffle className="w-4 h-4" />
                                {t('personagrid.addRandom')}
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {isRandomMenuOpen && !allFilteredSelected && !isBulkLoading && (
                                <div
                                    className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20"
                                    onMouseLeave={() => setIsRandomMenuOpen(false)}
                                >
                                    {[20, 50, 100, 200].map((n) => (
                                        <button
                                            key={n}
                                            onClick={() => handleAddRandom(n)}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                                        >
                                            {t('personagrid.addRandomCount', { count: n })}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <LoadingContainer isLoading={loadingPersonas || isFetching || isBulkLoading}>
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
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('personagrid.noFound')}</h3>
                        <p className="text-gray-500">{t('personagrid.tryAdjustSearch')}</p>
                    </motion.div>
                )}
                {hasMore && (
                    <div className="flex justify-center my-6">
                        <button
                            onClick={() => nextCursor && setCursor(nextCursor)}
                            disabled={!nextCursor}
                            className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300"
                        >
                            {t('personagrid.loadMore')}
                        </button>
                    </div>
                )}
            </LoadingContainer>
        </div>
    );
}