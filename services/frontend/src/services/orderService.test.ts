import { beforeEach, describe, expect, it, vi } from 'vitest';
import orderService from './orderService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

type ApiMock = {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

const mockedApi = api as unknown as ApiMock;

describe('orderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.get.mockResolvedValue({ data: { success: true } });
    mockedApi.post.mockResolvedValue({ data: { success: true } });
  });

  it('calls list/read endpoints with default and custom pagination', async () => {
    await orderService.getOrders();
    await orderService.getOrders(3, 25);
    await orderService.getOrder('o1');

    expect(mockedApi.get).toHaveBeenNthCalledWith(1, '/orders?page=1&limit=10');
    expect(mockedApi.get).toHaveBeenNthCalledWith(2, '/orders?page=3&limit=25');
    expect(mockedApi.get).toHaveBeenNthCalledWith(3, '/orders/o1');
  });

  it('calls create and cancel order endpoints', async () => {
    await orderService.createOrder({
      shippingAddress: {
        firstName: 'Jane',
        lastName: 'Doe',
        street: '123 Main',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'US',
        phone: '5551231234',
      },
      paymentMethod: 'card',
      paymentDetails: { lastFour: '4242', cardholderName: 'Jane Doe' },
    });
    await orderService.cancelOrder('o1');

    expect(mockedApi.post).toHaveBeenNthCalledWith(
      1,
      '/orders',
      expect.objectContaining({ paymentMethod: 'card' })
    );
    expect(mockedApi.post).toHaveBeenNthCalledWith(2, '/orders/o1/cancel');
  });
});
