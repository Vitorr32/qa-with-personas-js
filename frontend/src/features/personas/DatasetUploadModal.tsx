import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import { useGetImportStatusQuery, useImportPersonasDatasetMutation } from '../../store/apiSlice';
import { errorToast, successToast } from '../../utils/Toasts';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onImported?: (summary: { processed: number; inserted: number; failed: number }) => void;
}

const MAX_DATASET_SIZE = 1024 * 1024 * 1024; // 1 GB

export default function DatasetUploadModal({ isOpen, onClose, onImported }: Props) {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [batchSize, setBatchSize] = useState<number | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [parser, setParser] = useState<string>('default');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importDataset] = useImportPersonasDatasetMutation();
    const [jobId, setJobId] = useState<string | null>(null);
    const { data: statusData, refetch: refetchStatus } = useGetImportStatusQuery(
        jobId ? { jobId } : (undefined as any),
        { skip: !jobId }
    );

    const fileError = useMemo(() => {
        if (!file) return '';
        if (file.size > MAX_DATASET_SIZE) {
            return t('personaadd.datasetTooLarge', {
                defaultValue: 'File is too large. Max {{size}} MB.',
                size: Math.round(MAX_DATASET_SIZE / (1024 * 1024)),
            }) as string;
        }
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext !== 'csv') {
            return t('personaadd.datasetOnlyCsv', {
                defaultValue: 'Only .csv files are allowed.',
            }) as string;
        }
        return '';
    }, [file, t]);

    const resetState = useCallback(() => {
        setIsSubmitting(false);
        setJobId(null);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const validateHeader = async (f: File) => {
        // Read the first 8KB to parse the header line
        const slice = f.slice(0, 8192);
        const text = await slice.text();
        const firstLine = text.split(/\r?\n/)[0] || '';
        const header = firstLine.split(',').map((h) => h.trim().replace(/^\ufeff/, ''));
        const required = parser === 'csv_persona_v1'
            ? ['uuid', 'persona']
            : ['name', 'greeting', 'description'];
        const missing = required.filter((k) => !header.includes(k));
        if (missing.length) {
            throw new Error(
                t('personaadd.datasetMissingColumns', {
                    defaultValue: 'Missing required columns: {{cols}}',
                    cols: missing.join(', '),
                }) as string
            );
        }
    };

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        setFile(f);
    };

    const doImport = async () => {
        if (!file) {
            errorToast(
                t('personaadd.datasetPickFile', { defaultValue: 'Please choose a dataset file first.' }) as string
            );
            return;
        }
        if (fileError) {
            errorToast(fileError);
            return;
        }
        try {
            setIsSubmitting(true);
            await validateHeader(file);
            const { jobId } = await importDataset({ file, parser, batchSize: typeof batchSize === 'number' ? batchSize : undefined }).unwrap();
            setJobId(jobId);
        } catch (err: any) {
            console.error('Dataset import failed', err);
            const msg = err?.data?.message || err?.message || (t('personaadd.datasetImportFailed', { defaultValue: 'Failed to import dataset.' }) as string);
            errorToast(msg);
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (!jobId) return;
        const interval = setInterval(() => {
            refetchStatus();
        }, 1000);
        return () => clearInterval(interval);
    }, [jobId, refetchStatus]);

    useEffect(() => {
        // Only react to status changes when a job is active
        if (!jobId || !statusData) return;
        if (statusData.status === 'completed') {
            successToast(
                t('personaadd.datasetImportSuccess', {
                    defaultValue: 'Import completed: {{inserted}} inserted, {{failed}} failed ({{processed}} processed).',
                    inserted: statusData.inserted,
                    failed: statusData.failed,
                    processed: statusData.processed,
                }) as string
            );
            onImported?.({ processed: statusData.processed, inserted: statusData.inserted, failed: statusData.failed });
            resetState();
            onClose();
        } else if (statusData.status === 'failed') {
            errorToast(statusData.error || (t('personaadd.datasetImportFailed', { defaultValue: 'Failed to import dataset.' }) as string));
            resetState();
        }
    }, [jobId, statusData, t, onImported, onClose, resetState]);

    // Reset transient state whenever the modal is opened fresh
    useEffect(() => {
        if (!isOpen) return;
        resetState();
    }, [isOpen, resetState]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={isSubmitting ? undefined : onClose} />
            <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-2xl border border-gray-200">
                <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('personaadd.bulkImportTitle', { defaultValue: 'Bulk import personas' })}</h3>
                    <p className="text-gray-600 mb-4">{t('personaadd.bulkImportSubtitle', { defaultValue: 'Upload a CSV file in the selected format. Max {{size}} MB.', size: Math.round(MAX_DATASET_SIZE / (1024 * 1024)) })}</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('personaadd.datasetFileLabel', { defaultValue: 'Dataset (.csv)' })}</label>
                            <div className="flex items-center gap-4">
                                <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors inline-flex items-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv,text/csv"
                                        onChange={onPickFile}
                                        className="hidden"
                                        disabled={isSubmitting}
                                    />
                                    {t('personaadd.chooseDataset', { defaultValue: 'Choose CSV' })}
                                </label>
                                <div className="text-sm text-gray-600 truncate max-w-[260px]">{file ? file.name : t('personaadd.noFileSelected', { defaultValue: 'No file selected' })}</div>
                            </div>
                            {fileError ? <div className="text-sm text-red-600 mt-2">{fileError}</div> : null}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('personaadd.parserLabel', { defaultValue: 'Parser' })}</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700"
                                    value={parser}
                                    onChange={(e) => setParser(e.target.value)}
                                    disabled={isSubmitting}
                                >
                                    <option value="default">default</option>
                                    <option value="csv_persona_v1">csv_persona_v1</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">{t('personaadd.parserHelp', { defaultValue: 'Choose default for simple CSV/JSON matching persona DTO, or csv_persona_v1 for the specialized CSV.' })}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('personaadd.batchSizeLabel', { defaultValue: 'Batch size (optional)' })}</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={1000}
                                    step={1}
                                    placeholder="250"
                                    value={batchSize}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === '') setBatchSize('');
                                        else setBatchSize(Math.max(1, Math.min(1000, Number(v))));
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    disabled={isSubmitting}
                                />
                                <p className="text-xs text-gray-500 mt-1">{t('personaadd.batchSizeHelp', { defaultValue: 'Controls how many rows are inserted per DB write (1–1000). Default 250.' })}</p>
                            </div>
                        </div>

                        {isSubmitting && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('personaadd.importProgress', { defaultValue: 'Import progress' })}</label>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    {statusData && typeof statusData.total === 'number' && statusData.total > 0 ? (
                                        <div
                                            className="bg-blue-600 h-3 transition-all"
                                            style={{ width: `${Math.min(100, Math.round((statusData.processed / statusData.total) * 100))}%` }}
                                        />
                                    ) : (
                                        <div className="bg-blue-600 h-3 animate-pulse w-1/3" />
                                    )}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    {statusData && typeof statusData.total === 'number' && statusData.total > 0
                                        ? t('personaadd.importCounters', {
                                            defaultValue: '{{processed}} / {{total}} processed • {{remaining}} remaining',
                                            processed: statusData.processed,
                                            total: statusData.total,
                                            remaining: Math.max(0, statusData.total - statusData.processed),
                                        })
                                        : t('personaadd.importCountersUnknown', {
                                            defaultValue: '{{processed}} processed',
                                            processed: statusData?.processed ?? 0,
                                        })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex items-center justify-end gap-3 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                        {t('common.cancel', { defaultValue: 'Cancel' })}
                    </button>
                    <button
                        onClick={doImport}
                        disabled={isSubmitting || !file || !!fileError}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? t('response.preparingPersonas', { defaultValue: 'Preparing personas and uploading files...' }) : t('personaadd.importButton', { defaultValue: 'Upload & Import' })}
                    </button>
                </div>
            </div>
        </div>
    );
}
