import {
    Controller,
    Post,
    Body,
    UnauthorizedException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsString, IsNotEmpty } from 'class-validator';

class LoginDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * Logs in a user and returns a JWT token
     * 
     * @param body - LoginDto object containing username and password
     * @returns A JWT token for the authenticated user
     * @throws {UnauthorizedException} If the username or password is invalid
     * @throws {InternalServerErrorException} If an unexpected error occurs
     */
    @Post('login')
    async login(@Body() body: LoginDto) {
        try {
            const user = await this.authService.validateUser(body.username, body.password);

            if (!user) {
                throw new UnauthorizedException('Invalid username or password');
            }

            return this.authService.login(user);
        } catch (error) {
            if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }
}
