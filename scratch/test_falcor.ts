import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';
import fs from 'fs';

const stealthPlugin = stealth();
chromium.use(stealthPlugin);
dotenv.config();

const STATE_FILE = 'netflix_playwright_state.json';

async function testFalcor() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: fs.existsSync(STATE_FILE) ? STATE_FILE : undefined,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  const url = 'https://www.netflix.com/title/81708625';
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  const cache = await page.evaluate(() => {
    return window.netflix?.falcorCache || 'NOT FOUND';
  });

  console.log('Falcor Cache Keys:', Object.keys(cache).slice(0, 20));
  
  // Search for cast and genres in the cache
  const jsonString = JSON.stringify(cache);
  console.log('Includes "Chioma Chukwuka":', jsonString.includes('Chioma Chukwuka'));
  console.log('Includes "Nollywood":', jsonString.includes('Nollywood'));

  await browser.close();
}

testFalcor();
