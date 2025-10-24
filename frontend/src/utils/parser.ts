import { AnalysisData } from "./interfaces";
import { Word } from "@isoterik/react-word-cloud";

/**
 * Parses the LLM response text and extracts structured data
 * @param llmResponse - The raw text response from the LLM
 * @returns Parsed AnalysisData object (without wordFrequency)
 */
export function parseLLMResponse(llmResponse: string): Omit<AnalysisData, 'wordFrequency'> {
    const result: Omit<AnalysisData, 'wordFrequency'> = {
        keyPoints: [],
        divergences: [],
        consensus: '',
        sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
        themes: []
    };

    // Extract key_points
    const keyPointsMatch = llmResponse.match(/key_points:\s*(\[[\s\S]*?\])/);
    if (keyPointsMatch) {
        try {
            result.keyPoints = JSON.parse(keyPointsMatch[1]);
        } catch (e) {
            console.error('Failed to parse key_points:', e);
        }
    }

    // Extract divergences
    const divergencesMatch = llmResponse.match(/divergences:\s*(\[[\s\S]*?\])/);
    if (divergencesMatch) {
        try {
            result.divergences = JSON.parse(divergencesMatch[1]);
        } catch (e) {
            console.error('Failed to parse divergences:', e);
        }
    }

    // Extract consensus
    const consensusMatch = llmResponse.match(/consensus:\s*(.+?)(?=```|$)/s);
    if (consensusMatch) {
        result.consensus = consensusMatch[1].trim();
    }

    // Extract sentiment_distribution
    const sentimentMatch = llmResponse.match(/sentiment_distribution:\s*(\{[\s\S]*?\})/);
    if (sentimentMatch) {
        try {
            result.sentimentDistribution = JSON.parse(sentimentMatch[1]);
        } catch (e) {
            console.error('Failed to parse sentiment_distribution:', e);
        }
    }

    // Extract themes
    const themesMatch = llmResponse.match(/themes:\s*(\[[\s\S]*?\])/);
    if (themesMatch) {
        try {
            const themesData = JSON.parse(themesMatch[1]);
            result.themes = themesData.map((t: any) => ({
                theme: t.theme,
                occurrences: t.frequency
            }));
        } catch (e) {
            console.error('Failed to parse themes:', e);
        }
    }

    return result;
}

/**
 * Generates word frequency data from persona responses for word cloud visualization
 * @param personaResponses - Object containing persona UUIDs and their response texts
 * @param options - Configuration options for word frequency generation
 * @returns Array of words with their frequencies (size)
 */
export function generateWordFrequency(
    personaResponses: { [personaId: string]: string },
    options: {
        minWordLength?: number;
        maxWords?: number;
        stopWords?: string[];
    } = {}
): Word[] {
    const {
        minWordLength = 4,
        maxWords = 100,
        stopWords = [
            'this', 'that', 'with', 'from', 'have', 'will', 'would', 'could', 'should',
            'about', 'which', 'their', 'there', 'where', 'when', 'what', 'them', 'then',
            'than', 'these', 'those', 'such', 'into', 'through', 'during', 'before',
            'after', 'above', 'below', 'between', 'under', 'again', 'further', 'other',
            'some', 'more', 'most', 'been', 'being', 'were', 'does', 'just', 'very',
            'also', 'here', 'only', 'over', 'know', 'because', 'same', 'make', 'made'
        ]
    } = options;

    // Combine all responses into one text
    const allText = Object.values(personaResponses).join(' ');

    // Tokenize and clean
    const words = allText
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Remove punctuation
        .split(/\s+/)
        .filter(word =>
            word.length >= minWordLength &&
            !stopWords.includes(word) &&
            isNaN(Number(word)) // Exclude numbers
        );

    // Count word frequencies
    const wordCount = new Map<string, number>();
    words.forEach(word => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Convert to array and sort by frequency
    const sortedWords = Array.from(wordCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxWords);

    // Find min and max frequencies for scaling
    const frequencies = sortedWords.map(([, count]) => count);
    const minFreq = Math.min(...frequencies);
    const maxFreq = Math.max(...frequencies);

    // Scale frequencies to sizes (10-100 range for d3-cloud)
    const minSize = 10;
    const maxSize = 1000;

    return sortedWords.map(([word, count]) => {
        // Linear scaling
        const size = maxFreq === minFreq
            ? (minSize + maxSize) / 2
            : minSize + ((count - minFreq) / (maxFreq - minFreq)) * (maxSize - minSize);

        return {
            text: word,
            value: Math.round(size)
        };
    });
}

/**
 * Combines parsed LLM response with word frequency data
 * @param llmResponse - The raw text response from the LLM
 * @param personaResponses - Object containing persona UUIDs and their response texts
 * @param wordFreqOptions - Optional configuration for word frequency generation
 * @returns Complete AnalysisData object
 */
export function generateCompleteAnalysis(
    llmResponse: string,
    personaResponses: { [personaId: string]: string },
    wordFreqOptions?: Parameters<typeof generateWordFrequency>[1]
): AnalysisData {
    const parsedData = parseLLMResponse(llmResponse);
    const wordFrequency = generateWordFrequency(personaResponses, wordFreqOptions);

    return {
        ...parsedData,
        wordFrequency
    };
}