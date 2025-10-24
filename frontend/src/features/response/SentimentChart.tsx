import { motion } from "framer-motion";

interface SentimentChartProps {
    sentimentDistribution: { positive: number; neutral: number; negative: number }
}

export default function SentimentChart({ sentimentDistribution }: SentimentChartProps) {
    const total = sentimentDistribution.positive + sentimentDistribution.neutral + sentimentDistribution.negative;

    return (
        <div className="space-y-4">
            {[
                { label: 'Positive', value: sentimentDistribution.positive, color: 'bg-green-500', lightColor: 'bg-green-100' },
                { label: 'Neutral', value: sentimentDistribution.neutral, color: 'bg-gray-500', lightColor: 'bg-gray-100' },
                { label: 'Negative', value: sentimentDistribution.negative, color: 'bg-red-500', lightColor: 'bg-red-100' }
            ].map(({ label, value, color, lightColor }) => {
                const percentage = (value / total) * 100;

                return (
                    <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">{label}</span>
                            <span className="text-gray-600">{value}%</span>
                        </div>
                        <div className={`w-full h-3 ${lightColor} rounded-full overflow-hidden`}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full ${color}`}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
