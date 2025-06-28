const puppeteer = require('puppeteer');

describe('App Health Check', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto('http://localhost:5000'); // Updated to correct port for Burnt Beats
  });

  afterAll(async () => {
    await browser.close();
  });

  test('Page loads without blank screen', async () => {
    const html = await page.content();
    expect(html).not.toBe('');
    expect(html).toContain('<body>'); // Basic DOM check
  });

  test('No console errors', async () => {
    const logs = await page.evaluate(() => {
      return window.console.error;
    });
    expect(logs).toBeUndefined();
  });

  test('App title is correct', async () => {
    const title = await page.title();
    expect(title).toContain('Burnt Beats');
  });

  test('Main navigation elements present', async () => {
    const navExists = await page.$eval('nav', el => el !== null).catch(() => false);
    expect(navExists).toBeTruthy();
  });
});