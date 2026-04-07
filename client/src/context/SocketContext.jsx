import { createContext, useContext, useEffect, useState } from "react";
import socket from "../socket/socket";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit("user-online", user._id);

      socket.on("online-users", (users) => setOnlineUsers(users));

      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
