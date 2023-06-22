const mongoose = require("mongoose");
const { redisClient } = require("./redis");

// save reference to the old exec function
const __exec = mongoose.Query.prototype.exec;

// adding a new function to the mongoose query prototype that enables cache with redis for the query instance
mongoose.Query.prototype.cache = function (options = {}) {
    this.useCache = true; // add property to the query instance
    this.cacheExpire = +options.expire || null; // get the expiration seconds
    this.mainHashKey = JSON.stringify(options.key) || "default"; // get the main hash key
    return this; // returns the instance (enable this cache() function to be chainable)
};

// modifies the default exec function in mongoose
mongoose.Query.prototype.exec = async function () {
    // if cache options is set to false, then use the database
    if (!this.useCache) {
        return __exec.apply(this, arguments);
    }

    // if cache is enabled for this query

    // create unique key for storing the value of the query
    // key combines the query with the collection name as a json string
    const queryKey = JSON.stringify({
        ...this.getQuery(),
        collection: this.mongooseCollection.name,
    });

    // check if the query already cached
    const cachedValue = await redisClient.hget(this.mainHashKey, queryKey);

    // if query is already cached
    if (cachedValue) {
        // parse the json to js object
        const parsedValue = JSON.parse(cachedValue);

        // if the query result is array of objects, iterate over each object and convert it to model instance then return
        if (Array.isArray(parsedValue)) {
            return parsedValue.map((eachDoc) => new this.model(eachDoc));
        }

        // if the query result is single object convert it to model instance and return it
        return new this.model(parsedValue);
    }

    // if query is not cached, get the result from the database
    const queryResult = await __exec.apply(this, arguments);
    // cache the result to redis and return the result
    redisClient.hset(this.mainHashKey, queryKey, JSON.stringify(queryResult), "EX", this.cacheExpire === null ? 10e10 : this.cacheExpire);
    return queryResult;
};

// clears a specific key content from the cache storage
exports.clearCache = function (key) {
    redisClient.del(JSON.stringify(key));
};
