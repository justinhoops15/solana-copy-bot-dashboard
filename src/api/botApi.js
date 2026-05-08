import axios from "axios";

const api = axios.create({ baseURL: "/api", timeout: 8000 });

export const getStatus      = ()             => api.get("/status").then(r => r.data);
export const getBotStatus   = ()             => api.get("/bot-status").then(r => r.data);
export const getWallets     = (limit = 20)   => api.get("/wallets", { params: { limit } }).then(r => r.data);
export const getPositions   = ()             => api.get("/positions").then(r => r.data);
export const getTrades      = (limit = 100)  => api.get("/trades", { params: { limit } }).then(r => r.data);
export const getSettings    = ()             => api.get("/settings").then(r => r.data);
export const getWallet      = ()             => api.get("/wallet").then(r => r.data);
export const getPerformance = (period = "30d") => api.get("/performance", { params: { period } }).then(r => r.data);
export const getCalendar    = (month)        => api.get("/calendar", { params: { month } }).then(r => r.data);

export const approveWallet = (address, approved) =>
  api.post(`/wallets/${address}/approve`, { approved }).then(r => r.data);

export const pinWallet = (address, pinned) =>
  api.post(`/wallets/${address}/pin`, { pinned }).then(r => r.data);

export const updateSetting = (key, value) =>
  api.put(`/settings/${key}`, { value: String(value) }).then(r => r.data);

export const getNotifSettings = () =>
  api.get("/notifications/settings").then(r => r.data);

export const updateNotifSetting = (key, value) =>
  api.put(`/notifications/settings/${key}`, { value }).then(r => r.data);

export const subscribeNotif = (subscription) =>
  api.post("/notifications/subscribe", subscription.toJSON()).then(r => r.data);

export const unsubscribeNotif = (endpoint) =>
  api.delete("/notifications/subscribe", { data: { endpoint } }).then(r => r.data);

export const testNotification = () =>
  api.post("/notifications/test").then(r => r.data);

export const getVapidKey = () =>
  api.get("/notifications/vapid-key").then(r => r.data);
