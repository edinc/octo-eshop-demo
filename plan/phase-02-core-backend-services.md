# Phase 2: Core Backend Services

## Overview
Implement the three core backend services: User Service, Product Service, and Cart Service. Each service follows Domain-Driven Design principles with its own database.

## Prerequisites
- Phase 1 completed (project setup)
- PostgreSQL running locally (via Docker)
- Redis running locally (via Docker)

---

## Tasks

### 2.1 Shared Types and Utilities

**Objective:** Create shared TypeScript types and utility functions used across services.

#### File: `shared/types/package.json`
```json
{
  "name": "@octo-eshop/types",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist"
  }
}
```

#### File: `shared/types/src/index.ts`
```typescript
// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAddress {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  brand: string;
  images: string[];
  specifications: BikeSpecifications;
  stock: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductCategory = 'mountain' | 'road' | 'hybrid' | 'electric' | 'kids';

export interface BikeSpecifications {
  frameSize: string;
  wheelSize: string;
  weight: number;
  material: string;
  gears: number;
  color: string;
}

// Cart types
export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

// Order types
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: UserAddress;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  name: string;
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}
```

#### File: `shared/utils/src/index.ts`
```typescript
import { ApiResponse, ApiError, PaginationMeta } from '@octo-eshop/types';

export function successResponse<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
  return { success: true, data, meta };
}

export function errorResponse(error: ApiError): ApiResponse<never> {
  return { success: false, error };
}

export function paginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function hashPassword(password: string): Promise<string> {
  // Will use bcrypt in actual implementation
  return Promise.resolve(password);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

---

### 2.2 User Service Implementation

**Objective:** Build authentication and user management service.

#### Directory Structure:
```
services/user-service/
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── config/
│   │   └── index.ts
│   ├── controllers/
│   │   └── userController.ts
│   ├── services/
│   │   └── userService.ts
│   ├── repositories/
│   │   └── userRepository.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── routes/
│   │   └── userRoutes.ts
│   ├── models/
│   │   └── user.ts
│   └── utils/
│       └── jwt.ts
├── tests/
│   ├── unit/
│   └── integration/
├── migrations/
├── Dockerfile
├── package.json
└── tsconfig.json
```

#### File: `services/user-service/package.json`
```json
{
  "name": "@octo-eshop/user-service",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/",
    "migrate": "prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "@octo-eshop/types": "workspace:*",
    "@octo-eshop/utils": "workspace:*",
    "@prisma/client": "^5.8.0",
    "express": "^4.18.2",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/cors": "^2.8.17",
    "@types/morgan": "^1.9.9",
    "prisma": "^5.8.0",
    "tsx": "^4.7.0",
    "vitest": "^1.2.0",
    "supertest": "^6.3.4",
    "@types/supertest": "^6.0.2"
  }
}
```

#### File: `services/user-service/prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String    @map("password_hash")
  firstName    String    @map("first_name")
  lastName     String    @map("last_name")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  
  addresses    Address[]
  sessions     Session[]

  @@map("users")
}

model Address {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  street     String
  city       String
  state      String
  postalCode String   @map("postal_code")
  country    String
  isDefault  Boolean  @default(false) @map("is_default")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("addresses")
}

model Session {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  refreshToken String   @unique @map("refresh_token")
  expiresAt    DateTime @map("expires_at")
  createdAt    DateTime @default(now()) @map("created_at")
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

#### File: `services/user-service/src/app.ts`
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { userRoutes } from './routes/userRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'healthy', service: 'user-service' });
});

// Routes
app.use('/api/users', userRoutes);

// Error handling
app.use(errorHandler);

