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
            // English/common
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

    // Language-specific stop words (Japanese)
    const jaStopWords = new Set<string>([
        // Particles
        'の','は','が','に','を','へ','で','と','も','や','か','な','ね','ぞ','ぜ','さ','よ','わ','より','まで','から','って','とか','など','ので','ため','なら',
        // Polite/formal auxiliaries and copula
        'です','ます','でした','でしょう','だ','だった','では','じゃ','じゃない','ください','下さい','ございます','おります','いいます','いえる',
        // Common verbs/auxiliaries (base forms that add little meaning in summaries)
        'する','なる','ある','いる','できる','られる','れる','させる','しまう','しまっ','して','している','ている','い','いた','いく','くる','きた',
        // Generic nouns and function words
        'こと','もの','ところ','場合','方','方々','私','うち','それ','これ','あれ','よう','ため','でも','しかし','ただ','そして','また','でも',
        // Fillers/common interjections
        'まあ','ええと','あら','ねえ','うん','はあ','あの',
    ]);

    const isJapanese = (localeHint === 'ja') || hasHiragana || hasKatakana;

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

    // Build combined stop words
    const stopSet = new Set<string>([...stopWords]);
    if (isJapanese) {
        for (const w of jaStopWords) stopSet.add(w);
    }

    // Helpers for Japanese filtering
    const kanaOnly = /^(?:\p{Script=Hiragana}|\p{Script=Katakana}|ー)+$/u;
    const singleKanji = /^\p{Script=Han}$/u;
    const containsKanji = /\p{Script=Han}/u;
    const containsKatakana = /\p{Script=Katakana}/u;

    // Final cleaning and filtering
    words = words.filter(word => {
        if (word.length < minWordLength) return false;
        if (stopSet.has(word)) return false;
        if (!isNaN(Number(word))) return false; // Exclude numbers

        if (isJapanese) {
            // Drop single-kanji tokens (too generic), e.g., '者', '県', '方'
            if (singleKanji.test(word)) return false;
            // Drop very short kana-only tokens (particles, endings): length <= 2
            if (kanaOnly.test(word) && [...word].length <= 2) return false;
            // Keep tokens that look contentful
            const chars = [...word];
            const hasKanji = containsKanji.test(word);
            const hasKata = containsKatakana.test(word);
            if (hasKanji) {
                // Prefer at least 2 characters when containing Kanji
                return chars.length >= 2;
            }
            if (hasKata) {
                // Katakana loanwords: require length >= 2
                return chars.length >= 2;
            }
            // Hiragana-only leftovers: require length >= 3 to avoid particles/auxiliary fragments
            if (kanaOnly.test(word)) return chars.length >= 3;
        }

        return true;
    });

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

// Kuromoji-based async tokenizer for higher-quality Japanese word extraction
type KuromojiTokenizer = any; // keep types lightweight
let jaTokenizerPromise: Promise<KuromojiTokenizer> | null = null;

async function getJaTokenizer(dicBasePath: string = "/kuromoji/dict/") {
    if (!jaTokenizerPromise) {
        jaTokenizerPromise = (async () => {
            const kuromoji: any = await import('kuromoji');
            return await new Promise<KuromojiTokenizer>((resolve, reject) => {
                try {
                    kuromoji
                        .builder({ dicPath: dicBasePath })
                        .build((err: any, tokenizer: KuromojiTokenizer) => {
                            if (err) return reject(err);
                            resolve(tokenizer);
                        });
                } catch (e) {
                    reject(e);
                }
            });
        })();
    }
    return jaTokenizerPromise;
}

export async function generateWordFrequencyAsync(
    personaResponses: PersonaResponses,
    options: Parameters<typeof generateWordFrequency>[1] = {}
): Promise<Word[]> {
    const allText = Object.values(personaResponses).join(' ');

    const hasHan = /\p{Script=Han}/u.test(allText);
    const hasHiragana = /\p{Script=Hiragana}/u.test(allText);
    const hasKatakana = /\p{Script=Katakana}/u.test(allText);
    const locale = options.locale;
    const isJapanese = locale === 'ja' || hasHiragana || hasKatakana || hasHan;

    if (!isJapanese) {
        // Non-Japanese: use the synchronous path
        return generateWordFrequency(personaResponses, options);
    }

    try {
        const tokenizer = await getJaTokenizer();
        const tokens: any[] = tokenizer.tokenize(allText);

        const { stopWords = [], maxWords = 100, minWordLength = 1 } = options;
        const jaStopWords = new Set<string>([
            'の','は','が','に','を','へ','で','と','も','や','か','な','ね','ぞ','ぜ','さ','よ','わ','より','まで','から','って','とか','など','ので','ため','なら',
            'です','ます','でした','でしょう','だ','だった','では','じゃ','じゃない','ください','下さい','ございます','おります','いいます','いえる',
            'する','なる','ある','いる','できる','られる','れる','させる','しまう','して','している','ている','い','いた','いく','くる','きた',
            'こと','もの','ところ','場合','方','方々','私','うち','それ','これ','あれ','よう','ため','しかし','ただ','そして','また','でも','など'
        ]);
        const stopSet = new Set<string>([...stopWords, ...jaStopWords]);

        const contents: string[] = [];
        for (const t of tokens) {
            const pos: string = t.pos; // e.g., 名詞, 動詞, 形容詞
            if (pos === '名詞') {
                const d1: string = t.pos_detail_1; // e.g., 一般, 固有名詞, 数, 代名詞, 非自立
                if (['代名詞','数','非自立','接尾','助数詞'].includes(d1)) continue;
                const base: string = (t.basic_form && t.basic_form !== '*') ? t.basic_form : t.surface_form;
                if (!base || stopSet.has(base)) continue;
                if (/^\p{Script=Han}$/u.test(base)) continue; // drop single-kanji generic nouns
                contents.push(base.toLowerCase());
            } else if (pos === '動詞' || pos === '形容詞') {
                const base: string = (t.basic_form && t.basic_form !== '*') ? t.basic_form : t.surface_form;
                if (!base || stopSet.has(base)) continue;
                if (/^(?:\p{Script=Hiragana}|\p{Script=Katakana}|ー){1,2}$/u.test(base)) continue; // drop short endings
                contents.push(base.toLowerCase());
            }
        }

        const filtered = contents.filter(w => w.length >= minWordLength && !/^[0-9]+$/.test(w));
        const map = new Map<string, number>();
        for (const w of filtered) map.set(w, (map.get(w) || 0) + 1);
        const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, maxWords);
        if (sorted.length === 0) return [];
        const counts = sorted.map(([, c]) => c);
        const min = Math.min(...counts);
        const max = Math.max(...counts);
        const minSize = 10, maxSize = 100;
        return sorted.map(([word, count]) => ({
            text: word,
            value: Math.round(max === min ? (minSize + maxSize) / 2 : minSize + ((count - min) / (max - min)) * (maxSize - minSize))
        }));
    } catch (e) {
        console.warn('Kuromoji failed, falling back to heuristic tokenizer', e);
        return generateWordFrequency(personaResponses, options);
    }
}

export async function generateCompleteAnalysisAsync(
    llmResponse: string,
    personaResponses: PersonaResponses,
    wordFreqOptions?: Parameters<typeof generateWordFrequency>[1]
): Promise<AnalysisData> {
    const parsedData = parseLLMResponse(llmResponse);
    const wordFrequency = await generateWordFrequencyAsync(personaResponses, wordFreqOptions);
    return {
        ...parsedData,
        wordFrequency
    };
}