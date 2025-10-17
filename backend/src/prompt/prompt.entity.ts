import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('prompts')
export class Prompts {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ type: 'text' })
    mainPrompt: string;

    @Column({ type: 'text' })
    analystPrompt: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}