export default app;
```

#### File: `services/user-service/src/controllers/userController.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { successResponse, errorResponse } from '@octo-eshop/utils';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class UserController {
  constructor(private userService: UserService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = registerSchema.parse(req.body);
      const result = await this.userService.register(data);
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = loginSchema.parse(req.body);
      const tokens = await this.userService.login(data.email, data.password);
      res.json(successResponse(tokens));
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.body.refreshToken;
      await this.userService.logout(refreshToken);
      res.json(successResponse({ message: 'Logged out successfully' }));
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const user = await this.userService.getProfile(userId);
      res.json(successResponse(user));
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const user = await this.userService.updateProfile(userId, req.body);
      res.json(successResponse(user));
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const tokens = await this.userService.refreshToken(refreshToken);
      res.json(successResponse(tokens));
    } catch (error) {
      next(error);
    }
  };
}
```

#### File: `services/user-service/src/services/userService.ts`
```typescript
import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/userRepository';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { AuthTokens } from '@octo-eshop/types';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async register(input: RegisterInput): Promise<{ id: string; email: string }> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.userRepository.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    return { id: user.id, email: user.email };
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const tokens = generateTokens({ userId: user.id, email: user.email });
    await this.userRepository.createSession(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.userRepository.deleteSession(refreshToken);
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const { passwordHash, ...profile } = user;
    return profile;
  }

  async updateProfile(userId: string, data: Partial<{ firstName: string; lastName: string }>) {
    const user = await this.userRepository.update(userId, data);
    const { passwordHash, ...profile } = user;
    return profile;
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);
    const session = await this.userRepository.findSession(refreshToken);
    
    if (!session || session.expiresAt < new Date()) {
      throw new Error('Invalid refresh token');
    }

    await this.userRepository.deleteSession(refreshToken);
    const tokens = generateTokens({ userId: payload.userId, email: payload.email });
    await this.userRepository.createSession(payload.userId, tokens.refreshToken);

    return tokens;
  }
}
```

#### File: `services/user-service/src/routes/userRoutes.ts`
```typescript
import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/userRepository';
import { authenticate } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);

// Protected routes
router.post('/logout', authenticate, userController.logout);
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);

export { router as userRoutes };
```

---

### 2.3 Product Service Implementation

**Objective:** Build product catalog management service.

#### File: `services/product-service/prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Product {
  id          String   @id @default(uuid())
  name        String
  description String
  price       Decimal  @db.Decimal(10, 2)
  category    Category
  brand       String
  images      String[]
  stock       Int      @default(0)
  featured    Boolean  @default(false)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  specifications ProductSpecification?

  @@index([category])
  @@index([brand])
  @@index([price])
  @@map("products")
}

model ProductSpecification {
  id        String  @id @default(uuid())
  productId String  @unique @map("product_id")
  frameSize String  @map("frame_size")
  wheelSize String  @map("wheel_size")
  weight    Decimal @db.Decimal(5, 2)
  material  String
  gears     Int
  color     String

  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_specifications")
}

enum Category {
  mountain
  road
  hybrid
  electric
  kids
}
```

#### File: `services/product-service/src/controllers/productController.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { successResponse, paginationMeta } from '@octo-eshop/utils';
import { z } from 'zod';

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.enum(['mountain', 'road', 'hybrid', 'electric', 'kids']).optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  featured: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['price', 'name', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export class ProductController {
  constructor(private productService: ProductService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = listQuerySchema.parse(req.query);
      const { products, total } = await this.productService.list(query);
      
      res.json(successResponse(
        products,
        paginationMeta(query.page, query.limit, total)
      ));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.productService.getById(req.params.id);
      res.json(successResponse(product));
    } catch (error) {
      next(error);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, page = 1, limit = 20 } = req.query;
      const { products, total } = await this.productService.search(
        q as string,
        Number(page),
        Number(limit)
      );
      
      res.json(successResponse(
        products,
        paginationMeta(Number(page), Number(limit), total)
      ));
    } catch (error) {
      next(error);
    }
  };

  getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.productService.getCategories();
      res.json(successResponse(categories));
    } catch (error) {
      next(error);
    }
  };

  // Admin endpoints
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.productService.create(req.body);
      res.status(201).json(successResponse(product));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.productService.update(req.params.id, req.body);
      res.json(successResponse(product));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.productService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
```

#### Seed Data Script: `services/product-service/prisma/seed.ts`
```typescript
import { PrismaClient, Category } from '@prisma/client';

const prisma = new PrismaClient();

