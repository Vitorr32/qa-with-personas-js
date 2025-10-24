import { Word } from "@isoterik/react-word-cloud";

export interface AnalysisData {
    keyPoints: string[];
    divergences: string[];
    consensus: string;
    wordFrequency: Word[];
    sentimentDistribution: { positive: number; neutral: number; negative: number };
    themes: { theme: string; occurrences: number }[];
}

export interface LLMResponseFormat {
    key_points: string[];
    divergences: string[];
    consensus: string;
    sentiment_distribution: { positive: number; negative: number; neutral: number };
    themes: { theme: string; frequency: number }[];
}
