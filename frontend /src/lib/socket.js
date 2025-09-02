const wsBase = import.meta.env.MODE === "development" ? "ws://localhost:3000/ws" : "/ws";

export const createSocket = token => {
  const url = token ? `${wsBase}?token=${encodeURIComponent(token)}` : wsBase;
  return new WebSocket(url);
};
