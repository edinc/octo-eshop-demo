import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCancelOrder, useCreateOrder, useOrder, useOrders } from './useOrders';
import orderService from '@/services/orderService';
import { useQuery, useQueryClient } from '@tanstack/react-query';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: null })),
  useMutation: vi.fn(config => config),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));

vi.mock('@/services/orderService', () => ({
  default: {
    getOrders: vi.fn(),
    getOrder: vi.fn(),
    createOrder: vi.fn(),
    cancelOrder: vi.fn(),
  },
}));

type QueryClientMock = {
  invalidateQueries: ReturnType<typeof vi.fn>;
};

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;
const mockedUseQueryClient = useQueryClient as unknown as ReturnType<typeof vi.fn>;
const mockedOrderService = orderService as unknown as {
  getOrders: ReturnType<typeof vi.fn>;
  getOrder: ReturnType<typeof vi.fn>;
  createOrder: ReturnType<typeof vi.fn>;
  cancelOrder: ReturnType<typeof vi.fn>;
};

describe('useOrders hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('configures orders and order queries', async () => {
    useOrders(2, 25);
    const listOptions = mockedUseQuery.mock.calls[0][0] as {
      queryKey: unknown[];
      queryFn: () => Promise<unknown>;
    };
    expect(listOptions.queryKey).toEqual(['orders', 2, 25]);
    await listOptions.queryFn();
    expect(mockedOrderService.getOrders).toHaveBeenCalledWith(2, 25);

    mockedUseQuery.mockClear();
    useOrder('o1');
    const orderOptions = mockedUseQuery.mock.calls[0][0] as {
      queryKey: unknown[];
      enabled?: boolean;
      queryFn: () => Promise<unknown>;
    };
    expect(orderOptions.queryKey).toEqual(['order', 'o1']);
    expect(orderOptions.enabled).toBe(true);
    await orderOptions.queryFn();
    expect(mockedOrderService.getOrder).toHaveBeenCalledWith('o1');
  });

  it('invalidates orders and cart after successful create order', async () => {
    const queryClient: QueryClientMock = { invalidateQueries: vi.fn() };
    mockedUseQueryClient.mockReturnValue(queryClient);

    const mutation = useCreateOrder() as unknown as {
      mutationFn: (data: unknown) => Promise<unknown>;
      onSuccess: () => void;
    };

    await mutation.mutationFn({
      shippingAddress: {
        street: '123 Main',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'US',
      },
      paymentMethod: 'card',
    });
    mutation.onSuccess();

    expect(mockedOrderService.createOrder).toHaveBeenCalledOnce();
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(1, { queryKey: ['orders'] });
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(2, { queryKey: ['cart'] });
  });

  it('invalidates orders after successful cancel', async () => {
    const queryClient: QueryClientMock = { invalidateQueries: vi.fn() };
    mockedUseQueryClient.mockReturnValue(queryClient);

    const mutation = useCancelOrder() as unknown as {
      mutationFn: (id: string) => Promise<unknown>;
      onSuccess: () => void;
    };

    await mutation.mutationFn('o1');
    mutation.onSuccess();

    expect(mockedOrderService.cancelOrder).toHaveBeenCalledWith('o1');
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['orders'] });
  });

  it('creates default list query when no args are provided', async () => {
    useOrders();
    const options = mockedUseQuery.mock.calls[0][0] as { queryFn: () => Promise<unknown> };
    await options.queryFn();
    expect(mockedOrderService.getOrders).toHaveBeenCalledWith(1, 10);
  });
});
