// const puppeteer = require("puppeteer");
const { disconnect } = require("mongoose");
const CustomDriver = require("./helpers/customPage");
const { baseURL } = require("./../config/keys");

let driver;

// run this function before each test getting executed in this file
// DRY TESTS (don't repeat this code on each test)
beforeEach(async () => {
    // build custom driver instance (launches a new browser, opens a new tab, then returns a new modified proxy object)
    driver = await CustomDriver.build();

    await driver.goto(baseURL); // go to the home url
});

// run this function after each test finishes
afterEach(async () => {
    // close the browser
    await driver.close();
});

test("Get the inner text of the left brand logo", async () => {
    // get the inner text of the logo
    const logoText = await driver.$eval("a.brand-logo", (element) => element.innerText);

    // assert it to equal Blogster
    expect(logoText).toEqual("Blogster");
});

test("Login with google button redirects to google oauth", async () => {
    await driver.click('a[href="/auth/google"]'); // click on element
    const loginURL = driver.url(); // get the current page url

    // match a specific string with a regex
    expect(loginURL).toMatch(/accounts\.google\.com/);
});

// nested tests that is
describe("When user is logged in", () => {
    // runs before each test inside this describe
    beforeEach(async () => {
        await driver.login();
    });

    // run only this test and ignore other tests
    test("the logout button and my blogs buttons appear", async () => {
        // wait for my blogs and logout buttons to appear on the page
        const myBlogsEl = await driver.waitForXPath('//ul//a[@href="/blogs"]');
        const logoutEl = await driver.waitForXPath('//ul//a[@href="/auth/logout"]');

        // get the text of the elements
        const myBlogsText = await myBlogsEl.evaluate((el) => el.innerText),
            logoutText = await logoutEl.evaluate((el) => el.innerText);

        expect(myBlogsText).toEqual("My Blogs");
        expect(logoutText).toEqual("Logout");
    });

    test("My Blogs button redirects to blogs page", async () => {
        await driver.goToBlogs(); // login and navigate to my blogs page

        const currentURL = await driver.url(); // get the current url of the tab

        expect(currentURL).toEqual(`${baseURL}blogs`);
    });
});

afterAll(async () => await disconnect()); // disconnect mongodb after all tests in this file done
