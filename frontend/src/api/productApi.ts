import axios from "axios";

const productApi = axios.create({
  baseURL: "http://18.207.151.13:8081/api"
});

export default productApi;
