const { createClient } = require("redis");
const { ENV_VARIABLE } = require("../constants/env");
const { logger } = require("./appConfig");

logger.info("Redis connection started");

class RedisInitWithQueues {
  constructor() {
    if (RedisInitWithQueues.instance) return RedisInitWithQueues.instance;

    logger.info("Initializing AppConfig...");
    this.redisConnection = {
      host: ENV_VARIABLE.REDIS_HOST || "redis",
      port: ENV_VARIABLE.REDIS_PORT || 6379,
      password: ENV_VARIABLE.REDIS_PASSWORD || "",
    };

    logger.info(
      `Redis connection details: ${JSON.stringify(this.redisConnection)}`
    );
    logger.info("info", "Connecting to Redis...");
    this.redisClient = createClient({
      socket: {
        host: ENV_VARIABLE.REDIS_HOST || "localhost",
        port: ENV_VARIABLE.REDIS_PORT || 16379,
      },
      password: "my_master_password",
    });

    this.redisClient
      .connect()
      .then(() => logger.info("✅ Redis client connected"))
      .catch((err) => logger.error("❌ Redis client connection failed:", err));

    logger.info("Redis client created, connecting...");

    // for pub/sub
    logger.info("Initializing pub/sub client...");
    this.publish_subscribe_client = createClient({
      socket: {
        host: ENV_VARIABLE.REDIS_HOST || "localhost",
        port: ENV_VARIABLE.REDIS_PORT || 16379,
      },
      password: "my_master_password",
    });

    this.publish_subscribe_client
      .connect()
      .then(() => logger.info("✅ Redis pub/sub connected"))
      .catch((err) => logger.error("❌ Redis pub/sub connection failed:", err));

    logger.info("Redis pu/sub client connected...");

    this.queues = {
      //   matchMaking: new Queue(workerList.MATCHMAKING, {
      //     connection: this.redisConnection,
      //   }),
    };

    RedisInitWithQueues.instance = this;
  }

  getRedisClient() {
    return this.redisClient;
  }

  getRedisPublishSubscribeClient() {
    return this.publish_subscribe_client;
  }

  getQueues() {
    return this.queues;
  }

  getRedisConnection() {
    return this.redisConnection;
  }
}

const redisConfig = new RedisInitWithQueues();
module.exports = redisConfig;
