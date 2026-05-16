import type { StoreClientOptions, StoreItem, StoreListQuery, StoreOrder } from "./types";

export class DancingStoreClient {
  private readonly baseUrl: string;
  private readonly token?: string;

  constructor(options: StoreClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.token = options.token;
  }

  async list(_query: StoreListQuery = {}): Promise<StoreItem[]> {
    return [];
  }

  async get(itemId: string): Promise<StoreItem | null> {
    if (!itemId) {
      throw new Error("itemId is required");
    }
    return null;
  }

  async createOrder(itemId: string): Promise<StoreOrder> {
    if (!itemId) {
      throw new Error("itemId is required");
    }
    return {
      orderId: "",
      itemId,
      amount: 0,
      currency: "USD",
      status: "pending"
    };
  }

  async verifyOrder(orderId: string): Promise<StoreOrder | null> {
    if (!orderId) {
      throw new Error("orderId is required");
    }
    return null;
  }

  get config() {
    return {
      baseUrl: this.baseUrl,
      hasToken: Boolean(this.token)
    };
  }
}
