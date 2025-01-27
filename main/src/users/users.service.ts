import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) { }

    /**
     * Creates a new user with encrypted password.
     *
     * @param user - Partial user data containing `username` and `password`
     * @returns The created user
     * @throws BadRequestException if required fields are missing
     * @throws InternalServerErrorException if an unexpected error occurs
     */
    async create(user: Partial<User>): Promise<User> {
        try {
            if (!user.username || !user.password) {
                throw new BadRequestException('Username and password are required');
            }

            user.password = await bcrypt.hash(user.password, 10);
            return await this.usersRepository.save(user);
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('An error occurred while creating the user');
        }
    }

    /**
     * Finds a user by username.
     *
     * @param username - The username of the user
     * @returns The user or undefined if not found
     * @throws InternalServerErrorException if an unexpected error occurs
     */
    async findByUsername(username: string): Promise<User | undefined> {
        try {
            return await this.usersRepository.findOne({ where: { username } });
        } catch (error) {
            throw new InternalServerErrorException('An error occurred while fetching the user by username');
        }
    }

    /**
     * Finds a user by ID.
     *
     * @param id - The ID of the user
     * @returns The user or throws NotFoundException if not found
     * @throws NotFoundException if the user does not exist
     * @throws InternalServerErrorException if an unexpected error occurs
     */
    async findById(id: number): Promise<User | undefined> {
        try {
            const user = await this.usersRepository.findOne({ where: { id } });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            return user;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('An error occurred while fetching the user by ID');
        }
    }

    /**
     * Updates a user's details.
     *
     * @param id - The ID of the user to update
     * @param updateData - Partial data to update the user
     * @returns The updated user
     * @throws NotFoundException if the user does not exist
     * @throws InternalServerErrorException if an unexpected error occurs
     */
    async update(id: number, updateData: Partial<User>): Promise<User> {
        try {
            const existingUser = await this.findById(id);

            if (!existingUser) {
                throw new NotFoundException('User not found');
            }

            await this.usersRepository.update(id, updateData);
            return await this.findById(id);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('An error occurred while updating the user');
        }
    }

    /**
     * Deletes a user by ID.
     *
     * @param id - The ID of the user to delete
     * @returns A success message if the user was deleted
     * @throws NotFoundException if the user does not exist
     * @throws InternalServerErrorException if an unexpected error occurs
     */
    async delete(id: number): Promise<{ message: string }> {
        try {
            const result = await this.usersRepository.delete(id);

            if (result.affected === 0) {
                throw new NotFoundException('User not found');
            }

            return { message: 'User successfully deleted' };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('An error occurred while deleting the user');
        }
    }
}
