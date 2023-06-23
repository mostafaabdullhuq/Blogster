const puppeteer = require("puppeteer");
const sessionFactory = require("./../factories/sessionFactory");
const userFactory = require("./../factories/userFactory");
const { baseURL } = require("./../../config/keys");

class CustomDriver {
    static async build() {
        // launch a new browser
        const browser = await puppeteer.launch({
            headless: "new", // new headless mode on chromium
            // headless: false, // show the browser
            defaultViewport: null,
            slowMo: 100, // slow down all operations for 100ms to easily debug
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, // set the default executable path already downloaded
            args: ["--no-sandbox"],
        });

        // create a new tab
        const page = await browser.newPage();

        // make a new instance of this class, and pass the created page as constructor argument
        const customDriver = new CustomDriver();

        // return proxy object
        return new Proxy(customDriver, {
            get: function (target, property, receiver) {
                /*
                    we use this approach instead of return page[property] || browser[property] || target[property]
                    because of the private methods and attributes problem in javascript when trying to use proxies!
                */

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
                return browser[property] || page[property];
            },
        });
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

        await this.goto(`${baseURL}blogs`); // redirect to the blogs page
    }

    async getApi(path) {
        return this.evaluate(async (_path) => {
            const response = await fetch(_path, {
                method: "GET",
                // to send cookies with the request
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.json();
        }, path);
    }

    async postApi(path, data) {
        // evaluate converts the passed function to string and give it to
        // the chromium browser to execute it, then returns the result of
        // the execution

        // to pass arguments to the function inside the evaluate
        // we can pass them after the function

        return this.evaluate(
            async (_path, _data) => {
                const response = await fetch(_path, {
                    method: "POST",
                    // to send cookies with the request
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    // json data in request.body
                    body: JSON.stringify(_data),
                });
                return response.json();
            },
            path, // arguments passed to the function inside evaluate
            data
        );
    }

    // clicks on my blogs anchor on the header, and waits until the blogs page loads
    async goToBlogs() {
        const myBlogsEl = await this.waitForXPath('//ul//a[@href="/blogs"]');
        await myBlogsEl.click();
        await this.waitForNavigation(); // wait until the page finish loading
    }

    // takes an xpath expression, wait until the element with the given xpath is found, then extract it's inner text and returns it
    async getXpathContent(xpath) {
        const element = await this.waitForXPath(xpath);
        return element.evaluate((el) => el.innerText || el.value);
    }
}

module.exports = CustomDriver;
