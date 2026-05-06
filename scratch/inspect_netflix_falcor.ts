import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';
import fs from 'fs';

const stealthPlugin = stealth();
chromium.use(stealthPlugin);
dotenv.config();

const STATE_FILE = 'netflix_playwright_state.json';

async function handleProfileSelection(page) {
  try {
    const profileSelectors = ['a[data-uia="profile-link"]', '.profile-link', '.profile-name'];
    await page.waitForTimeout(2000);
    let profileEl = null;
    for (const selector of profileSelectors) {
      profileEl = await page.$(selector).catch(() => null);
      if (profileEl) break;
    }
    if (profileEl) {
      await profileEl.click({ force: true });
      await page.waitForURL(url => url.includes('/browse'), { timeout: 30000 });
      return true;
    }
  } catch (e) {}
  return false;
}

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: fs.existsSync(STATE_FILE) ? STATE_FILE : undefined,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  const url = 'https://www.netflix.com/title/81708625'; // The Black Book
  console.log(`🔍 Inspecting Falcor Cache for: ${url}`);
  
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  if (page.url().includes('/ProfilesGate') || page.url().includes('/profiles')) {
    console.log('👤 Profile gate detected, handling...');
    await handleProfileSelection(page);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  await page.waitForTimeout(5000); // Give it time to populate cache
  
  const cacheKeys = await page.evaluate(() => {
    const cache = (window as any).netflix?.falcorCache || {};
    return Object.keys(cache);
  });
  
  console.log('📦 Top-level cache keys:', cacheKeys);

  const videoData = await page.evaluate(() => {
    const cache = (window as any).netflix?.falcorCache || {};
    // Try to find the current video ID in the cache
    const url = window.location.href;
    const match = url.match(/\/title\/(\d+)/);
    if (!match) return { error: 'No video ID in URL' };
    const videoId = match[1];
    
    // Scan the cache for this ID
    const results: any = {};
    
    // Often it's under videos[videoId]
    if (cache.videos && cache.videos[videoId]) {
        results.videos_entry = cache.videos[videoId];
    }
    
    // Or just at the top level sometimes or nested in weird paths
    // Let's just look for any key that contains the videoId
    for (const key in cache) {
        if (key.includes(videoId)) {
            results[key] = cache[key];
        }
    }
    
    return results;
  });

  console.log('📊 Video Data Found:', JSON.stringify(videoData, null, 2));
  
  // Also check "about" section labels specifically
  const labels = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.label, .item-label, .about-item-label')).map(l => ({
        label: l.textContent?.trim(),
        content: l.nextElementSibling?.textContent?.trim() || l.parentElement?.textContent?.trim()
    }));
  });
  console.log('🏷️ Labels Found:', labels);

  await browser.close();
}

test();
