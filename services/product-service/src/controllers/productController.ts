import { Request, Response, NextFunction } from 'express';
import { ProductService, ListQuery } from '../services/productService';
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

const specificationSchema = z.object({
  frameSize: z.string().min(1),
  wheelSize: z.string().min(1),
  weight: z.number().positive(),
  material: z.string().min(1),
  gears: z.number().int().positive(),
  color: z.string().min(1),
});

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  category: z.enum(['mountain', 'road', 'hybrid', 'electric', 'kids']),
  brand: z.string().min(1),
  images: z.array(z.string()).default([]),
  stock: z.number().int().min(0).default(0),
  featured: z.boolean().default(false),
  specifications: z
    .object({
      create: specificationSchema,
    })
    .optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  category: z.enum(['mountain', 'road', 'hybrid', 'electric', 'kids']).optional(),
  brand: z.string().min(1).optional(),
  images: z.array(z.string()).optional(),
  stock: z.number().int().min(0).optional(),
  featured: z.boolean().optional(),
});

export class ProductController {
  constructor(private productService: ProductService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = listQuerySchema.parse(req.query);
      const query: ListQuery = {
        page: parsed.page,
        limit: parsed.limit,
        sortBy: parsed.sortBy,
        sortOrder: parsed.sortOrder,
      };
      if (parsed.category) query.category = parsed.category;
      if (parsed.brand) query.brand = parsed.brand;
      if (parsed.minPrice !== undefined) query.minPrice = parsed.minPrice;
      if (parsed.maxPrice !== undefined) query.maxPrice = parsed.maxPrice;
      if (parsed.featured !== undefined) query.featured = parsed.featured;
      if (parsed.search) query.search = parsed.search;

      const { products, total } = await this.productService.list(query);

      res.json(successResponse(products, paginationMeta(query.page, query.limit, total)));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'];
      if (!id) {
        throw new Error('Product ID is required');
      }
      const product = await this.productService.getById(id);
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

      res.json(successResponse(products, paginationMeta(Number(page), Number(limit), total)));
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

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = createProductSchema.parse(req.body);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const product = await this.productService.create(data as any);
      res.status(201).json(successResponse(product));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'];
      if (!id) {
        throw new Error('Product ID is required');
      }
      const data = updateProductSchema.parse(req.body);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const product = await this.productService.update(id, data as any);
      res.json(successResponse(product));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'];
      if (!id) {
        throw new Error('Product ID is required');
      }
      await this.productService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getFeatured = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query['limit'] ? Number(req.query['limit']) : undefined;
      const products = await this.productService.getFeatured(limit);
      res.json(successResponse(products));
    } catch (error) {
      next(error);
    }
  };

  getBrands = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brands = await this.productService.getBrands();
      res.json(successResponse(brands));
    } catch (error) {
      next(error);
    }
  };
}
