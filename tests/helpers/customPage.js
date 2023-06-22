const puppeteer = require("puppeteer");
const sessionFactory = require("./../factories/sessionFactory");
const userFactory = require("./../factories/userFactory");

class CustomDriver {
    static async build() {
        // launch a new browser
        const browser = await puppeteer.launch({
            headless: "new",
            // headless: false,
            defaultViewport: null,
            slowMo: 100, // slow down all operations for 300ms to debug
            executablePath: process.env[`PUPPETEER_EXECUTABLE_PATH`] || null, // set the default executable path already downloaded
        });

        // create a new tab
        const page = await browser.newPage();

        // make a new instance of this class, and pass the created page as constructor argument
        const customDriver = new CustomDriver(page);

        // return proxy object
        return new Proxy(customDriver, {
            get: function (target, property, receiver) {
                // if called property exists in the custom driver class (which we implement by ourself), return it
                if (target[property]) {
                    return target[property];
                }

                // if called property exists in browser class and it's an instance of a function
                let value = browser[property];

                if (value && value instanceof Function) {
                    // return a function that takes any count of arguments
                    return function (...args) {
                        // take the implementation of the original function and call it with apply passing this as the browser instance
                        return value.apply(this === receiver ? browser : this, args);
                    };
                }

                value = page[property];

                // if the
                if (value && value instanceof Function) {
                    return function (...args) {
                        return value.apply(this === receiver ? page : this, args);
                    };
                }
                return page[property] || browser[property];
            },
        });
    }

    constructor(page) {
        this.page = page;
    }

    async login() {
        const user = await userFactory();

        const { session, signature } = sessionFactory(user);

        // set session key as cookie
        await this.setCookie({
            name: "session",
            value: session,
        });

        // set session signature as cookie
        await this.setCookie({
            name: "session.sig",
            value: signature,
        });

        // reload the current tab
        await this.reload();
    }
}

module.exports = CustomDriver;
