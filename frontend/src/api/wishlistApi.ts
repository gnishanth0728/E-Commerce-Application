import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { getToken } from "../services/tokenService";

const wishlistApi = axios.create({
  baseURL: "/api/wishlist",
});

// Add JWT token to requests
wishlistApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const addToWishlist = (product: {
  productId: number;
  productName: string;
  productPrice: number;
  productImageUrl?: string;
}) => wishlistApi.post("add", product);

export const removeFromWishlist = (productId: number) =>
  wishlistApi.delete(`remove/${productId}`);

export const getWishlist = () => wishlistApi.get("");

export const checkIfInWishlist = (productId: number) =>
  wishlistApi.get(`check/${productId}`);

export default wishlistApi;

