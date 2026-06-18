const Redis = require("ioredis");
const redis = new Redis({host: "127.0.0.1", port: 6379});
redis.on("connect", () => {
    console.log("connected to redis")
})
redis.on("error", (err) => {
    console.log("redis error", err.message)
})
module.exports = redis;
