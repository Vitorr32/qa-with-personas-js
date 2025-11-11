export interface Prompt {
    mainPrompt: string;
    analystPrompt: string;
    temperature: number;
    // Optional Bedrock model IDs
    analystModel?: string | null;
    responseModel?: string | null;
}