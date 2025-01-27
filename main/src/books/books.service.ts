import { Injectable, BadRequestException, NotFoundException, UnauthorizedException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Book } from './book.entity';

@Injectable()
export class BooksService {
    constructor(
        @InjectRepository(Book)
        private readonly booksRepository: Repository<Book>,

        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) { }

    /**
     * Finds all books optionally filtered by a search term.
     * @param search - Optional search term to filter books by title or description.
     * @returns List of books.
     */
    async findAll(search?: string): Promise<Book[]> {
        try {
            if (search) {
                return this.booksRepository.find({
                    where: [
                        { title: search },
                        { description: search },
                    ],
                    relations: ['author'],
                });
            }
            return this.booksRepository.find({ where: { isPublished: true }, relations: ['author'] });
        } catch (error) {
            throw new InternalServerErrorException('An error occurred while fetching books');
        }
    }

    /**
     * Finds books with advanced filtering options.
     * @param query - Query object containing filters.
     * @returns List of books matching the filters.
     */
    async findAllWithFilters(query: any): Promise<Book[]> {
        try {
            const queryBuilder = this.booksRepository.createQueryBuilder('book');
            queryBuilder.leftJoinAndSelect('book.author', 'author');

            if (query.title) {
                queryBuilder.andWhere('book.title LIKE :title', { title: `%${query.title}%` });
            }

            if (query.authorPseudonym) {
                queryBuilder.andWhere('author.id IS NOT NULL');
                queryBuilder.andWhere('author.authorPseudonym LIKE :authorPseudonym', {
                    authorPseudonym: `%${query.authorPseudonym}%`,
                });
            }

            if (query.isPublished !== undefined) {
                queryBuilder.andWhere('book.isPublished = :isPublished', { isPublished: query.isPublished === 'true' });
            }

            if (query.minPrice && query.maxPrice) {
                queryBuilder.andWhere('book.price BETWEEN :minPrice AND :maxPrice', {
                    minPrice: parseFloat(query.minPrice),
                    maxPrice: parseFloat(query.maxPrice),
                });
            }

            return queryBuilder.getMany();
        } catch (error) {
            throw new InternalServerErrorException('An error occurred while applying filters to books');
        }
    }

    /**
     * Finds a single book by its ID.
     * @param id - ID of the book.
     * @returns The requested book or throws an exception if not found.
     */
    async findOne(id: number): Promise<Book | undefined> {
        try {
            if (!id) {
                throw new BadRequestException('Invalid book ID');
            }

            const book = await this.booksRepository.findOne({ where: { id }, relations: ['author'] });

            if (!book) {
                throw new NotFoundException('Book not found');
            }

            return book;
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('An error occurred while fetching the book');
        }
    }

    /**
     * Creates a new book for the given user.
     * @param user - The user creating the book.
     * @param bookData - Partial book data.
     * @returns The created book.
     */
    async create(user: User, bookData: Partial<Book>): Promise<Book> {
        try {
            const author = await this.usersRepository.findOne({ where: { id: user.id }, select: ['id', 'username'] });
            if (!author) {
                throw new NotFoundException('Author not found');
            }
            if (author.username === 'Darth Vader') {
                throw new ForbiddenException('Darth Vader is not allowed to publish Wookie books.');
            }

            const book = this.booksRepository.create({ ...bookData, author: author });
            return this.booksRepository.save(book);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }
            throw new InternalServerErrorException('An error occurred while creating the book');
        }
    }

    /**
     * Updates a book for the given user.
     * @param user - The user updating the book.
     * @param id - ID of the book to update.
     * @param bookData - Partial data to update the book.
     * @returns The updated book or throws an exception if not authorized or not found.
     */
    async update(user: User, id: number, bookData: Partial<Book>): Promise<Book> {
        try {
            const book = await this.booksRepository.findOne({ where: { id }, relations: ['author'] });

            if (!book) {
                throw new NotFoundException('Book not found');
            }

            if (!book?.author || book?.author?.id !== user.id) {
                throw new UnauthorizedException('You are not authorized to update this book');
            }

            Object.assign(book, bookData);
            return this.booksRepository.save(book);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
                throw error;
            }
            throw new InternalServerErrorException('An error occurred while updating the book');
        }
    }

    /**
     * Marks a book as unpublished for the given user.
     * @param user - The user marking the book as unpublished.
     * @param id - ID of the book to unpublish.
     * @returns The updated book or throws an exception if not authorized or not found.
     */
    async remove(user: User, id: number): Promise<Book> {
        try {
            const book = await this.booksRepository.findOne({ where: { id }, relations: ['author'] });

            if (!book) {
                throw new NotFoundException('Book not found');
            }

            if (!book?.author || book?.author?.id !== user.id) {
                throw new UnauthorizedException('You are not authorized to unpublish this book');
            }

            book.isPublished = false;
            return this.booksRepository.save(book);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
                throw error;
            }
            throw new InternalServerErrorException('An error occurred while unpublishing the book');
        }
    }
}
