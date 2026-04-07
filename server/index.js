const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorMiddleware");
const socketHandler = require("./socket/socketHandler");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// ✅ Allowed origins (local + deployed frontend)
const allowedOrigins = [
  "http://localhost:3000",
  process.env.CLIENT_URL
];

// ✅ Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
});

// ✅ CORS middleware (Express)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/user"));
app.use("/api/chats", require("./routes/chat"));
app.use("/api/messages", require("./routes/message"));

// Health check
app.get("/", (req, res) => res.json({ message: "ChatApp API Running 🚀" }));

// Error middleware (must be last)
app.use(errorHandler);

// Socket handler
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
