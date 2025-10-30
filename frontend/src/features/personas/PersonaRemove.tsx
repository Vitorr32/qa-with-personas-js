import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from "react";
import { Persona } from "../../utils/Persona";
import { AlertTriangle } from "lucide-react";
import PersonaCardRemove from "./PersonaCardRemove";
import { Tag } from "../../utils/Tag";
import SearchBox from "../utils/SearchBox";
import { useDeletePersonaMutation, useGetPersonasQuery } from "../../store/apiSlice";
import { errorToast, successToast } from "../../utils/Toasts";
import LoadingContainer from "../utils/LoadingContainer";

export default function RemovePersonasSection() {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [toDeleteList, setToDeleteList] = useState<Persona[]>([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

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

    const { data: personasPage, isLoading: isLoadingPersonas, isFetching, refetch } = useGetPersonasQuery(queryArgs);
    const [deletePersona] = useDeletePersonaMutation();

    async function handleDelete(personas: Persona[]) {
        if (!personas || personas.length === 0) return;

        try {
            // Call the mutation with Persona[]; apiSlice will extract ids
            const res = await deletePersona(personas).unwrap();

            // Remove deleted personas from local items for immediate UI feedback
            const deletedIds = (personas || []).map((p) => p.id);
            setItems((prev) => prev.filter((p) => !deletedIds.includes(p.id)));
            // Clear selection entirely since deleted personas are gone
            setToDeleteList([]);

            // Bump local refreshKey and refetch the query so components update
            setRefreshKey((k) => k + 1);
            refetch();

            successToast(`${deletedIds.length} persona${deletedIds.length !== 1 ? 's' : ''} removed`);
            return res;
        } catch (err: any) {
            console.error('Failed to delete personas', err);
            const message = err?.data?.message || err?.message || 'Failed to delete personas';
            errorToast(message);
            throw err;
        }
    }

    function handleToggleSelect(persona: Persona) {
        const personaIndex = toDeleteList.findIndex((p) => p.id === persona.id);
        if (personaIndex >= 0) {
            const updatedSelection = [...toDeleteList];
            updatedSelection.splice(personaIndex, 1);
            setToDeleteList(updatedSelection);
        } else {
            setToDeleteList((prev) => [...prev, persona]);
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
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('remove.title')}</h2>
                <p className="text-gray-600">{t('remove.subtitle')}</p>
            </div>

            <SearchBox setSearchQuery={setSearchQuery} setSelectedTags={setSelectedTags} searchQuery={searchQuery} selectedTags={selectedTags} injectWrapperClassNames="bg-white rounded-xl p-6 border border-gray-200 shadow-lg" />

            <LoadingContainer isLoading={isLoadingPersonas || isFetching}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {t('remove.foundCount', { count: items.length })}
                    </h3>

                    <button
                        onClick={() => setShowConfirmModal(true)}
                        disabled={toDeleteList.length === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium cursor-pointer transition-all ${toDeleteList.length === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200'
                            }`}
                    >
                        {toDeleteList.length === 0 ? (
                            <>
                                <AlertTriangle className="w-4 h-4" />
                                {t('remove.noSelected')}
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="w-4 h-4" />
                                {t('remove.removeCount', { count: toDeleteList.length })}
                            </>
                        )}
                    </button>

                </div>
                {items.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((persona: Persona) => (
                            <PersonaCardRemove
                                key={persona.id}
                                persona={persona}
                                isSelected={toDeleteList.find(p => p.id === persona.id) !== undefined}
                                onToggle={() => handleToggleSelect(persona)}
                            />
                        ))}
                    </div>
                )}

                {items.length === 0 && !(isLoadingPersonas || isFetching) && (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <div className="text-4xl mb-2">🔍</div>
                        <p className="text-gray-600">{t('remove.noFound')}</p>
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
                            Load more
                        </button>
                    </div>
                )}
            </LoadingContainer>

            {/* Confirm Modal */}
            {showConfirmModal && (
                <ConfirmRemoveModal
                    count={toDeleteList.length}
                    personaNames={toDeleteList.map((p: Persona) => p.name)}
                    onConfirm={() => {
                        void handleDelete(toDeleteList);
                        setShowConfirmModal(false);
                    }}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
        </motion.div>
    );
}

function ConfirmRemoveModal({ count, personaNames, onConfirm, onCancel }: any) {
    const { t } = useTranslation();
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
                        {t('remove.confirmTitle')}
                    </h3>
                    <p className="text-gray-600 text-center mb-4">
                        {t('remove.confirmText', { count })}
                    </p>

                    {/* List of personas to be removed */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
                        <p className="text-sm font-semibold text-gray-700 mb-2">{t('remove.toBeRemovedLabel')}</p>
                        <ul className="space-y-1">
                            {personaNames.slice(0, 10).map((name: string, i: number) => (
                                <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                    {name}
                                </li>
                            ))}
                            {personaNames.length > 10 && (
                                <li className="text-sm text-gray-500 italic">
                                    {t('remove.andMore', { count: personaNames.length - 10 })}
                                </li>
                            )}
                        </ul>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium"
                        >
                            {t('remove.confirmButton')}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}