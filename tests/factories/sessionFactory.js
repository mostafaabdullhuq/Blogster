const { Buffer } = require("safe-buffer");
const Keygrip = require("keygrip");
const { cookieKey } = require("./../../config/keys");

// an instance that can sign and verify signatures
const SigGenerator = new Keygrip([cookieKey]);

// a function that takes mongoose user instance, and creates a session and signature keys for him, then returns them
module.exports = (user) => {
    // create fake session js object that contain a valid user id from our database
    const sessionObject = {
        passport: {
            user: user._id.toString(),
        },
    };

    // convert session object to base64 encoded
    const session = Buffer.from(JSON.stringify(sessionObject)).toString("base64");

    // create instance of keygrip that used to sign signature for session key

    // create signature session key
    const signature = SigGenerator.sign(`session=${session}`);

    return { session, signature };
};
