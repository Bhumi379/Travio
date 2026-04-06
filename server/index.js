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
const contentRoutes = require("./routes/contentRoutes");
const multer = require("multer");
const protect = require("./middleware/authmiddleware");
const chatUpload = require("./middleware/chatUpload");
const { uploadChatMedia } = require("./controllers/chatController");


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5000", "http://localhost:5500"],
    credentials: true,
  },
});
app.set("io", io);
const PORT = process.env.PORT || 5000;
//app.use Without it, your server can't read data from requests!
// ------------ Global Middlewares ------------
// CORS Configuration - VERY IMPORTANT
app.use(cors({
  origin: ["http://localhost:5500", "http://localhost:5000"],
  credentials: true,
}));



app.use(express.json());// This middleware lets you read JSON from requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser()); // ADD THIS - Parses cookies from requests

// Lightweight health endpoint for monitoring and integration tests.
app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Backend is healthy" });
});



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

    // Register on the app (full path) before mounting /api/chats so POST .../media always matches.
    // Nested router + Express 5 path handling could otherwise fall through and return HTML for this route.
    app.post(
      "/api/chats/:chatId/media",
      protect,
      chatUpload.single("file"),
      uploadChatMedia
    );
    app.use("/api/chats", chatRoutes);
    app.use("/api/reviews", reviewRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/content', contentRoutes);
    app.use("/uploads", express.static(path.join(__dirname, "uploads")));

    // Serve frontend static files AFTER API routes
    app.use(express.static(path.join(__dirname, "..", "client")));
    // Main frontend
    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "..", "client", "login.html"));
    });
    // SPA fallback: use originalUrl — req.path can be stripped after mounted routers,
    // so /api/* could wrongly receive login.html and break fetch().json().
    app.use((req, res) => {
      const pathname = (req.originalUrl || req.url || "").split("?")[0];
      if (pathname.startsWith("/api")) {
        return res
          .status(404)
          .json({ success: false, message: "API route not found" });
      }
      res.sendFile(path.join(__dirname, "..", "client", "login.html"));
    });
//(/) → explicitly serves login.html.

//* → ensures that any non-API URL (like /home, /profile) also loads login.html. 
// This is especially useful if you do SPA routing on the frontend.

    // Global error handler (multer must receive real Express `next` — do not wrap .single() in a fake callback)
    app.use((err, req, res, next) => {
      if (err instanceof multer.MulterError) {
        const msg =
          err.code === "LIMIT_FILE_SIZE"
            ? "File too large (max 12 MB)"
            : err.message || "Upload failed";
        return res.status(400).json({ success: false, message: msg });
      }
      if (err && err.message === "Unsupported file type for chat") {
        return res.status(400).json({ success: false, message: err.message });
      }
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
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

      socket.on(
        "send-message",
        async ({
          chatId,
          senderId,
          encryptedMessage,
          messageType,
          mediaUrl,
          fileName,
          mimeType,
        }) => {
          try {
            const Chat = require("./models/Chat");
            const chat = await Chat.findById(chatId);
            if (!chat) return;
            if (!chat.participants.map(String).includes(String(senderId))) return;

            const type = messageType === "image" || messageType === "file" ? messageType : "text";
            const payload = {
              senderId,
              encryptedMessage: String(encryptedMessage || "").trim(),
              messageType: type,
            };
            if (type !== "text") {
              payload.mediaUrl = mediaUrl || null;
              payload.fileName = fileName || "";
              payload.mimeType = mimeType || "";
            }

            chat.messages = chat.messages || [];
            chat.messages.push(payload);
            await chat.save();

            const newMsg = chat.messages[chat.messages.length - 1];
            io.to(chatId).emit("new-message", {
              chatId,
              message: {
                _id: newMsg._id,
                senderId: newMsg.senderId,
                encryptedMessage: newMsg.encryptedMessage,
                messageType: newMsg.messageType || "text",
                mediaUrl: newMsg.mediaUrl || null,
                fileName: newMsg.fileName || "",
                mimeType: newMsg.mimeType || "",
                timestamp: newMsg.timestamp,
                readBy: newMsg.readBy || [],
              },
            });
          } catch (err) {
            console.error("Socket send-message error:", err.message);
          }
        }
      );

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

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };