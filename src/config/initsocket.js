// initSocket.js
const { Server } = require("socket.io");
// const Redis = require("ioredis"); // Optional: only if scaling
// const redisAdapter = require("socket.io-redis"); // For Redis adapter if scaling

// In-memory user-to-socket map (use Redis or DB for persistence if needed)
const socketUserMap = new Map();

let io;

function initSocket(server) {
  io = new Server(server, {
    path: "/realtime",
    cors: {
      origin: "*", // Change to your frontend domain
      methods: ["GET", "POST"],
    },
  });

  // Optional: Enable Redis adapter for scale-out
  // const pubClient = new Redis();
  // const subClient = new Redis();
  // io.adapter(redisAdapter({ pubClient, subClient }));

  io.on("connection", (socket) => {
    console.log(`[Socket Connected] ID: ${socket.id}`);

    // Handle joining a company room
    socket.on("joinCompany", (companyId) => {
      socket.join(`company_${companyId}`);
      console.log(`[Joined Room] company_${companyId}`);
    });

    // Register user to track for direct messaging
    socket.on("registerUser", (userId) => {
      socketUserMap.set(userId, socket.id);
      console.log(`[User Registered] userId=${userId}, socketId=${socket.id}`);
    });

    // Handle client disconnection
    socket.on("disconnect", (reason) => {
      console.log(`[Socket Disconnected] ID: ${socket.id} | Reason: ${reason}`);

      // Remove user from the map
      for (let [userId, sId] of socketUserMap.entries()) {
        if (sId === socket.id) {
          socketUserMap.delete(userId);
          console.log(`[User Unregistered] userId=${userId}`);
          break;
        }
      }
    });

    // Handle any generic errors
    socket.on("error", (err) => {
      console.error(`[Socket Error] ID: ${socket.id}`, err);
    });
  });

  return io;
}

// Helper to emit to a company room
function emitToCompany(companyId, event, data) {
  if (!io) return;
  io.to(`company_${companyId}`).emit(event, data);
}

// Helper to emit to a specific user (if connected)
function emitToUser(userId, event, data) {
  const socketId = socketUserMap.get(userId);
  if (socketId && io.sockets.sockets.get(socketId)) {
    io.to(socketId).emit(event, data);
  } else {
    console.log(`[User Offline] userId=${userId} - Cannot emit ${event}`);
  }
}

module.exports = {
  initSocket,
  emitToCompany,
  emitToUser,
};
