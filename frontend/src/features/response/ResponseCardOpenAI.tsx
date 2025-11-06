import { useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Persona } from "../../utils/Persona";
import { AlertCircle, CheckCircle2, Clock, Loader2, MessageSquare } from "lucide-react";
import { motion } from 'framer-motion';

import type { RootState } from '../../store/store';
import { updateFullResponse, updateResponse } from "../../store/questionSlice";
import { ResponseStatus } from "../../types/utils";
import { getPersonaAvatar } from "../../utils/Avatar";
import { errorToast, extractMessageFromErrorAndToast } from "../../utils/Toasts";
import TagChipList from "../utils/TagChipList";

interface Chunk {
    text?: string;
    done?: boolean;
    error?: string;
}

interface ResponseCardProps {
    persona: Persona;
    broadcastState: (state: ResponseStatus) => void;
}

export default function ResponseCardOpenAI({ persona, broadcastState }: ResponseCardProps) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const contentRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const question = useSelector((state: RootState) => state.question.question);
    const response = useSelector((state: RootState) => state.question.responses[persona.id] || '');
    const fileIds = useSelector((state: RootState) => state.question.fileIds);

    const [status, setStatus] = useState<ResponseStatus>('idle');
    const [error, setError] = useState<string | undefined>(undefined);
    const [startedAt, setStartedAt] = useState<Date | undefined>(undefined);
    const [completedAt, setCompletedAt] = useState<Date | undefined>(undefined);

    // Start streaming when question changes
    useEffect(() => {
        if (!question || !persona.id) return;

        if (response && response.length > 0) {
            // Already have a response, mark as completed
            updateStatus('completed');
            return;
        }

        // Reset state
        setError(undefined);
        setCompletedAt(undefined);
        updateStatus('pending');

        // Start the stream
        startStream();

        // Cleanup on unmount or question change
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, [question, persona.id]);

    // Auto-scroll to bottom when response updates
    useEffect(() => {
        if ((status === 'streaming' || status === 'completed') && contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [response, status]);

    const startStream = async () => {
        try {
            updateStatus('streaming');
            setStartedAt(new Date());

            // Create abort controller for this stream
            abortControllerRef.current = new AbortController();

            // Get the base URL from environment
            const baseUrl = import.meta.env.VITE_API_BASE_URL;

            // Make the streaming request directly with fetch
            // We can't use RTK Query's built-in streaming, so we handle it manually
            const response = await fetch(`${baseUrl}/openai/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    personaId: persona.id,
                    question: question,
                    fileIds: fileIds,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                errorToast(`Stream request failed: ${response.statusText}`);
                throw new Error(`Stream request failed: ${response.statusText}`);
            }

            // Process the SSE stream
            await processStream(response);

        } catch (err: any) {
            if (err.name === 'AbortError') {
                // User cancelled, not an error
                return;
            }

            extractMessageFromErrorAndToast(err, 'Stream error occurred');
        }
    };

    const processStream = async (response: Response) => {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('Response body is not readable');
        }

        let accumulatedText = '';
        // Buffer to hold partial data between reads
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                // Append to buffer and split into lines
                buffer += chunk;

                // SSE messages are separated by newlines. We'll split by '\n' and process
                // any line that starts with 'data:'. Keep the remainder in buffer.
                const lines = buffer.split(/\r?\n/);

                // If the last line isn't a full line (no trailing newline), keep it in buffer
                if (!buffer.endsWith('\n') && !buffer.endsWith('\r\n')) {
                    buffer = lines.pop() || '';
                } else {
                    buffer = '';
                }

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    // Only process 'data: ' lines; ignore comments or other SSE fields
                    if (!trimmed.startsWith('data:')) continue;

                    const jsonText = trimmed.replace(/^data:\s?/, '');

                    try {
                        const trueChunk: Chunk = JSON.parse(jsonText);

                        if (trueChunk.error) {
                            errorToast(`Error from stream: ${trueChunk.error}`);
                            throw new Error(trueChunk.error);
                        }

                        if (trueChunk.text) {
                            // Accumulate text and update Redux store
                            accumulatedText += trueChunk.text;

                            dispatch(updateResponse({
                                personaId: persona.id,
                                chunk: trueChunk.text,
                            }));
                        }

                        if (trueChunk.done) {
                            // Stream completed successfully
                            setCompletedAt(new Date());
                            updateStatus('completed');

                            dispatch(updateFullResponse({
                                personaId: persona.id,
                                response: accumulatedText,
                            }));
                        }
                    } catch (parseError) {
                        console.warn('Failed to parse SSE message:', jsonText, parseError);
                        // ignore parse errors for this line and continue
                        continue;
                    }
                }
            }

            // If we exit the loop without receiving done, mark as completed anyway
            if (status === 'streaming') {
                setCompletedAt(new Date());
                updateStatus('completed');

                dispatch(updateFullResponse({
                    personaId: persona.id,
                    response: accumulatedText,
                }));
            }
        } finally {
            try {
                reader.releaseLock();
            } catch (e) {
                // ignore if reader is already released
            }
        }
    };

    const updateStatus = (newStatus: ResponseStatus) => {
        setStatus(newStatus);
        broadcastState(newStatus);
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-gray-400" />;
            case 'streaming':
                return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
            case 'completed':
                return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'pending':
                return t('responsecard.waiting');
            case 'streaming':
                return t('responsecard.responding');
            case 'completed':
                return t('responsecard.completed');
            case 'error':
                return t('responsecard.error');
            default:
                return t('responsecard.idle');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
        >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm">
                            {getPersonaAvatar(persona)}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{persona.name}</h3>
                            <p className="text-sm text-gray-600">{persona.greeting}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        {getStatusIcon()}
                        <span className={`font-medium ${status === 'error' ? 'text-red-600' :
                            status === 'completed' ? 'text-green-600' :
                                status === 'streaming' ? 'text-blue-600' :
                                    'text-gray-500'
                            }`}>
                            {getStatusText()}
                        </span>
                    </div>
                </div>

                <TagChipList tags={persona.tags} theme="dark" />
            </div>

            <div className="p-6">
                {status === 'pending' && (
                    <div className="flex items-center justify-center py-8 text-gray-400">
                        <div className="text-center">
                            <Clock className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">{t('responsecard.waitingInQueue')}</p>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <p className="font-medium">{t('responsecard.failedToGetResponse')}</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {(status === 'streaming' || status === 'completed') && (
                    <div ref={contentRef} className="prose prose-sm max-w-none">
                        <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {response}
                                    {status === 'streaming' && (
                                        <motion.span
                                            animate={{ opacity: [1, 0] }}
                                            transition={{ duration: 0.8, repeat: Infinity }}
                                            className="inline-block w-2 h-4 bg-blue-500 ml-1"
                                        />
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {completedAt && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                    {t('responsecard.completedIn', {
                        seconds: Math.round((completedAt.getTime() - (startedAt?.getTime() || 0)) / 1000)
                    })}
                </div>
            )}
        </motion.div>
    );
}