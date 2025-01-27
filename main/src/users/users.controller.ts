import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    UseGuards,
    Req,
    UnauthorizedException,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO for user creation
 */
class CreateUserDto {
    /**
     * The username of the user
     * @example "testuser"
     */
    @IsString()
    @IsNotEmpty()
    username: string;

    /**
     * The password of the user
     * @example "password123"
     */
    @IsString()
    @IsNotEmpty()
    password: string;
}

/**
 * DTO for updating user profile
 */
class UpdateUserDto {
    /**
     * The updated username of the user
     * @example "updateduser"
     */
    @IsString()
    @IsOptional()
    username?: string;

    /**
     * The updated password of the user
     * @example "newpassword123"
     */
    @IsString()
    @IsOptional()
    password?: string;


    /**
     * The updated pseudonym of the author
     * @example "authorPseudonym123"
     */
    @IsString()
    @IsOptional()
    authorPseudonym?: string;
}

@Controller('users')
@UseGuards(JwtStrategy)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * Creates a new user
     * 
     * @param createUserDto - The data required to create a user
     * @returns The created user
     * @throws InternalServerErrorException if an unexpected error occurs
     */
    @Post()
    async createUser(@Body() createUserDto: CreateUserDto) {
        try {
            return await this.usersService.create({
                username: createUserDto.username,
                password: createUserDto.password,
                authorPseudonym: createUserDto.username,
            });
        } catch (error) {
            throw new InternalServerErrorException('An error occurred while creating the user');
        }
    }

    /**
     * Retrieves the authenticated user's profile
     * 
     * @param req - The request object containing the authenticated user
     * @returns The authenticated user's profile
     * @throws UnauthorizedException if the user is not found
     * @throws InternalServerErrorException if an unexpected error occurs
     */
    @Get('me')
    async getProfile(@Req() req) {
        try {
            const user = await this.usersService.findById(req.user.id);

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            return user;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new InternalServerErrorException('An error occurred while fetching the user profile');
        }
    }

    /**
     * Updates the authenticated user's profile
     * 
     * @param req - The request object containing the authenticated user
     * @param updateData - The data to update the user's profile
     * @returns The updated user profile
     * @throws BadRequestException if the update data is invalid
     * @throws InternalServerErrorException if an unexpected error occurs
     */
    @Patch('me')
    async updateProfile(@Req() req, @Body() updateData: UpdateUserDto) {
        try {
            return await this.usersService.update(req.user.id, updateData);
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('An error occurred while updating the user profile');
        }
    }

    /**
     * Deletes the authenticated user's profile
     * 
     * @param req - The request object containing the authenticated user
     * @returns A success message
     * @throws InternalServerErrorException if an unexpected error occurs
     */
    @Delete('me')
    async deleteProfile(@Req() req) {
        try {
            await this.usersService.delete(req.user.id);
            return { message: 'User profile deleted successfully' };
        } catch (error) {
            throw new InternalServerErrorException('An error occurred while deleting the user profile');
        }
    }
}
