import axios from "axios";

const API =
  axios.create({
    baseURL:
      "http://18.207.151.13:8080/api/auth",
  });

export default API;
