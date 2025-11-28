import { Tag } from './Tag';
import { User } from './interfaces';

export interface Persona {
    id: string;
    name: string;
    avatar?: string;
    greeting: string;
    description: string;
    tags: Tag[];
    createdAt?: string;
    creator?: User;
}
