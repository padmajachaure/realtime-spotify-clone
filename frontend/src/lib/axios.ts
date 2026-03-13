import axios from "axios";

export const axiosInstance = axios.create({
	baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "https://realtime-spotify-clone-2-isku.onrender.com/api",
});
