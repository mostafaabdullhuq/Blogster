const { createClient } = require("redis");
const { promisify } = require("util");

const redisClient = createClient("redis://127.0.0.1:6379");

// convert normal functions that takes a callback function to a function that returns a promise
redisClient.get = promisify(redisClient.get);
redisClient.hget = promisify(redisClient.hget);
redisClient.set = promisify(redisClient.set);
redisClient.hset = promisify(redisClient.hset);

exports.redisClient = redisClient;
