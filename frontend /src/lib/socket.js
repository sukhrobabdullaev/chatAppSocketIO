import { io } from "socket.io-client";

const baseURL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "";

export const createSocket = token => {
  return io(baseURL, {
    auth: { token },
    withCredentials: true,
  });
};
