import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import {
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
    InternalServerErrorException,
} from '@nestjs/common';

describe('BooksController', () => {
    let booksController: BooksController;
    let booksService: Partial<BooksService>;

    beforeEach(async () => {
        booksService = {
            findAllWithFilters: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [BooksController],
            providers: [
                {
                    provide: BooksService,
                    useValue: booksService,
                },
            ],
        }).compile();

        booksController = module.get<BooksController>(BooksController);
    });

    describe('findAll', () => {
        it('should return a list of books based on query filters', async () => {
            const mockBooks = [
                {
                    id: 1,
                    title: 'Test Book',
                    description: 'A test description',
                    coverImage: 'http://example.com/image.jpg',
                    price: 19.99,
                    isPublished: true,
                    author: {
                        id: 1,
                        username: 'testuser',
                        authorPseudonym: 'Test Pseudonym',
                        password: "",
                        books: []
                    },
                },
            ];
            jest.spyOn(booksService, 'findAllWithFilters').mockResolvedValue(mockBooks);

            const query = { title: 'Test' };
            const result = await booksController.findAll(query);

            expect(booksService.findAllWithFilters).toHaveBeenCalledWith(query);
            expect(result).toEqual(mockBooks);
        });

        it('should throw an InternalServerErrorException on service error', async () => {
            jest.spyOn(booksService, 'findAllWithFilters').mockRejectedValue(new Error('Unexpected error'));

            await expect(booksController.findAll({ title: 'Test' })).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('findOne', () => {
        it('should return a single book by ID', async () => {
            const mockBook = {
                id: 1,
                title: 'Test Book',
                description: 'A test description',
                coverImage: 'http://example.com/image.jpg',
                price: 19.99,
                isPublished: true,
                author: {
                    id: 1,
                    username: 'testuser',
                    authorPseudonym: 'Test Pseudonym',
                    password: "",
                    books: []
                },
            };
            jest.spyOn(booksService, 'findOne').mockResolvedValue(mockBook);

            const result = await booksController.findOne(1);

            expect(booksService.findOne).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockBook);
        });

        it('should throw BadRequestException for invalid ID', async () => {
            await expect(booksController.findOne(null)).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if the book is not found', async () => {
            jest.spyOn(booksService, 'findOne').mockResolvedValue(null);

            await expect(booksController.findOne(1)).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a new book', async () => {
            const mockUser = { id: 1, username: 'testuser' };
            const mockBook = {
                id: 1,
                title: 'New Book',
                description: 'A test description',
                coverImage: 'http://example.com/image.jpg',
                price: 19.99,
                isPublished: true,
                author: {
                    id: 1,
                    username: 'testuser',
                    authorPseudonym: 'Test Pseudonym',
                    password: "",
                    books: []
                },
            };

            jest.spyOn(booksService, 'create').mockResolvedValue(mockBook);

            const createBookDto = { title: 'New Book', description: 'Test Description', price: 19.99 };
            const result = await booksController.create({ user: mockUser } as any, createBookDto);

            expect(booksService.create).toHaveBeenCalledWith(mockUser, createBookDto);
            expect(result).toEqual(mockBook);
        });

        it('should throw InternalServerErrorException on service error', async () => {
            jest.spyOn(booksService, 'create').mockRejectedValue(new Error('Unexpected error'));

            const mockUser = { id: 1, username: 'testuser' };
            const createBookDto = { title: 'New Book', description: 'Test Description', price: 19.99 };

            await expect(booksController.create({ user: mockUser } as any, createBookDto)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('update', () => {
        it('should update an existing book', async () => {
            const mockUser = { id: 1, username: 'testuser' };
            const mockUpdatedBook = {
                id: 1,
                title: 'Updated Book',
                description: 'An updated description',
                coverImage: 'http://example.com/image.jpg',
                price: 19.99,
                isPublished: true,
                author: {
                    id: 1,
                    username: 'testuser',
                    authorPseudonym: 'Test Pseudonym',
                    password: "",
                    books: []
                },
            };

            jest.spyOn(booksService, 'update').mockResolvedValue(mockUpdatedBook);

            const updateBookDto = { title: 'Updated Book' };
            const result = await booksController.update({ user: mockUser } as any, 1, updateBookDto);

            expect(booksService.update).toHaveBeenCalledWith(mockUser, 1, updateBookDto);
            expect(result).toEqual(mockUpdatedBook);
        });

        it('should throw NotFoundException if the book is not found', async () => {
            jest.spyOn(booksService, 'update').mockResolvedValue(null);

            const mockUser = { id: 1, username: 'testuser' };
            const updateBookDto = { title: 'Updated Book' };

            await expect(booksController.update({ user: mockUser } as any, 1, updateBookDto)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('remove', () => {
        it('should mark a book as unpublished', async () => {
            const mockUser = { id: 1, username: 'testuser' };
            const mockUnpublishedBook = {
                id: 1,
                title: 'Unpublished Book',
                description: 'A test description',
                coverImage: 'http://example.com/image.jpg',
                price: 19.99,
                isPublished: false,
                author: {
                    id: 1,
                    username: 'testuser',
                    authorPseudonym: 'Test Pseudonym',
                    password: "",
                    books: []
                },
            };

            jest.spyOn(booksService, 'remove').mockResolvedValue(mockUnpublishedBook);

            const result = await booksController.remove({ user: mockUser } as any, 1);

            expect(booksService.remove).toHaveBeenCalledWith(mockUser, 1);
            expect(result).toEqual(mockUnpublishedBook);
        });

        it('should throw InternalServerErrorException if not authorized', async () => {
            jest.spyOn(booksService, 'remove').mockRejectedValue(new InternalServerErrorException());

            const mockUser = { id: 2, username: 'unauthorizeduser' };

            await expect(booksController.remove({ user: mockUser } as any, 1)).rejects.toThrow(InternalServerErrorException);
        });
    });
});
