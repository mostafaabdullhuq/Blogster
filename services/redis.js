const { createClient } = require("redis");
const { promisify } = require("util");
const keys = require("./../config/keys");
const redisClient = createClient(keys.redisURL);

// convert normal functions that takes a callback function to a function that returns a promise
redisClient.get = promisify(redisClient.get);
redisClient.hget = promisify(redisClient.hget);
redisClient.set = promisify(redisClient.set);
redisClient.hset = promisify(redisClient.hset);

exports.redisClient = redisClient;
