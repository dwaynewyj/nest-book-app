import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
    let usersController: UsersController;
    let usersService: Partial<UsersService>;

    beforeEach(async () => {
        usersService = {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: usersService,
                },
            ],
        }).compile();

        usersController = module.get<UsersController>(UsersController);
    });

    describe('createUser', () => {
        it('should create a new user', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                password: 'hashedPassword',
                authorPseudonym: 'testuser',
                books: [],
            };

            jest.spyOn(usersService, 'create').mockResolvedValue(mockUser);

            const result = await usersController.createUser({
                username: 'testuser',
                password: 'password123',
            });

            expect(usersService.create).toHaveBeenCalledWith({
                username: 'testuser',
                password: 'password123',
                authorPseudonym: 'testuser',
            });
            expect(result).toEqual(mockUser);
        });

        it('should throw InternalServerErrorException on service error', async () => {
            jest.spyOn(usersService, 'create').mockRejectedValue(new Error('Unexpected error'));

            await expect(
                usersController.createUser({
                    username: 'testuser',
                    password: 'password123',
                }),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('getProfile', () => {
        it('should return the user profile', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                authorPseudonym: 'Test Pseudonym',
                password: '',
                books: [],
            };

            jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);

            const result = await usersController.getProfile({ user: { id: 1 } } as any);

            expect(usersService.findById).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockUser);
        });

        it('should throw UnauthorizedException if no user is found', async () => {
            jest.spyOn(usersService, 'findById').mockResolvedValue(null);

            await expect(usersController.getProfile({ user: { id: 1 } } as any)).rejects.toThrow(UnauthorizedException);
            expect(usersService.findById).toHaveBeenCalledWith(1);
        });

        it('should throw InternalServerErrorException on unexpected error', async () => {
            jest.spyOn(usersService, 'findById').mockRejectedValue(new Error('Unexpected error'));

            await expect(usersController.getProfile({ user: { id: 1 } } as any)).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('updateProfile', () => {
        it('should update the user profile', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                authorPseudonym: 'Updated Pseudonym',
                password: '',
                books: [],
            };
            jest.spyOn(usersService, 'update').mockResolvedValue(mockUser);

            const result = await usersController.updateProfile(
                { user: { id: 1 } } as any,
                { authorPseudonym: 'Updated Pseudonym' },
            );

            expect(usersService.update).toHaveBeenCalledWith(1, { authorPseudonym: 'Updated Pseudonym' });
            expect(result).toEqual(mockUser);
        });

        it('should throw InternalServerErrorException on unexpected error', async () => {
            jest.spyOn(usersService, 'update').mockRejectedValue(new Error('Unexpected error'));

            await expect(
                usersController.updateProfile({ user: { id: 1 } } as any, { authorPseudonym: 'Updated Pseudonym' }),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });
    describe('deleteProfile', () => {
        it('should delete the user profile successfully', async () => {
            const mockDeleteResult = { message: 'User profile deleted successfully' };

            jest.spyOn(usersService, 'delete').mockResolvedValue(mockDeleteResult);

            const result = await usersController.deleteProfile({ user: { id: 1 } } as any);

            expect(usersService.delete).toHaveBeenCalledWith(1);
            expect(result).toEqual({ message: 'User profile deleted successfully' });
        });

        it('should throw NotFoundException if user is not found', async () => {
            jest.spyOn(usersService, 'delete').mockRejectedValue(new InternalServerErrorException('User not found'));

            await expect(usersController.deleteProfile({ user: { id: 99 } } as any)).rejects.toThrow(InternalServerErrorException);
            expect(usersService.delete).toHaveBeenCalledWith(99);
        });

        it('should throw InternalServerErrorException on unexpected error', async () => {
            jest.spyOn(usersService, 'delete').mockRejectedValue(new Error('Unexpected error'));

            await expect(usersController.deleteProfile({ user: { id: 1 } } as any)).rejects.toThrow(InternalServerErrorException);
            expect(usersService.delete).toHaveBeenCalledWith(1);
        });
    });
});
