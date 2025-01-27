import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';

describe('UsersService', () => {
    let usersService: UsersService;
    let usersRepository: Repository<User>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useClass: Repository,
                },
            ],
        }).compile();

        usersService = module.get<UsersService>(UsersService);
        usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    });

    describe('create', () => {
        it('should hash the password and save the user', async () => {
            const mockUser: Partial<User> = { username: 'testuser', password: 'password123' };
            const hashedPassword = await bcrypt.hash(mockUser.password, 10);

            jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce(hashedPassword);
            jest.spyOn(usersRepository, 'save').mockResolvedValueOnce({
                ...mockUser,
                password: hashedPassword,
            } as User);

            const result = await usersService.create(mockUser);

            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(usersRepository.save).toHaveBeenCalledWith({
                ...mockUser,
                password: hashedPassword,
            });
            expect(result).toEqual({
                ...mockUser,
                password: hashedPassword,
            });
        });

        it('should throw BadRequestException if username or password is missing', async () => {
            await expect(usersService.create({ username: 'testuser' } as Partial<User>)).rejects.toThrow(BadRequestException);
        });

        it('should throw InternalServerErrorException on unexpected error', async () => {
            jest.spyOn(usersRepository, 'save').mockRejectedValueOnce(new Error('Unexpected error'));

            const mockUser: Partial<User> = { username: 'testuser', password: 'password123' };

            await expect(usersService.create(mockUser)).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('findByUsername', () => {
        it('should return a user by username', async () => {
            const mockUser: User = { id: 1, username: 'testuser', password: 'hashedPassword' } as User;

            jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);

            const result = await usersService.findByUsername('testuser');

            expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
            expect(result).toEqual(mockUser);
        });

        it('should throw InternalServerErrorException on unexpected error', async () => {
            jest.spyOn(usersRepository, 'findOne').mockRejectedValue(new Error('Unexpected error'));

            await expect(usersService.findByUsername('testuser')).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('findById', () => {
        it('should return a user by ID', async () => {
            const mockUser: User = { id: 1, username: 'testuser', password: 'hashedPassword' } as User;

            jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);

            const result = await usersService.findById(1);

            expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(result).toEqual(mockUser);
        });

        it('should throw NotFoundException if user is not found', async () => {
            jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

            await expect(usersService.findById(99)).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update the user and return the updated user', async () => {
            const mockUser: User = { id: 1, username: 'testuser', password: 'hashedPassword' } as User;
            const updatedData: Partial<User> = { username: 'updateduser' };

            jest.spyOn(usersRepository, 'update').mockResolvedValue({ affected: 1, raw: [] } as any);
            jest.spyOn(usersService, 'findById').mockResolvedValue({
                ...mockUser,
                ...updatedData,
            });

            const result = await usersService.update(1, updatedData);

            expect(usersRepository.update).toHaveBeenCalledWith(1, updatedData);
            expect(usersService.findById).toHaveBeenCalledWith(1);
            expect(result).toEqual({
                ...mockUser,
                ...updatedData,
            });
        });

        it('should throw NotFoundException if user is not found', async () => {
            jest.spyOn(usersService, 'findById').mockRejectedValue(new NotFoundException());

            const updatedData: Partial<User> = { username: 'updateduser' };

            await expect(usersService.update(99, updatedData)).rejects.toThrow(NotFoundException);
        });
    });

    describe('delete', () => {
        it('should delete a user by ID', async () => {
            jest.spyOn(usersRepository, 'delete').mockResolvedValue({ affected: 1, raw: [] } as any);

            const result = await usersService.delete(1);

            expect(usersRepository.delete).toHaveBeenCalledWith(1);
            expect(result).toEqual({ message: 'User successfully deleted' });
        });

        it('should throw NotFoundException if user is not found', async () => {
            jest.spyOn(usersRepository, 'delete').mockResolvedValue({ affected: 0, raw: [] } as any);

            await expect(usersService.delete(99)).rejects.toThrow(NotFoundException);
        });

        it('should throw InternalServerErrorException on unexpected error', async () => {
            jest.spyOn(usersRepository, 'delete').mockRejectedValue(new Error('Unexpected error'));

            await expect(usersService.delete(1)).rejects.toThrow(InternalServerErrorException);
        });
    });
});
