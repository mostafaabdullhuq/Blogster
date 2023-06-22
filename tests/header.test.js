// const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const CustomDriver = require("./helpers/customPage");

let driver;

// run this function before each test getting executed in this file
// DRY TESTS (don't repeat this code on each test)
beforeEach(async () => {
    // launch a new browser instance
    // browser = await puppeteer.launch({
    //     // headless: "new",
    //     headless: false,
    //     defaultViewport: null,
    //     slowMo: 100, // slow down all operations for 300ms to debug
    //     executablePath: process.env[`PUPPETEER_EXECUTABLE_PATH`] || null, // set the default executable path already downloaded
    // });
    // by default, when creating a new browser instance, a new tab (page) is created automatically for this browser

    driver = await CustomDriver.build();

    // create a new tab in the opened browser
    // (it's not required to call it, but it's for best practice to ensure that we are indeed work with a new tab)
    // page = await browser.newPage();
    await driver.goto("http://localhost:3000/"); // go to this url
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

// run only this test and ignore other tests
test("When user is logged in , the logout button and my blogs buttons appear", async () => {
    // const customPage = CustomPage.build();

    await driver.login();

    // wait for my blogs and logout buttons to appear on the page
    const myBlogsEl = await driver.waitForXPath('//ul//a[@href="/blogs"]');
    const logoutEl = await driver.waitForXPath('//ul//a[@href="/auth/logout"]');

    // get the text of the elements
    const myBlogsText = await myBlogsEl.evaluate((el) => el.innerText),
        logoutText = await logoutEl.evaluate((el) => el.innerText);

    expect(myBlogsText).toEqual("My Blogs");
    expect(logoutText).toEqual("Logout");
}, 10000); // set 10sec timeout, default is 5sec

afterAll(async () => await mongoose.disconnect());
