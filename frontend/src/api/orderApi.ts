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
}

export interface SavedCardPayload {
  cardHolderName: string;
  cardNumber: string;
  expiryDate: string;
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
export const getOrderHistory = () => orderApi.get("");
export const getSavedCard = () => orderApi.get<SavedCardPayload | null>("saved-card");

export default orderApi;
