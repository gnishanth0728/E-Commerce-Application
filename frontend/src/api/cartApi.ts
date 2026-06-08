import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { getToken } from "../services/tokenService";

const cartApi = axios.create({
  baseURL: "/api/cart/",
});

// Add JWT token to requests
cartApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getCart = () => cartApi.get("");
export const addToCart = (product: {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}) => cartApi.post("add", product);
export const updateCartItem = (productId: number, quantity: number) =>
  cartApi.put(`update/${productId}`, null, { params: { quantity } });
export const removeFromCart = (productId: number) =>
  cartApi.delete(`remove/${productId}`);
export const clearCart = () => cartApi.delete("clear");
export const checkoutCart = () => cartApi.post("checkout");

export default cartApi;
