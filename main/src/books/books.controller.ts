import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    Req,
    BadRequestException,
    NotFoundException,
    InternalServerErrorException,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { instanceToPlain } from 'class-transformer';
import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

// DTO for book creation
class CreateBookDto {
    /** Title of the book */
    @IsString()
    @IsNotEmpty()
    title: string;

    /** Description of the book */
    @IsString()
    @IsOptional()
    description?: string;

    /** Price of the book */
    @IsNumber()
    @IsNotEmpty()
    price: number;

    /** URL for the book's cover image */
    @IsString()
    @IsOptional()
    coverImage?: string;
}

// DTO for book update
class UpdateBookDto {
    /** Updated title of the book */
    @IsString()
    @IsOptional()
    title?: string;

    /** Updated description of the book */
    @IsString()
    @IsOptional()
    description?: string;

    /** Updated price of the book */
    @IsNumber()
    @IsOptional()
    price?: number;

    /** Updated URL for the book's cover image */
    @IsString()
    @IsOptional()
    coverImage?: string;
}

@Controller('books')
export class BooksController {
    constructor(private readonly booksService: BooksService) { }

    /**
     * Retrieves all books based on the provided query filters.
     *
     * @param query - Query parameters for filtering books (e.g., title, author, etc.)
     * @returns A list of books that match the filters
     * @throws InternalServerErrorException if an unexpected error occurs
     */
    @Get()
    async findAll(@Query() query: any) {
        try {
            const books = await this.booksService.findAllWithFilters(query);
            return instanceToPlain(books);
        } catch (error) {
            throw new InternalServerErrorException('An error occurred while fetching books');
        }
    }

    /**
     * Retrieves a single book by its ID.
     *
     * @param id - The ID of the book to retrieve
     * @returns The requested book
     * @throws BadRequestException if the ID is invalid
     * @throws NotFoundException if the book is not found
     * @throws InternalServerErrorException if an unexpected error occurs
     */
    @Get(':id')
    async findOne(@Param('id') id: number) {
        try {
            if (!id) {
                throw new BadRequestException('Invalid book ID');
            }

            const book = await this.booksService.findOne(id);

            if (!book) {
                throw new NotFoundException('Book not found');
            }

            return instanceToPlain(book);
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('An error occurred while fetching the book');
        }
    }

    /**
     * Creates a new book for the authenticated user.
     *
     * @param req - The request object containing the authenticated user
     * @param createBookDto - Data for the new book
     * @returns The created book
     * @throws BadRequestException if the input data or user is invalid
     * @throws InternalServerErrorException if an unexpected error occurs
     */
    @UseGuards(JwtStrategy)
    @Post()
    async create(@Req() req, @Body() createBookDto: CreateBookDto) {
        try {
            if (!req.user) {
                throw new BadRequestException('Invalid user');
            }

            const book = await this.booksService.create(req.user, createBookDto);
            return instanceToPlain(book);
        } catch (error) {
            throw new InternalServerErrorException('An error occurred while creating the book');
        }
    }

    /**
     * Updates a book by its ID for the authenticated user.
     *
     * @param req - The request object containing the authenticated user
     * @param id - The ID of the book to update
     * @param updateBookDto - Data to update the book
     * @returns The updated book
     * @throws BadRequestException if the ID or input data is invalid
     * @throws NotFoundException if the book is not found
     * @throws InternalServerErrorException if an unexpected error occurs
     */
    @UseGuards(JwtStrategy)
    @Patch(':id')
    async update(
        @Req() req,
        @Param('id') id: number,
        @Body() updateBookDto: UpdateBookDto,
    ) {
        try {
            if (!id) {
                throw new BadRequestException('Invalid book ID');
            }

            if (!req.user) {
                throw new BadRequestException('Invalid user');
            }

            const updatedBook = await this.booksService.update(req.user, id, updateBookDto);

            if (!updatedBook) {
                throw new NotFoundException('Book not found');
            }

            return instanceToPlain(updatedBook);
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('An error occurred while updating the book');
        }
    }

    /**
     * Marks a book as unpublished by its ID for the authenticated user.
     *
     * @param req - The request object containing the authenticated user
     * @param id - The ID of the book to unpublish
     * @returns The unpublished book
     * @throws BadRequestException if the ID or input data is invalid
     * @throws NotFoundException if the book is not found or already unpublished
     * @throws InternalServerErrorException if an unexpected error occurs
     */
    @UseGuards(JwtStrategy)
    @Delete(':id')
    async remove(@Req() req, @Param('id') id: number) {
        try {
            if (!id) {
                throw new BadRequestException('Invalid book ID');
            }

            if (!req.user) {
                throw new BadRequestException('Invalid user');
            }

            const book = await this.booksService.remove(req.user, id);

            if (!book) {
                throw new NotFoundException('Book not found or already unpublished');
            }

            return instanceToPlain(book);
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('An error occurred while removing the book');
        }
    }
}
