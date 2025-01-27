import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, InternalServerErrorException } from '@nestjs/common';

describe('AuthService', () => {
    let authService: AuthService;
    let usersService: Partial<UsersService>;
    let jwtService: Partial<JwtService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: {
                        findByUsername: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn(),
                    },
                },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        jwtService = module.get<JwtService>(JwtService);
    });

    describe('validateUser', () => {
        it('should return the user without the password if validation succeeds', async () => {
            const hashedPassword = await bcrypt.hash('password123', 10);

            jest.spyOn(usersService, 'findByUsername').mockResolvedValue({
                id: 1,
                username: 'testuser',
                password: hashedPassword,
                authorPseudonym: 'Test Pseudonym',
                books: [],
            });

            const result = await authService.validateUser('testuser', 'password123');

            expect(usersService.findByUsername).toHaveBeenCalledWith('testuser');
            expect(result).toEqual({
                id: 1,
                username: 'testuser',
                authorPseudonym: 'Test Pseudonym',
                books: [],
            });
        });

        it('should throw UnauthorizedException if user is not found', async () => {
            jest.spyOn(usersService, 'findByUsername').mockResolvedValue(null);

            await expect(authService.validateUser('nonexistent', 'password123')).rejects.toThrow(
                UnauthorizedException,
            );
            expect(usersService.findByUsername).toHaveBeenCalledWith('nonexistent');
        });

        it('should throw UnauthorizedException if the password does not match', async () => {
            const hashedPassword = await bcrypt.hash('password123', 10);

            jest.spyOn(usersService, 'findByUsername').mockResolvedValue({
                id: 1,
                username: 'testuser',
                password: hashedPassword,
                authorPseudonym: 'Test Pseudonym',
                books: [],
            });

            await expect(authService.validateUser('testuser', 'wrongpassword')).rejects.toThrow(
                UnauthorizedException,
            );
            expect(usersService.findByUsername).toHaveBeenCalledWith('testuser');
        });

        it('should throw InternalServerErrorException for unexpected errors', async () => {
            jest.spyOn(usersService, 'findByUsername').mockRejectedValue(new Error('Unexpected error'));

            await expect(authService.validateUser('testuser', 'password123')).rejects.toThrow(
                InternalServerErrorException,
            );
            expect(usersService.findByUsername).toHaveBeenCalledWith('testuser');
        });
    });

    describe('login', () => {
        it('should return an access token for a valid user', async () => {
            jest.spyOn(jwtService, 'sign').mockReturnValue('test.jwt.token');

            const user = { id: 1, username: 'testuser' };
            const result = await authService.login(user);

            expect(jwtService.sign).toHaveBeenCalledWith({
                username: 'testuser',
                sub: 1,
            });
            expect(result).toEqual({ access_token: 'test.jwt.token' });
        });

        it('should throw InternalServerErrorException for unexpected errors during token generation', async () => {
            jest.spyOn(jwtService, 'sign').mockImplementation(() => {
                throw new Error('Unexpected error');
            });

            const user = { id: 1, username: 'testuser' };

            await expect(authService.login(user)).rejects.toThrow(InternalServerErrorException);
            expect(jwtService.sign).toHaveBeenCalledWith({
                username: 'testuser',
                sub: 1,
            });
        });
    });
});
