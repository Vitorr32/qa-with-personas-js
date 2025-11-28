import { Tag } from 'src/tag/tag.entity';
import { User } from 'src/user/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne, JoinColumn } from 'typeorm';

@Entity('personas')
export class Persona {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text' })
    greeting: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    avatar?: string;

    @Column({ type: 'text' })
    description: string;

    @ManyToMany(() => Tag, tag => tag.personas, { cascade: true, eager: true })
    @JoinTable({
        name: 'persona_tags',
        joinColumn: { name: 'persona_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
    })
    tags: Tag[];

    @ManyToOne(() => User, { nullable: true, eager: true })
    @JoinColumn({ name: 'creator_id' })
    creator?: User | null;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
