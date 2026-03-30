import { Server } from "socket.io";
import { Message } from "../models/message.model.js";

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "https://realtime-spotify-clone-n68apnbia-padmaja-chaures-projects.vercel.app"
      ],
      credentials: true,
    },
  });

  const userSockets = new Map();
  const userActivities = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("user_connected", (userId) => {
      userSockets.set(userId, socket.id);
      userActivities.set(userId, "Idle");

      io.emit("user_connected", userId);
      socket.emit("users_online", Array.from(userSockets.keys()));
      io.emit("activities", Array.from(userActivities.entries()));
    });

    socket.on("send_message", async ({ senderId, receiverId, content }) => {
      try {
        const message = await Message.create({
          senderId,
          receiverId,
          content,
        });

        const receiverSocketId = userSockets.get(receiverId);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", message);
        }

        socket.emit("message_sent", message);
      } catch (err) {
        console.log(err);
      }
    });

    socket.on("disconnect", () => {
      let disconnectedUser;

      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          disconnectedUser = userId;
          userSockets.delete(userId);
          userActivities.delete(userId);
          break;
        }
      }

      if (disconnectedUser) {
        io.emit("user_disconnected", disconnectedUser);
      }
    });
  });

  return io;
};