
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Book {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column()
    coverImage: string;

    @Column('decimal')
    price: number;

    @Column({ default: true })
    isPublished: boolean;

    @ManyToOne(() => User, (user) => user.books)
    author: User;
}