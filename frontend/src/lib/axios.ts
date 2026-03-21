import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const axiosInstance = axios.create({
  baseURL: "https://realtime-spotify-clone-2-isku.onrender.com",
  withCredentials: true,
});

export default axiosInstance;