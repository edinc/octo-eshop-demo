export interface OrderEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
  correlationId: string;
}

export interface EventPublisher {
  publish(eventType: string, data: Record<string, unknown>): Promise<void>;
  close(): Promise<void>;
}

// Local event publisher for development (logs events to console)
export class LocalEventPublisher implements EventPublisher {
  // eslint-disable-next-line no-console
  async publish(eventType: string, data: Record<string, unknown>): Promise<void> {
    const event: OrderEvent = {
      type: eventType,
      data,
      timestamp: new Date(),
      correlationId: (data.orderId as string) || crypto.randomUUID(),
    };
    // eslint-disable-next-line no-console
    console.log(`[EVENT] ${eventType}:`, JSON.stringify(event, null, 2));
  }

  async close(): Promise<void> {
    // No-op for local publisher
  }
}
