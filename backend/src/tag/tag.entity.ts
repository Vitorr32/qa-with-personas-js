import { Persona } from 'src/persona/persona.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';

@Entity('tags')
export class Tag {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @ManyToMany(() => Persona, persona => persona.tags)
    personas: Persona[];
}