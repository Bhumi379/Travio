const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");//*Cross-Origin Resource Sharing** - A security feature browsers use 
// to block suspicious requests.

const path = require("path");
require("dotenv").config();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const adminRoutes = require("./routes/adminroutes");


const connectDB = require("./config/database");
const userRoutes = require("./routes/userRoutes");
const rideRoutes = require("./routes/rideRoutes");
const rideRequestRoutes = require("./routes/rideRequestRoutes");
const chatRoutes = require("./routes/chatRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const authRoute = require("./routes/authroutes");


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5000", "http://localhost:5500"],
    credentials: true,
  },
});
const PORT = process.env.PORT || 5000;
//app.use Without it, your server can't read data from requests!
// ------------ Global Middlewares ------------
// CORS Configuration - VERY IMPORTANT
app.use(cors({
  origin: "http://localhost:5500", // Your frontend URL (Live Server port)
  credentials: true // Allow cookies
}));



app.use(express.json());// This middleware lets you read JSON from requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser()); // ADD THIS - Parses cookies from requests



// ------------ Start Server After DB Connect ------------
const startServer = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected.");

    // Register routes AFTER DB is connected
     app.use("/api/rides", rideRoutes);
    app.use("/api/ride-requests", rideRequestRoutes);
    app.use("/api/auth", authRoute);
    app.use("/api/users", userRoutes);
   
    app.use("/api/chats", chatRoutes);
    app.use("/api/reviews", reviewRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use('/api/admin', adminRoutes);

    // Serve frontend static files AFTER API routes
    app.use(express.static(path.join(__dirname, "..", "client")));
    // Main frontend
    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "..", "client", "login.html"));
    });
    app.use((req, res, next) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "..", "client", "login.html"));
  } else {
    next(); // forward API routes
  }
});
//(/) → explicitly serves login.html.

//* → ensures that any non-API URL (like /home, /profile) also loads login.html. 
// This is especially useful if you do SPA routing on the frontend.

    // Global error handler
    app.use((err, req, res, next) => {
      console.error(err);
      res.status(500).json({ 
        success: false, 
        message: "Internal Server Error" 
      });
    });

    // ── Socket.IO Chat ──
    io.on("connection", (socket) => {
      console.log("🔌 Socket connected:", socket.id);

      socket.on("join-chat", (chatId) => {
        socket.join(chatId);
        console.log(`Socket ${socket.id} joined chat ${chatId}`);
      });

      socket.on("leave-chat", (chatId) => {
        socket.leave(chatId);
      });

      socket.on("send-message", async ({ chatId, senderId, encryptedMessage }) => {
        try {
          const Chat = require("./models/Chat");
          const chat = await Chat.findById(chatId);
          if (!chat) return;

          chat.messages = chat.messages || [];
          chat.messages.push({ senderId, encryptedMessage });
          await chat.save();

          const newMsg = chat.messages[chat.messages.length - 1];
          io.to(chatId).emit("new-message", {
            chatId,
            message: {
              _id: newMsg._id,
              senderId: newMsg.senderId,
              encryptedMessage: newMsg.encryptedMessage,
              timestamp: newMsg.timestamp,
            },
          });
        } catch (err) {
          console.error("Socket send-message error:", err.message);
        }
      });

      socket.on("disconnect", () => {
        console.log("🔌 Socket disconnected:", socket.id);
      });
    });

    // SINGLE server.listen (not app.listen — needed for Socket.IO)
    server.listen(PORT, () => {
     console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌐 Frontend: http://localhost:${PORT}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket ready`);
    });

  } catch (err) {
    console.error("❌ Error starting server:", err);
  }
};

startServer();