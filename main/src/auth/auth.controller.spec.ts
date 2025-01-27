import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException, InternalServerErrorException } from '@nestjs/common';

describe('AuthController', () => {
    let authController: AuthController;
    let authService: Partial<AuthService>;

    beforeEach(async () => {
        authService = {
            validateUser: jest.fn(),
            login: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: authService,
                },
            ],
        }).compile();

        authController = module.get<AuthController>(AuthController);
    });

    describe('login', () => {
        it('should return an access token for valid credentials', async () => {
            const mockUser = { id: 1, username: 'testuser' };
            const mockToken = { access_token: 'test.jwt.token' };

            jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);
            jest.spyOn(authService, 'login').mockResolvedValue(mockToken);

            const body = { username: 'testuser', password: 'password123' };
            const result = await authController.login(body);

            expect(authService.validateUser).toHaveBeenCalledWith('testuser', 'password123');
            expect(authService.login).toHaveBeenCalledWith(mockUser);
            expect(result).toEqual(mockToken);
        });

        it('should throw UnauthorizedException for invalid credentials', async () => {
            jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

            const body = { username: 'wronguser', password: 'wrongpassword' };

            await expect(authController.login(body)).rejects.toThrow(UnauthorizedException);
            expect(authService.validateUser).toHaveBeenCalledWith('wronguser', 'wrongpassword');
        });

        it('should throw InternalServerErrorException for unexpected errors', async () => {
            jest.spyOn(authService, 'validateUser').mockRejectedValue(new Error('Unexpected error'));

            const body = { username: 'testuser', password: 'password123' };

            await expect(authController.login(body)).rejects.toThrow(InternalServerErrorException);
            expect(authService.validateUser).toHaveBeenCalledWith('testuser', 'password123');
        });
    });
});
