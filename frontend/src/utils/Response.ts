export interface Response {
    personaId: string;
    status: 'pending' | 'streaming' | 'completed' | 'error';
    content: string;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
}