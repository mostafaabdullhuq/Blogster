jest.setTimeout(30000); // set default timeout for jest

require("./../models/User");
const keys = require("./../config/keys");
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
