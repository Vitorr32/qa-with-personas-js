import { motion } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';

interface QuestionInputProps {
    questionInput: string;
    setQuestionInput: (value: string) => void;
    attachedFiles: File[];
    setAttachedFiles: (files: File[]) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSubmitQuestion: () => void;
}

export default function QuestionInput({
    questionInput,
    setQuestionInput,
    attachedFiles,
    setAttachedFiles,
    handleFileChange,
    handleSubmitQuestion
}: QuestionInputProps) {
    return (
        <motion.div layout className="relative">
            <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow">
                <div className="flex items-center px-6 py-4">
                    <MessageSquare className="w-6 h-6 text-gray-400 mr-4" />
                    <input
                        type="text"
                        value={questionInput}
                        onChange={(e) => setQuestionInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && questionInput.trim() && handleSubmitQuestion()}
                        placeholder="What would you like to ask?"
                        className="flex-1 text-lg outline-none text-gray-800 placeholder-gray-400"
                    />
                    <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <input
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <span className="text-2xl">📎</span>
                    </label>
                </div>

                {attachedFiles.length > 0 && (
                    <div className="px-6 pb-4 flex flex-wrap gap-2">
                        {attachedFiles.map((file: File, i) => (
                            <div key={i} className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full text-sm">
                                <span className="text-blue-700">{file.name}</span>
                                <button
                                    onClick={() => setAttachedFiles(attachedFiles.filter((_: any, idx: number) => idx !== i))}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}