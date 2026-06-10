import axios from "axios";

const shippingApi = axios.create({
  baseURL: "/api/shipping/",
});

export interface ShippingLocation {
  city: string;
  postalCode: string;
}

export const getShippingLocations = () =>
  shippingApi.get<ShippingLocation[]>("locations");

export default shippingApi;
