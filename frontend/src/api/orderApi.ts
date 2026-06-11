import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { getToken } from "../services/tokenService";

const orderApi = axios.create({
  baseURL: "/api/orders/",
});

export interface CheckoutPayload {
  cardHolderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  saveCard: boolean;
  doorNumber: string;
  flatAddress: string;
  lane: string;
  city: string;
  postalCode: string;
}

export interface SavedCardPayload {
  cardHolderName: string;
  cardNumber: string;
  expiryDate: string;
}

export interface OrderPreviewPayload {
  doorNumber: string;
  flatAddress: string;
  lane: string;
  city: string;
  postalCode: string;
}

export interface OrderPreviewResponse {
  totalItems: number;
  itemBill: number;
  gstAmount: number;
  shippingCost: number;
  finalAmount: number;
}

orderApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const checkoutCart = (payload: CheckoutPayload) =>
  orderApi.post("checkout", payload);
export const previewOrder = (payload: OrderPreviewPayload) =>
  orderApi.post<OrderPreviewResponse>("preview", payload);
export const getOrderHistory = () => orderApi.get("");
export const getSavedCard = () => orderApi.get<SavedCardPayload | null>("saved-card");

export default orderApi;
