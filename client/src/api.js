import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("chatapp-user") || "{}");
  if (user.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

// Auth
export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser = (data) => API.post("/auth/login", data);

// Users
export const searchUsers = (search) => API.get(`/users?search=${search}`);
export const getProfile = () => API.get("/users/profile");
export const updateProfile = (data) => API.put("/users/profile", data);
export const getAllUsers = () => API.get("/users/all");

// Chats
export const accessChat = (userId) => API.post("/chats", { userId });
export const fetchChats = () => API.get("/chats");
export const createGroupChat = (data) => API.post("/chats/group", data);
export const renameGroup = (data) => API.put("/chats/group/rename", data);
export const addToGroup = (data) => API.put("/chats/group/add", data);
export const removeFromGroup = (data) => API.put("/chats/group/remove", data);

// Messages
export const getMessages = (chatId) => API.get(`/messages/${chatId}`);
export const sendMessage = (data) =>
  API.post("/messages", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const markAsRead = (chatId) => API.put(`/messages/read/${chatId}`);
export const deleteMessage = (messageId) =>
  API.delete(`/messages/${messageId}`);
export const editMessage = (messageId, content) =>
  API.put(`/messages/${messageId}`, { content });