const bicycles = [
  {
    name: 'Trek Marlin 7',
    description: 'A versatile hardtail mountain bike perfect for trail riding and everyday adventures.',
    price: 1099.99,
    category: Category.mountain,
    brand: 'Trek',
    images: ['/images/trek-marlin-7-1.jpg', '/images/trek-marlin-7-2.jpg'],
    stock: 15,
    featured: true,
    specifications: {
      frameSize: 'M',
      wheelSize: '29"',
      weight: 13.5,
      material: 'Aluminum',
      gears: 18,
      color: 'Matte Black',
    },
  },
  {
    name: 'Specialized Allez',
    description: 'Entry-level road bike with race-inspired geometry for speed and efficiency.',
    price: 1299.99,
    category: Category.road,
    brand: 'Specialized',
    images: ['/images/specialized-allez-1.jpg'],
    stock: 8,
    featured: true,
    specifications: {
      frameSize: 'L',
      wheelSize: '700c',
      weight: 9.2,
      material: 'Aluminum',
      gears: 16,
      color: 'Gloss Red',
    },
  },
  {
    name: 'Giant Escape 3',
    description: 'Comfortable hybrid bike for fitness riding and urban commuting.',
    price: 549.99,
    category: Category.hybrid,
    brand: 'Giant',
    images: ['/images/giant-escape-3-1.jpg'],
    stock: 25,
    featured: false,
    specifications: {
      frameSize: 'M',
      wheelSize: '700c',
      weight: 11.8,
      material: 'Aluminum',
      gears: 21,
      color: 'Charcoal',
    },
  },
  {
    name: 'Cannondale Moterra Neo',
    description: 'Full-suspension electric mountain bike with powerful Bosch motor.',
    price: 5499.99,
    category: Category.electric,
    brand: 'Cannondale',
    images: ['/images/cannondale-moterra-1.jpg'],
    stock: 5,
    featured: true,
    specifications: {
      frameSize: 'L',
      wheelSize: '29"',
      weight: 23.5,
      material: 'Carbon',
      gears: 12,
      color: 'Stealth Grey',
    },
  },
  {
    name: 'Scott Scale 20 Junior',
    description: 'Lightweight kids mountain bike designed for young riders aged 8-12.',
    price: 699.99,
    category: Category.kids,
    brand: 'Scott',
    images: ['/images/scott-scale-junior-1.jpg'],
    stock: 12,
    featured: false,
    specifications: {
      frameSize: '20"',
      wheelSize: '20"',
      weight: 9.8,
      material: 'Aluminum',
      gears: 9,
      color: 'Blue/Yellow',
    },
  },
  // Add more products...
];

