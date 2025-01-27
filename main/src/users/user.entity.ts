
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Book } from '../books/book.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    username: string;

    @Column()
    @Exclude()
    password: string;

    @Column()
    authorPseudonym: string;

    @ManyToOne(() => User, (user) => user.books, { onDelete: 'CASCADE' })
    books: Book[];
}
