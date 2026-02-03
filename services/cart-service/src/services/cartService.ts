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

    const cart = await this.getCart(userId);
    const existingItemIndex = cart.items.findIndex(
      (item: CartItem) => item.productId === productId
    );
    const existingQuantity =
      existingItemIndex >= 0 ? (cart.items[existingItemIndex]?.quantity ?? 0) : 0;
    const totalQuantity = existingQuantity + quantity;

    // Check stock against total quantity (existing + new)
    if (product.stock < totalQuantity) {
      throw new Error('Insufficient stock');
    }

    if (existingItemIndex >= 0) {
      const existingItem = cart.items[existingItemIndex];
      if (existingItem) {
        existingItem.quantity = totalQuantity;
      }
    } else {
      cart.items.push({
        productId,
        quantity,
        price: Number(product.price),
        name: product.name,
      });
    }

    cart.updatedAt = new Date();
    await this.redis.setex(this.cartKey(userId), CART_TTL, JSON.stringify(cart));

    return cart;
  }

  async updateItem(userId: string, productId: string, quantity: number): Promise<Cart> {
    const cart = await this.getCart(userId);
    const itemIndex = cart.items.findIndex((item: CartItem) => item.productId === productId);

    if (itemIndex < 0) {
      throw new Error('Item not found in cart');
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const item = cart.items[itemIndex];
      if (item) {
        item.quantity = quantity;
      }
    }

    cart.updatedAt = new Date();
    await this.redis.setex(this.cartKey(userId), CART_TTL, JSON.stringify(cart));

    return cart;
  }

  async removeItem(userId: string, productId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    cart.items = cart.items.filter((item: CartItem) => item.productId !== productId);
    cart.updatedAt = new Date();

    await this.redis.setex(this.cartKey(userId), CART_TTL, JSON.stringify(cart));

    return cart;
  }

  async clearCart(userId: string): Promise<void> {
    await this.redis.del(this.cartKey(userId));
  }

  async getCartTotal(userId: string): Promise<number> {
    const cart = await this.getCart(userId);
    return cart.items.reduce(
      (total: number, item: CartItem) => total + item.price * item.quantity,
      0
    );
  }
}
