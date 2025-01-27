import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    /**
     * Validates a user by username and password
     * 
     * @param username - The username of the user
     * @param pass - The password of the user
     * @returns A user object without the password field or null if invalid
     * @throws {UnauthorizedException} If the username or password is invalid
     * @throws {InternalServerErrorException} For unexpected errors
     */
    async validateUser(username: string, pass: string): Promise<any> {
        try {
            const user = await this.usersService.findByUsername(username);

            if (!user) {
                throw new UnauthorizedException('Invalid username or password');
            }

            const isPasswordValid = await bcrypt.compare(pass, user.password);

            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid username or password');
            }

            const { password, ...result } = user;
            return result;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new InternalServerErrorException('An error occurred while validating the user');
        }
    }

    /**
     * Generates a JWT for an authenticated user
     * 
     * @param user - The user object
     * @returns An access token
     * @throws {InternalServerErrorException} For unexpected errors
     */
    async login(user: any) {
        try {
            const payload = { username: user.username, sub: user.id };
            return {
                access_token: this.jwtService.sign(payload),
            };
        } catch (error) {
            throw new InternalServerErrorException('An error occurred while generating the access token');
        }
    }
}
