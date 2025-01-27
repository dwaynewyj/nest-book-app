
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtMiddleware } from '../auth/jwt.middleware';
import { UsersModule } from '../users/users.module';
import { Book } from './book.entity';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

@Module({
  imports: [TypeOrmModule.forFeature([Book]), UsersModule],
  providers: [BooksService],
  controllers: [BooksController],
})
export class BooksModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).exclude(
      { path: 'books', method: RequestMethod.GET },
      { path: 'books/:id', method: RequestMethod.GET },
    ).forRoutes('books');
  }
}