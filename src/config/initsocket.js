const { Server } = require("socket.io");
const redisConfig = require("./redis");
const redis = redisConfig.redisClient;
let io;

function initSocket(server) {
  io = new Server(server, {
    path: "/realtime",
    cors: {
      origin: "*", // TODO: restrict in production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", async (socket) => {
    const socketId = socket.id;
    const userId = socket.handshake.query.userId ?? null;
    const companyId = socket.handshake.query.companyId ?? null;

    console.log(
      `[Socket Connected] ${socketId} user=${userId} company=${companyId}`
    );

    if (!userId) {
      console.warn(`❌ No userId provided. Disconnecting socket: ${socketId}`);
      socket.disconnect(true);
      return;
    }

    // Save mapping
    await redis.set(`socket:${socketId}`, userId, { EX: 60 * 60 });
    await redis.set(`user:${userId}:socket`, socketId);

    if (companyId) {
      const existingSocketId = await redis.get(
        `user:${userId}:company:${companyId}`
      );

      if (existingSocketId) {
        console.log(
          `⚠️ User ${userId} already in company:${companyId}, skipping duplicate join.`
        );
        // Replace old socketId with new one
        await redis.set(`user:${userId}:company:${companyId}`, socketId);
      } else {
        // First time join for this user+company
        socket.join(`company:${companyId}`);
        await redis.set(`user:${userId}:company:${companyId}`, socketId);
        console.log(`✅ User ${userId} joined company:${companyId}`);
      }
    }

    // Handle disconnect
    socket.on("disconnect", async () => {
      if (companyId) {
        const mappedSocketId = await redis.get(
          `user:${userId}:company:${companyId}`
        );
        if (mappedSocketId === socketId) {
          // await redis.del(`user:${userId}:company:${companyId}`);
          console.log(`🔌 User ${userId} left company:${companyId}`);
        }
      }
      await redis.del(`socket:${socketId}`);
      await redis.del(`user:${userId}:socket`);
    });

    // Handle socket errors
    socket.on("error", (error) => {
      console.error(`[Socket Error] ID: ${socketId}`, error);
    });
  });

  return io;
}

function getSocketIO() {
  if (!io) {
    throw new Error(
      "Socket.IO not initialized. Call initSocket(server) first."
    );
  }
  return io;
}

// Broadcast to all sockets in a company room
const emitToCompany = (companyId, event, payload) => {
  getSocketIO().to(`company:${companyId}`).emit(event, payload);
};

// Emit to a specific user (single-socket mapping)
async function emitToUser(userId, event, payload) {
  try {
    const socketId = await redis.get(`user:${userId}:socket`);
    console.log({ socketId, userId, payload, event });
    if (!socketId) return false;

    const targetSocket = getSocketIO().sockets.sockets.get(socketId);
    console.log({ targetSocket });
    if (!targetSocket) return false;

    console.log("send notification");
    targetSocket.emit(event, payload);
    return true;
  } catch (error) {
    console.error("Error notifying user:", error);
    return false;
  }
}

module.exports = {
  initSocket,
  emitToCompany,
  emitToUser,
};
