import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('prompts')
export class Prompts {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ type: 'text' })
    mainPrompt: string;

    @Column({ type: 'text' })
    analystPrompt: string;

    // Model IDs selected for analysis and responses (Amazon Bedrock model IDs)
    @Column({ type: 'text', nullable: true })
    analystModel?: string | null;

    @Column({ type: 'text', nullable: true })
    responseModel?: string | null;

    // Temperature to use on questions using the main prompt
    // Allowed range on UI: 0.1 - 2.0. Default to 0.7 for backward compatibility.
    @Column({ type: 'float', default: 0.7 })
    temperature: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}