export interface StoreListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
}

export interface StoreItem {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  version: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreOrder {
  orderId: string;
  itemId: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
}

export interface StoreClientOptions {
  baseUrl: string;
  token?: string;
  timeoutMs?: number;
}
