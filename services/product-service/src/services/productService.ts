import { ProductRepository, ListQuery as RepoListQuery } from '../repositories/productRepository';
import { Category, Prisma } from '.prisma/client-product';

export interface ListQuery {
  page: number;
  limit: number;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  search?: string;
  sortBy: 'price' | 'name' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  async list(query: ListQuery) {
    const repoQuery: RepoListQuery = {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };
    if (query.category) repoQuery.category = query.category as Category;
    if (query.brand) repoQuery.brand = query.brand;
    if (query.minPrice !== undefined) repoQuery.minPrice = query.minPrice;
    if (query.maxPrice !== undefined) repoQuery.maxPrice = query.maxPrice;
    if (query.featured !== undefined) repoQuery.featured = query.featured;
    if (query.search) repoQuery.search = query.search;

    return this.productRepository.list(repoQuery);
  }

  async getById(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async search(searchTerm: string, page: number, limit: number) {
    return this.productRepository.search(searchTerm, page, limit);
  }

  async getCategories() {
    return this.productRepository.getCategories();
  }

  async create(data: Prisma.ProductCreateInput) {
    return this.productRepository.create(data);
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return this.productRepository.update(id, data);
  }

  async delete(id: string) {
    return this.productRepository.delete(id);
  }

  async getFeatured(limit?: number) {
    return this.productRepository.getFeatured(limit);
  }

  async getBrands() {
    return this.productRepository.getBrands();
  }
}
