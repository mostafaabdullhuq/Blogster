// const puppeteer = require("puppeteer");
const { disconnect } = require("mongoose");
const CustomDriver = require("./helpers/customPage");
const { baseURL } = require("./../config/keys");
const { faker } = require("@faker-js/faker");

let driver;
const FAKE_TITLE = faker.lorem.sentence({ min: 2, max: 4 }), // generate random sentence of 2 to 4 words
    FAKE_CONTENT = faker.lorem.paragraph(1); // generate random paragraph of 1 sentence

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

describe("When user is logged in", () => {
    beforeEach(async () => {
        await driver.login(); // login to the fake account
    });

    describe("And when new blog (+) anchor is clicked", () => {
        beforeEach(async () => {
            await driver.goToBlogs(); // navigate to my blogs page
            const newBlogEl = await driver.waitForXPath('//a[@href="/blogs/new"]'); // wait for (+) anchor to appear
            await newBlogEl.click(); // click on the anchor
        });

        test("New blog form is rendered correctly", async () => {
            const titleInputVal = await driver.getXpathContent('//input[@name="title"]'); // form title input
            const contentInputVal = await driver.getXpathContent('//input[@name="content"]'); // form content input
            const nextBtnText = await driver.getXpathContent('//button[@type="submit"]'); // form next (submit) button
            const cancelBtnText = await driver.getXpathContent('//form//a[@href="/blogs"]'); // cancel form button
            const currentURL = await driver.url();

            expect(currentURL).toEqual(`${baseURL}blogs/new`);
            expect(titleInputVal).toEqual("");
            expect(contentInputVal).toEqual("");
            expect(nextBtnText).toEqual("NEXT\ndone");
            expect(cancelBtnText).toEqual("CANCEL");
        });

        test("Submitting form without values shows errors", async () => {
            await driver.click('button[type="submit"]');
            const wrongValueText = await driver.getXpathContent('//div[@class="title"]//div[@class="red-text"]');
            const wrongContentText = await driver.getXpathContent('//div[@class="content"]//div[@class="red-text"]');
            expect(wrongValueText).toEqual("You must provide a value");
            expect(wrongContentText).toEqual("You must provide a value");
        });

        test("clicking cancel button redirects back to blogs page", async () => {
            await driver.click('a.red[href="/blogs"]');
            const newBlogAnchorText = await driver.getXpathContent('//a[@href="/blogs/new"]');
            const url = await driver.url();
            expect(url).toEqual(`${baseURL}blogs`);
            expect(newBlogAnchorText).toEqual("add");
        });

        describe("And when user enters valid data in form and submits it", () => {
            beforeEach(async () => {
                await driver.type('input[name="title"]', FAKE_TITLE, { delay: 0 });
                await driver.type('input[name="content"]', FAKE_CONTENT, { delay: 0 });
                await driver.click('button[type="submit"]');
            });

            test("Confirm entries page renders", async () => {
                const formHeadingText = await driver.getXpathContent("//form/h5");
                expect(formHeadingText).toEqual("Please confirm your entries");
            });

            test("Save blog button redirects to blogs page and the blog created successfully", async () => {
                await driver.click("button.green");
                const blogTitleText = await driver.getXpathContent('//div[@class="card-content"]//span[@class="card-title"]');
                const blogContentText = await driver.getXpathContent('//div[@class="card-content"]//p');
                const url = await driver.url();

                expect(blogTitleText).toEqual(FAKE_TITLE);
                expect(blogContentText).toEqual(FAKE_CONTENT);
                expect(url).toBe(`${baseURL}blogs`);
            });
        });
    });
});

describe("When user is not logged in", () => {
    test("Cannot create a new blog via api", async () => {
        // evaluate is used to execute code in the browser, and return the result
        const apiResponse = await driver.postApi("/api/blogs", {
            title: FAKE_TITLE,
            content: FAKE_CONTENT,
        });

        expect(apiResponse).toEqual({ error: "You must log in!" });
    });

    test("Cannot retrieve blogs list from api", async () => {
        const apiResponse = await driver.getApi("/api/blogs");

        expect(apiResponse).toEqual({ error: "You must log in!" });
    });

    test("Cannot retrieve a single blog from api", async () => {
        // evaluate is used to execute code in the browser, and return the result
        const apiResponse = await driver.getApi("/api/blogs/123456789");

        expect(apiResponse).toEqual({ error: "You must log in!" });
    });
});

afterAll(async () => await disconnect()); // disconnect mongodb after all tests in this file done
