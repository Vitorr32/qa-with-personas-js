import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { Persona } from '../../utils/Persona';
import PersonaCardEdit from '../personas/PersonaCardEdit';
import EditPersonaModal from '../personas/PersonaEditModal';
import { useGetPersonasQuery, useUpdatePersonaMutation } from '../../store/apiSlice';
import { Tag } from '../../utils/Tag';
import { errorToast, successToast } from '../../utils/Toasts';
import SearchBox from '../utils/SearchBox';
import LoadingContainer from '../utils/LoadingContainer';
import { useTranslation } from 'react-i18next';

export default function PersonaEdit() {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
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

    const { data: personasPage, isLoading: loadingPersonas, isFetching } = useGetPersonasQuery(queryArgs);
    const [updatePersona] = useUpdatePersonaMutation();
    const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

    async function handleSave(updated: Persona) {
        try {
            await updatePersona(updated).unwrap();
            successToast(t('personaedit.updatedSuccess', { name: updated.name }));
            setEditingPersona(null);
        } catch (err: any) {
            errorToast(t('personaedit.updateFailed', { message: err?.data?.message || err.message }));
        }
    }

    // Update items when a new page arrives
    useEffect(() => {
        if (!personasPage) return;

        // personasPage might be the legacy array or the new paged shape
        const newItems: Persona[] = Array.isArray(personasPage) ? (personasPage as unknown as Persona[]) : (personasPage as any).items || [];
        const newHasMore = Array.isArray(personasPage) ? false : Boolean((personasPage as any).hasMore);

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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('personaedit.title')}</h2>
                <p className="text-gray-600">{t('personaedit.subtitle')}</p>
            </div>

            <SearchBox setSearchQuery={setSearchQuery} setSelectedTags={setSelectedTags} searchQuery={searchQuery} selectedTags={selectedTags} injectWrapperClassNames="bg-white rounded-xl p-6 border border-gray-200 shadow-lg" />

            <LoadingContainer isLoading={loadingPersonas || isFetching}>
                <>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {t('remove.foundCount', { count: items.length })}
                        </h3>

                    </div>

                    {/* Personas Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((persona: Persona) => (
                            <PersonaCardEdit
                                key={persona.id}
                                persona={persona}
                                onClick={() => setEditingPersona(persona)}
                            />
                        ))}
                    </div>

                    {items.length === 0 && !(loadingPersonas || isFetching) && (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <div className="text-4xl mb-2">🔍</div>
                            <p className="text-gray-600">{t('personagrid.noFound')}</p>
                        </div>
                    )}

                    {/* Load more */}
                    {hasMore && (
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={() => {
                                    // set cursor to last item of current items to fetch next page
                                    const last = items[items.length - 1];
                                    if (!last) return;
                                    const createdAtVal: any = (last as any).createdAt;
                                    const createdAtStr = createdAtVal instanceof Date ? createdAtVal.toISOString() : String(createdAtVal);
                                    setCursor(`${createdAtStr}|${last.id}`);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md"
                            >
                                {t('personagrid.loadMore')}
                            </button>
                        </div>
                    )}
                </>
            </LoadingContainer>

            {editingPersona && (
                <EditPersonaModal
                    persona={editingPersona}
                    onClose={() => setEditingPersona(null)}
                    onSave={handleSave}
                />
            )}
        </motion.div>
    );
}
