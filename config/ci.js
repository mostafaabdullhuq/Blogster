const dotenv = require("dotenv");
const ENV = dotenv.config().parsed;

module.exports = {
    googleClientID: "70265989829-0t7m7ce5crs6scqd3t0t6g7pv83ncaii.apps.googleusercontent.com",
    googleClientSecret: "8mkniDQOqacXtlRD3gA4n2az",
    mongoURI: ENV.MONGODB_URI,
    cookieKey: "123123123",
    baseURL: "http://localhost:3000/",
    apiPort: 3000,
    redisURL: "redis://127.0.0.1:6379",
};
