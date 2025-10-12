// TypeScript interfaces
export interface Persona {
    id: string;
    name: string;
    avatar?: string; // Optional image URL
    greeting: string;
    description: string;
    tags: string[]; // Array is better for DB - can be JSON column or separate tags table
}
