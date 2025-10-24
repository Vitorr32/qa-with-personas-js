import { Word } from "@isoterik/react-word-cloud";
import { AnalysisData, LLMResponseFormat } from "./interfaces";

interface PersonaResponses {
    [uuid: string]: string;
}
/**
 * Parses the LLM JSON response and extracts structured data
 * @param llmResponse - The raw text response from the LLM (should contain JSON)
 * @returns Parsed AnalysisData object (without wordFrequency)
 * @throws Error if JSON parsing fails
 */
export function parseLLMResponse(llmResponse: string): Omit<AnalysisData, 'wordFrequency'> {
    // Extract JSON from response (in case there's surrounding text)
    let jsonStr = llmResponse.trim();

    // Try to find JSON object if wrapped in markdown code blocks
    const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1];
    }

    // Remove any leading/trailing non-JSON text
    const jsonStart = jsonStr.indexOf('{');
    const jsonEnd = jsonStr.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    }

    try {
        const parsed: LLMResponseFormat = JSON.parse(jsonStr);

        // Map LLM format to AnalysisData format
        return {
            keyPoints: parsed.key_points || [],
            divergences: parsed.divergences || [],
            consensus: parsed.consensus || '',
            sentimentDistribution: {
                positive: parsed.sentiment_distribution?.positive || 0,
                neutral: parsed.sentiment_distribution?.neutral || 0,
                negative: parsed.sentiment_distribution?.negative || 0
            },
            themes: (parsed.themes || []).map(t => ({
                theme: t.theme,
                occurrences: t.frequency
            }))
        };
    } catch (error) {
        console.error('Failed to parse LLM response:', error);
        console.error('Response text:', llmResponse);
        throw new Error('Invalid JSON response from LLM');
    }
}

/**
 * Generates word frequency data from persona responses for word cloud visualization
 * @param personaResponses - Object containing persona UUIDs and their response texts
 * @param options - Configuration options for word frequency generation
 * @returns Array of words with their frequencies (size)
 */
export function generateWordFrequency(
    personaResponses: PersonaResponses,
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

    // Handle edge case of no words
    if (sortedWords.length === 0) {
        return [];
    }

    const frequencies = sortedWords.map(([, count]) => count);
    const minFreq = Math.min(...frequencies);
    const maxFreq = Math.max(...frequencies);

    const minSize = 10;
    const maxSize = 100;

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
 * @param llmResponse - The raw text response from the LLM (should contain JSON)
 * @param personaResponses - Object containing persona UUIDs and their response texts
 * @param wordFreqOptions - Optional configuration for word frequency generation
 * @returns Complete AnalysisData object
 */
export function generateCompleteAnalysis(
    llmResponse: string,
    personaResponses: PersonaResponses,
    wordFreqOptions?: Parameters<typeof generateWordFrequency>[1]
): AnalysisData {
    const parsedData = parseLLMResponse(llmResponse);
    const wordFrequency = generateWordFrequency(personaResponses, wordFreqOptions);

    return {
        ...parsedData,
        wordFrequency
    };
}