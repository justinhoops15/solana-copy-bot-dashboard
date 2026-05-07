import axios from "axios";

const api = axios.create({ baseURL: "/api", timeout: 8000 });

export const getStatus    = ()            => api.get("/status").then(r => r.data);
export const getWallets   = (limit = 20) => api.get("/wallets", { params: { limit } }).then(r => r.data);
export const getPositions = ()            => api.get("/positions").then(r => r.data);
export const getTrades    = (limit = 100) => api.get("/trades", { params: { limit } }).then(r => r.data);
export const getSettings  = ()            => api.get("/settings").then(r => r.data);

export const approveWallet = (address, approved) =>
  api.post(`/wallets/${address}/approve`, { approved }).then(r => r.data);

export const updateSetting = (key, value) =>
  api.put(`/settings/${key}`, { value: String(value) }).then(r => r.data);

export const getWallet = () => api.get("/wallet").then(r => r.data);