import { axiosInstance } from "@/lib/axios";
import { Message, User } from "@/types";
import { create } from "zustand";
import { io } from "socket.io-client";

interface ChatStore {
  users: User[];
  isLoading: boolean;
  error: string | null;
  socket: any;
  isConnected: boolean;
  onlineUsers: Set<string>;
  userActivities: Map<string, string>;
  messages: Message[];
  selectedUser: User | null;

  fetchUsers: () => Promise<void>;
  initSocket: (userId: string) => void;
  disconnectSocket: () => void;
  sendMessage: (
    receiverId: string,
    senderId: string,
    content: string
  ) => void;
  fetchMessages: (userId: string) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
}

// ✅ SOCKET (ONLY ONE - CLEAN)
const socket = io(
  import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "https://realtime-spotify-clone-3-ehos.onrender.com",
  {
    transports: ["websocket"], // 🔥 required for Render
    withCredentials: true,
    autoConnect: false,
  }
);

export const useChatStore = create<ChatStore>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,
  socket: socket,
  isConnected: false,
  onlineUsers: new Set(),
  userActivities: new Map(),
  messages: [],
  selectedUser: null,

  setSelectedUser: (user) => set({ selectedUser: user }),

  // ✅ FETCH USERS
  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/users");
      set({ users: response.data });
    } catch (error: any) {
      set({ error: error?.response?.data?.message || "Error fetching users" });
    } finally {
      set({ isLoading: false });
    }
  },

  // ✅ INIT SOCKET
  initSocket: (userId) => {
    if (!get().isConnected) {
      socket.auth = { userId };

      socket.connect();

      socket.on("connect", () => {
        console.log("✅ Socket connected:", socket.id);
        socket.emit("user_connected", userId);
      });

      socket.on("users_online", (users: string[]) => {
        set({ onlineUsers: new Set(users) });
      });

      socket.on("activities", (activities: [string, string][]) => {
        set({ userActivities: new Map(activities) });
      });

      socket.on("user_connected", (userId: string) => {
        set((state) => ({
          onlineUsers: new Set([...state.onlineUsers, userId]),
        }));
      });

      socket.on("user_disconnected", (userId: string) => {
        set((state) => {
          const newUsers = new Set(state.onlineUsers);
          newUsers.delete(userId);
          return { onlineUsers: newUsers };
        });
      });

      socket.on("receive_message", (message: Message) => {
        set((state) => ({
          messages: [...state.messages, message],
        }));
      });

      socket.on("message_sent", (message: Message) => {
        set((state) => ({
          messages: [...state.messages, message],
        }));
      });

      socket.on("activity_updated", ({ userId, activity }) => {
        set((state) => {
          const newActivities = new Map(state.userActivities);
          newActivities.set(userId, activity);
          return { userActivities: newActivities };
        });
      });

      set({ isConnected: true });
    }
  },

  // ✅ DISCONNECT
  disconnectSocket: () => {
    if (get().isConnected) {
      socket.disconnect();
      set({ isConnected: false });
    }
  },

  // ✅ SEND MESSAGE
  sendMessage: (receiverId, senderId, content) => {
    const socket = get().socket;
    if (!socket) return;

    socket.emit("send_message", {
      receiverId,
      senderId,
      content,
    });
  },

  // ✅ FETCH MESSAGES
  fetchMessages: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/users/messages/${userId}`);
      set({ messages: response.data });
    } catch (error: any) {
      set({ error: error?.response?.data?.message || "Error fetching messages" });
    } finally {
      set({ isLoading: false });
    }
  },
}));