import axios from "axios";

const productApi = axios.create({
  baseURL: "/api/product"
});

export default productApi;