async function main() {
  console.log('Seeding database...');

  for (const bike of bicycles) {
    const { specifications, ...productData } = bike;
    
    await prisma.product.create({
      data: {
        ...productData,
        specifications: {
          create: specifications,
        },
      },
    });
  }

  console.log(`Seeded ${bicycles.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

### 2.4 Cart Service Implementation

**Objective:** Build shopping cart service using Redis for storage.

#### File: `services/cart-service/package.json`
```json
{
  "name": "@octo-eshop/cart-service",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "test": "vitest run",
    "lint": "eslint src/"
  },
  "dependencies": {
    "@octo-eshop/types": "workspace:*",
    "@octo-eshop/utils": "workspace:*",
    "express": "^4.18.2",
    "ioredis": "^5.3.2",
    "zod": "^3.22.4",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/morgan": "^1.9.9",
    "tsx": "^4.7.0",
    "vitest": "^1.2.0"
  }
}
```

#### File: `services/cart-service/src/services/cartService.ts`
```typescript
import Redis from 'ioredis';
import axios from 'axios';
import { Cart, CartItem } from '@octo-eshop/types';

const CART_TTL = 60 * 60 * 24 * 7; // 7 days

export class CartService {
  private redis: Redis;
  private productServiceUrl: string;

  constructor(redis: Redis, productServiceUrl: string) {
    this.redis = redis;
    this.productServiceUrl = productServiceUrl;
  }

  private cartKey(userId: string): string {
    return `cart:${userId}`;
  }

  async getCart(userId: string): Promise<Cart> {
    const cartData = await this.redis.get(this.cartKey(userId));
    
    if (!cartData) {
      return {
        id: userId,
        userId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return JSON.parse(cartData);
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<Cart> {
    // Fetch product details
    const productResponse = await axios.get(`${this.productServiceUrl}/api/products/${productId}`);
    const product = productResponse.data.data;

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    const cart = await this.getCart(userId);
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity,
        price: product.price,
        name: product.name,
      });
    }

    cart.updatedAt = new Date();
    await this.redis.setex(this.cartKey(userId), CART_TTL, JSON.stringify(cart));

    return cart;
  }

  async updateItem(userId: string, productId: string, quantity: number): Promise<Cart> {
    const cart = await this.getCart(userId);
    const itemIndex = cart.items.findIndex(item => item.productId === productId);

    if (itemIndex < 0) {
      throw new Error('Item not found in cart');
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    cart.updatedAt = new Date();
    await this.redis.setex(this.cartKey(userId), CART_TTL, JSON.stringify(cart));

    return cart;
  }

  async removeItem(userId: string, productId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    cart.items = cart.items.filter(item => item.productId !== productId);
    cart.updatedAt = new Date();

    await this.redis.setex(this.cartKey(userId), CART_TTL, JSON.stringify(cart));

    return cart;
  }

  async clearCart(userId: string): Promise<void> {
    await this.redis.del(this.cartKey(userId));
  }

  async getCartTotal(userId: string): Promise<number> {
    const cart = await this.getCart(userId);
    return cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
  }
}
```

#### File: `services/cart-service/src/routes/cartRoutes.ts`
```typescript
import { Router } from 'express';
import { CartController } from '../controllers/cartController';
import { CartService } from '../services/cartService';
import { authenticate } from '../middleware/auth';
import Redis from 'ioredis';
import { config } from '../config';

const router = Router();
const redis = new Redis(config.redisUrl);
const cartService = new CartService(redis, config.productServiceUrl);
const cartController = new CartController(cartService);

// All cart routes require authentication
router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:productId', cartController.updateItem);
router.delete('/items/:productId', cartController.removeItem);
router.delete('/', cartController.clearCart);

export { router as cartRoutes };
```

---

## Testing Strategy

### Unit Tests

#### File: `services/user-service/tests/unit/userService.test.ts`
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../../src/services/userService';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: any;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      createSession: vi.fn(),
      deleteSession: vi.fn(),
      findSession: vi.fn(),
    };
    userService = new UserService(mockUserRepository);
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
      });

      const result = await userService.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result).toEqual({ id: '123', email: 'test@example.com' });
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({ id: '123' });

      await expect(
        userService.register({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        })
      ).rejects.toThrow('User already exists');
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        passwordHash: '$2a$12$...',  // bcrypt hash of 'password123'
      });

      // Test implementation
    });
  });
});
```

### Integration Tests

#### File: `services/user-service/tests/integration/userRoutes.test.ts`
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('User Routes', () => {
  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
    });
  });
});
```

---

## Deliverables Checklist

### User Service
- [ ] Database schema with Prisma migrations
- [ ] Registration endpoint with email validation
- [ ] Login endpoint with JWT generation
- [ ] Logout endpoint with session invalidation
- [ ] Profile GET/PUT endpoints
- [ ] Refresh token endpoint
- [ ] Authentication middleware
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests for all endpoints

### Product Service
- [ ] Database schema with Prisma migrations
- [ ] List products with pagination and filters
- [ ] Get single product by ID
- [ ] Search products by name/description
- [ ] Get categories list
- [ ] Admin CRUD endpoints
- [ ] Seed data script with 20+ bicycles
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests for all endpoints

### Cart Service
- [ ] Redis connection configuration
- [ ] Get cart endpoint
- [ ] Add item to cart endpoint
- [ ] Update item quantity endpoint
- [ ] Remove item endpoint
- [ ] Clear cart endpoint
- [ ] Product service integration (fetch product details)
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests for all endpoints

---

## Local Development Setup

### docker-compose.yml additions
```yaml
services:
  postgres-user:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: userdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-user-data:/var/lib/postgresql/data

  postgres-product:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: productdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432"
    volumes:
      - postgres-product-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  postgres-user-data:
  postgres-product-data:
  redis-data:
```

---

## Dependencies

**Depends on:**
- Phase 1: Project structure and tooling

**Required by:**
- Phase 3: Order & Payment Services (need User, Product, Cart)
- Phase 4: Frontend (API endpoints to consume)
- Phase 5: Containerization (services to containerize)
