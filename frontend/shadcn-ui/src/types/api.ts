// Types pour les réponses API

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface OrderResponse {
  id: number;
  userId: number;
  ticketId: number;
  quantity: number;
  total: number;
  status: string;
}

export interface YengaPayResponse {
  id: number;
  orderId: number;
  amount: number;
  paymentMethod: string;
  status: string;
  paymentReference: string;
  transactionId: string | null;
  paymentData: Record<string, unknown>;
  yengapayData: {
    paymentUrl?: string;
    checkoutPageUrlWithPaymentToken?: string;
    transactionId?: string;
    status?: string;
    id?: string;
    reference?: string;
    paymentAmount?: number;
    currency?: string;
    transactionStatus?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentDetails {
  id: number;
  orderId: number;
  amount: number;
  paymentMethod: string;
  status: string;
  paymentReference: string;
  transactionId: string | null;
  paymentData: Record<string, unknown>;
  orderTotal: number;
  orderStatus: string;
  userName: string;
  userEmail: string;
  ticketCategory: string;
  ticketPrice: number;
  eventTitle: string;
  createdAt: string;
  updatedAt: string;
} 