import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Persona } from "../../utils/Persona";
import { AlertCircle, CheckCircle2, Clock, Loader2, MessageSquare } from "lucide-react";
import { motion } from 'framer-motion';
import { useStartOpenAIStreamMutation } from '../../store/apiSlice';

import type { RootState } from '../../store/store';
import { updateFullResponse, updateResponse } from "../../store/questionSlice";
import { ResponseStatus } from "../../types/utils";
import { getPersonaAvatar } from "../../utils/Avatar";

interface ResponseCardProps {
    persona: Persona;
    broadcastState: (state: ResponseStatus) => void;
}

export default function ResponseCard({ persona, broadcastState }: ResponseCardProps) {
    const dispatch = useDispatch();
    const contentRef = useRef<HTMLDivElement>(null);
    const question = useSelector((state: RootState) => state.question.question);
    const response = useSelector((state: RootState) => state.question.responses[persona.id] || '');
    const fileIds = useSelector((state: RootState) => state.question.fileIds);
    const [status, setStatus] = useState<ResponseStatus>('idle');
    const [error, setError] = useState<string | undefined>(undefined);
    const [startedAt, setStartedAt] = useState<Date | undefined>(undefined);
    const [completedAt, setCompletedAt] = useState<Date | undefined>(undefined);

    useEffect(() => {
        if ((status === 'streaming' || status === 'completed') && contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [response, status]);

    useEffect(() => {
        // Start streaming when a question exists.
        if (!question || question.trim().length === 0) return;

        let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
        let controller: AbortController | null = null;
        const [startOpenAIStreamTrigger] = useStartOpenAIStreamMutation();

        const start = async () => {
            updateStatus('pending');
            dispatch(updateFullResponse({ personaId: persona.id, response: '' }));
            setError(undefined);
            setStartedAt(new Date());
            try {
                const res: any = await startOpenAIStreamTrigger({ personaId: persona.id, question, fileIds });
                if (res.error) throw res.error;
                reader = res.data?.reader;
                controller = res.data?.controller;
                updateStatus('streaming');

                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    if (!reader) break;
                    const { value, done } = await reader.read();
                    if (done) break;
                    if (!value) continue;
                    buffer += decoder.decode(value, { stream: true });
                    // handle newline-delimited data events
                    const parts = buffer.split('\n');
                    // keep last partial
                    buffer = parts.pop() || '';
                    for (const line of parts) {
                        const trimmed = line.trim();
                        if (!trimmed) continue;
                        if (!trimmed.startsWith('data:')) continue;
                        const payload = trimmed.replace(/^data:\s*/, '');
                        try {
                            const parsed = JSON.parse(payload);
                            if (parsed.done) {
                                updateStatus('completed');
                                setCompletedAt(new Date());
                                controller?.abort();
                                return;
                            }
                            if (parsed.error) {
                                updateStatus('error');
                                setError(parsed.error);
                                controller?.abort();
                                return;
                            }
                            if (parsed.text) {
                                dispatch(updateResponse({ personaId: persona.id, response: parsed.text }));
                            }
                        } catch (e) {
                            dispatch(updateResponse({ personaId: persona.id, response: payload + '\n' }));
                        }
                    }
                }

                updateStatus('completed');
                setCompletedAt(new Date());
            } catch (err: any) {
                if (err && err.name === 'AbortError') {
                    // ignore
                    return;
                }
                updateStatus('error');
                setError(err?.message || 'Stream failed');
            }
        };

        start();

        return () => {
            // abort the fetch via controller if available
            try {
                // controller abort was captured in outer scope by startOpenAIStream return
            } catch { }
        };
    }, [question, persona.id]);

    const updateStatus = (newStatus: ResponseStatus) => {
        setStatus(newStatus);
        broadcastState(newStatus);
    }

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
                return 'Waiting...';
            case 'streaming':
                return 'Responding...';
            case 'completed':
                return 'Completed';
            case 'error':
                return 'Error';
            default:
                return 'Idle';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
        >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
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

                <div className="flex flex-wrap gap-2 mt-3">
                    {persona.tags.map(tag => (
                        <span
                            key={tag.id}
                            className="px-2 py-1 bg-white text-xs font-medium text-gray-700 rounded-full border border-gray-200"
                        >
                            {tag.name}
                        </span>
                    ))}
                </div>
            </div>

            <div className="p-6">
                {status === 'pending' && (
                    <div className="flex items-center justify-center py-8 text-gray-400">
                        <div className="text-center">
                            <Clock className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Waiting in queue...</p>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <p className="font-medium">Failed to get response</p>
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
                    Completed in {Math.round((completedAt.getTime() - (startedAt?.getTime() || 0)) / 1000)}s
                </div>
            )}
        </motion.div>
    );
}