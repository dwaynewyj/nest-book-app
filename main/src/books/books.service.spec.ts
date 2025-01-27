import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Book } from './book.entity';
import { User } from '../users/user.entity';
import { NotFoundException, UnauthorizedException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';

describe('BooksService', () => {
    let booksService: BooksService;
    let booksRepository: Repository<Book>;
    let usersRepository: Repository<User>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BooksService,
                {
                    provide: getRepositoryToken(Book),
                    useClass: Repository,
                },
                {
                    provide: getRepositoryToken(User),
                    useClass: Repository,
                },
            ],
        }).compile();

        booksService = module.get<BooksService>(BooksService);
        booksRepository = module.get<Repository<Book>>(getRepositoryToken(Book));
        usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    });

    describe('findAll', () => {
        it('should return all published books when no search is provided', async () => {
            const mockBooks = [{ id: 1, title: 'Test Book', isPublished: true }];
            jest.spyOn(booksRepository, 'find').mockResolvedValue(mockBooks as Book[]);

            const result = await booksService.findAll();
            expect(booksRepository.find).toHaveBeenCalledWith({
                where: { isPublished: true },
                relations: ['author'],
            });
            expect(result).toEqual(mockBooks);
        });

        it('should throw an InternalServerErrorException if an error occurs', async () => {
            jest.spyOn(booksRepository, 'find').mockRejectedValue(new InternalServerErrorException('Unexpected Error'));

            await expect(booksService.findAll()).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('findAllWithFilters', () => {
        it('should return books based on filters', async () => {
            const mockBooks = [{ id: 1, title: 'Filtered Book' }];
            const queryBuilderMock = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockBooks),
            };

            jest.spyOn(booksRepository, 'createQueryBuilder').mockReturnValue(queryBuilderMock as any);

            const query = { title: 'Filtered', isPublished: false };
            const result = await booksService.findAllWithFilters(query);

            expect(booksRepository.createQueryBuilder).toHaveBeenCalledWith('book');
            expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith('book.author', 'author');
            expect(queryBuilderMock.andWhere).toHaveBeenCalledTimes(2);
            expect(queryBuilderMock.getMany).toHaveBeenCalled();
            expect(result).toEqual(mockBooks);
        });
    });

    describe('findOne', () => {
        it('should return a book by ID', async () => {
            const mockBook = { id: 1, title: 'Test Book' };
            jest.spyOn(booksRepository, 'findOne').mockResolvedValue(mockBook as Book);

            const result = await booksService.findOne(1);
            expect(booksRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['author'] });
            expect(result).toEqual(mockBook);
        });

        it('should throw NotFoundException if the book is not found', async () => {
            jest.spyOn(booksRepository, 'findOne').mockResolvedValue(null);

            await expect(booksService.findOne(1)).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a new book', async () => {
            const mockUser = { id: 1, username: 'testuser' };
            const mockBookData = { title: 'New Book', description: 'Test Description' };
            const mockBook = { id: 1, ...mockBookData, author: mockUser };

            jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser as User);
            jest.spyOn(booksRepository, 'create').mockReturnValue(mockBook as Book);
            jest.spyOn(booksRepository, 'save').mockResolvedValue(mockBook as Book);

            const result = await booksService.create(mockUser as User, mockBookData);
            expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 }, select: ['id', 'username'] });
            expect(booksRepository.create).toHaveBeenCalledWith({ ...mockBookData, author: mockUser });
            expect(booksRepository.save).toHaveBeenCalledWith(mockBook);
            expect(result).toEqual(mockBook);
        });

        it('should throw NotFoundException if the user is not found', async () => {
            jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

            const mockUser = { id: 1, username: 'testuser' };
            const mockBookData = { title: 'New Book', description: 'Test Description' };

            await expect(booksService.create(mockUser as User, mockBookData)).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if the user is Darth Vader', async () => {
            const mockUser = { id: 1, username: 'Darth Vader' } as User;
            const mockBookData = { title: 'The Dark Side', description: 'A story of the dark side' };

            jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);

            await expect(booksService.create(mockUser, mockBookData)).rejects.toThrow(ForbiddenException);
            expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 }, select: ['id', 'username'] });
        });
    });

    describe('update', () => {
        it('should update an existing book', async () => {
            const mockUser = { id: 1, username: 'testuser' };
            const mockBook = { id: 1, title: 'Old Title', author: mockUser };
            const mockUpdatedBook = { ...mockBook, title: 'New Title' };

            jest.spyOn(booksRepository, 'findOne').mockResolvedValue(mockBook as Book);
            jest.spyOn(booksRepository, 'save').mockResolvedValue(mockUpdatedBook as Book);

            const result = await booksService.update(mockUser as User, 1, { title: 'New Title' });
            expect(booksRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['author'] });
            expect(booksRepository.save).toHaveBeenCalledWith(mockUpdatedBook);
            expect(result).toEqual(mockUpdatedBook);
        });

        it('should throw UnauthorizedException if the user is not authorized', async () => {
            const mockUser = { id: 2, username: 'unauthorizeduser' };
            const mockBook = { id: 1, title: 'Old Title', author: { id: 1 } };

            jest.spyOn(booksRepository, 'findOne').mockResolvedValue(mockBook as Book);

            await expect(booksService.update(mockUser as User, 1, { title: 'New Title' })).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('remove', () => {
        it('should mark a book as unpublished', async () => {
            const mockUser = { id: 1, username: 'testuser' };
            const mockBook = { id: 1, title: 'Test Book', isPublished: true, author: mockUser };

            jest.spyOn(booksRepository, 'findOne').mockResolvedValue(mockBook as Book);
            jest.spyOn(booksRepository, 'save').mockResolvedValue({ ...mockBook, isPublished: false } as Book);

            const result = await booksService.remove(mockUser as User, 1);
            expect(booksRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['author'] });
            expect(booksRepository.save).toHaveBeenCalledWith({ ...mockBook, isPublished: false });
            expect(result).toEqual({ ...mockBook, isPublished: false });
        });

        it('should throw UnauthorizedException if the user is not authorized', async () => {
            const mockUser = { id: 2, username: 'unauthorizeduser' };
            const mockBook = { id: 1, title: 'Test Book', author: { id: 1 } };

            jest.spyOn(booksRepository, 'findOne').mockResolvedValue(mockBook as Book);

            await expect(booksService.remove(mockUser as User, 1)).rejects.toThrow(UnauthorizedException);
        });
    });
});
