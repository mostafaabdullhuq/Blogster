jest.setTimeout(60000); // set default timeout for jest (1 min for each test)

require("./../models/User");
const keys = require("./../config/keys");
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
