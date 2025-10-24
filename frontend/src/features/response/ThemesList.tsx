import { motion } from "framer-motion";

interface ThemesListProps {
    themes: { theme: string; occurrences: number }[];
}

export default function ThemesList({ themes }: ThemesListProps) {
    const maxMentions = Math.max(...themes.map(t => t.occurrences));

    return (
        <div className="space-y-3">
            {themes.map((item, index) => (
                <motion.div
                    key={item.theme}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                    <span className="font-medium text-gray-700">{item.theme}</span>
                    <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.occurrences / maxMentions) * 100}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                className="bg-indigo-600 h-2 rounded-full"
                            />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">{item.occurrences}</span>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
