# Wookie Books - REST API

## 1. Project Overview

Project Link: 
    
    https://app.codesubmit.io/c/meo-continuity/23da3dda-5aab-481b-8da4-f9c45c83948e/e022cba9-f94a-4775-b7fa-2b8c4f3f1867

Author: Nick Jang

Created: 20250119

---

## 2. Features

- **User Authentication**: Users can register and log in using a username and password to obtain a JWT.
- **Custom User Model**: Includes an "author pseudonym" field to uniquely represent Wookie authors.
- **Book Management**:
  - Publicly accessible `/books` resource to list and search books.
  - Authenticated users can create, update, and delete their books.
  - Only the book owner can unpublish a book.
- **Content Negotiation**: Supports JSON and XML responses based on the `Content-Type` header.
- **Darth Vader Restriction**: The user _Darth Vader_ is forbidden from publishing books.

---

## 3. Installation

### Prerequisites

- Node.js (v16 or higher)
- npm 

### Steps

1. Clone the repository:

   ```bash
   git clone http://meo-continuit-khoxig@git.codesubmit.io/meo-continuity/wookie-books-igpmbk
   cd wookie-books-igpmbk

2. Install dependencies:

    ```bash
    npm install

3. Run Project:

    ```bash
    cd main
    npm start
---

## 4. API Documentation

### Authentication

    POST /auth/login: Authenticate and receive a JWT.
    
### Users

    GET /users: List all users (authenticated only).
    POST /users: Create a new user.
    PATCH /users/:id: Update the user profile (authenticated user only).
    DELETE /users/:id: Delete the user profile (authenticated user only).

### Books

    GET /books: List all books (public).
    GET /books/:id: Get book details (public).
    POST /books: Publish a new book (authenticated).
    PATCH /books/:id: Update book details (authenticated owner only).
    DELETE /books/:id: Unpublish a book (authenticated owner only).

---
## 5. How to Test

## User test

1. Create a user
```
POST http://localhost:3000/users
{
    "username": "testuser",
    "password": "password123"
}
```

2. Log in
```
POST http://localhost:3000/auth/login
{
  "username": "testuser",
  "password": "password123"
}
```
3. Use the JWT token response from 2) to access endpoints

```
Publish book
POST http://localhost:3000/books
Bearer Token <token>
{
    "title": "Wookie Adventures 1",
    "description": "An epic tale from Kashyyyk 1.",
    "coverImage": "url_to_image 1",
    "price": 39.99,
    "isPublished": true
}
```

```
Update boook
PATCH http://localhost:3000/books/15
{
    "price": 39.99
}
```

```
Unpublish book
DELET http://localhost:3000/books/1
```

```
Get books info (Token not needed)
GET http://localhost:3000/books/1
GET http://localhost:3000/books
GET http://localhost:3000/books?minPrice=10&maxPrice=30&title=Wookie Adventures 1&isPublished=true&authorPseudonym=testuser3
```


## Unit test
    cd main
    npm test

---
## 6. Project Structure
```
src/
├── auth/               # Authentication and JWT logic
├── books/              # Book module
├── users/              # User module
├── app.module.ts/      # Global module config
└── main.ts             # Application main server
```