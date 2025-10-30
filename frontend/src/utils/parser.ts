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
        /**
         * Optional locale(s) hint for tokenization. Examples: 'en', 'ja', 'zh', 'ko', 'th'.
         * If omitted, a best-effort locale will be inferred from the text.
         */
        locale?: string | string[];
    } = {}
): Word[] {
    const {
        // Do not assign a default here; we dynamically choose a sensible default for CJK.
        minWordLength: providedMinWordLength,
        maxWords = 100,
        stopWords = [
            'this', 'that', 'with', 'from', 'have', 'will', 'would', 'could', 'should',
            'about', 'which', 'their', 'there', 'where', 'when', 'what', 'them', 'then',
            'than', 'these', 'those', 'such', 'into', 'through', 'during', 'before',
            'after', 'above', 'below', 'between', 'under', 'again', 'further', 'other',
            'some', 'more', 'most', 'been', 'being', 'were', 'does', 'just', 'very',
            'also', 'here', 'only', 'over', 'know', 'because', 'same', 'make', 'made'
        ],
        locale
    } = options;

    // Combine all responses into one text
    const allText = Object.values(personaResponses).join(' ');

    // Detect scripts that typically don't use spaces (CJK, Thai, etc.)
    const hasHan = /\p{Script=Han}/u.test(allText);
    const hasHiragana = /\p{Script=Hiragana}/u.test(allText);
    const hasKatakana = /\p{Script=Katakana}/u.test(allText);
    const hasHangul = /\p{Script=Hangul}/u.test(allText);
    const hasThai = /\p{Script=Thai}/u.test(allText);

    // Decide locale for segmentation
    let localeHint: string | string[] | undefined = locale;
    if (!localeHint) {
        if (hasHiragana || hasKatakana) localeHint = 'ja';
        else if (hasHan && !hasHiragana && !hasKatakana) localeHint = 'zh';
        else if (hasHangul) localeHint = 'ko';
        else if (hasThai) localeHint = 'th';
        else localeHint = 'en';
    }

    // Choose a sensible default min length depending on script
    const minWordLength = providedMinWordLength ?? ((hasHan || hasHiragana || hasKatakana || hasHangul || hasThai) ? 1 : 4);

    // Tokenize using Intl.Segmenter when available (Unicode-aware), otherwise fallback to a Unicode regex.
    let words: string[] = [];
    const SegmenterCtor = (Intl as any)?.Segmenter as (new(locales?: string | string[], options?: any) => any) | undefined;
    if (SegmenterCtor) {
        try {
            const segmenter = new SegmenterCtor(localeHint, { granularity: 'word' });
            const segments = segmenter.segment(allText);
            for (const item of segments) {
                const seg = (item.segment as string).trim().toLowerCase();
                if (!seg) continue;
                const isWordLike = (item as any).isWordLike ?? /[\p{L}\p{N}]/u.test(seg);
                if (!isWordLike) continue;
                words.push(seg);
            }
        } catch {
            // Fallback if Segmenter throws for an unsupported locale
        }
    }
    if (words.length === 0) {
        // Regex fallback: extract sequences of letters/numbers (Unicode-aware)
        // This will group continuous CJK characters as tokens, which is acceptable for a word-cloud fallback.
        words = (allText.toLowerCase().match(/[\p{L}\p{N}_'’\-]+/gu) || []);
    }

    // Final cleaning and filtering
    words = words.filter(word =>
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