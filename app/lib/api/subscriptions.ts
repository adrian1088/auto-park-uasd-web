import { http } from '@/app/lib/http';

export interface Subscription {
  id: number;
  userId: number;
  user?: { id: number; name: string; email: string };
  plateNumbers: string;
  rateId: number;
  rate?: { id: number; amount: number; parkingLot?: { id: number; name: string } };
  parkingSpaceId?: number;
  parkingSpace?: { id: number; spaceNumber: string };
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "EXPIRED" | "PAUSED";
}

export interface CreateSubscriptionDto {
  userId: number;
  plateNumbers: string;
  rateId: number;
  parkingSpaceId?: number;
  startDate: string;
  endDate: string;
  status?: "ACTIVE" | "EXPIRED" | "PAUSED";
}

export const SubscriptionsService = {
  async findAll(): Promise<Subscription[]> {
    const response = await http.get<unknown>('subscriptions');
    
    if (Array.isArray(response)) {
      return response as Subscription[];
    }
    
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as { data: Subscription[] }).data || [];
    }

    return [];
  },

  async create(data: CreateSubscriptionDto): Promise<Subscription> {
    return await http.post<Subscription>('subscriptions', data);
  },

  async update(id: number, data: Partial<CreateSubscriptionDto>): Promise<Subscription> {
    return await http.patch<Subscription>(`subscriptions/${id}`, data);
  },

  async renew(id: number, amount: number, paymentMethod: string): Promise<Subscription> {
    return await http.post<Subscription>(`subscriptions/${id}/renew`, { amount, paymentMethod });
  },

  async remove(id: number): Promise<void> {
    return await http.delete<void>(`subscriptions/${id}`);
  },
};