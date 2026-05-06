import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';
import fs from 'fs';

const stealthPlugin = stealth();
chromium.use(stealthPlugin);
dotenv.config();

const NETFLIX_URL = 'https://www.netflix.com/browse/genre/1138254?bc=34399';
const STATE_FILE = 'netflix_playwright_state.json';

async function testDiscovery() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: fs.existsSync(STATE_FILE) ? STATE_FILE : undefined,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log(`Navigating to ${NETFLIX_URL}...`);
  await page.goto(NETFLIX_URL, { waitUntil: 'networkidle', timeout: 60000 });

  // Handle profile selection if needed
  if (page.url().includes('/ProfilesGate') || page.url().includes('/profiles')) {
     console.log('Profile selection detected. Taking screenshot and exiting (please run with auth first).');
     await page.screenshot({ path: 'scratch/discovery_profile.png' });
     await browser.close();
     return;
  }

  console.log('Scrolling...');
  await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
  await page.waitForTimeout(5000);

  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.lolomoRow, .rowContainer'));
    return rows.map(row => {
      const title = row.querySelector('.rowTitle, .row-header-title, h2')?.textContent || 'NO TITLE';
      const links = Array.from(row.querySelectorAll('a')).map(a => a.getAttribute('href')).filter(h => h && h.includes('/title/'));
      return { title, linkCount: links.length };
    });
  });

  console.log('Found Rows:', data);
  await page.screenshot({ path: 'scratch/discovery_result.png' });
  await browser.close();
}

testDiscovery();
