import { Tag } from './Tag';

export interface Persona {
    id: string;
    name: string;
    avatar?: string;
    greeting: string;
    description: string;
    tags: Tag[];
    createdAt?: string;
}
