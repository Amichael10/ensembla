import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';
import fs from 'fs';

const stealthPlugin = stealth();
chromium.use(stealthPlugin);
dotenv.config();

const STATE_FILE = 'netflix_playwright_state.json';

async function testFalcorExtraction() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: fs.existsSync(STATE_FILE) ? STATE_FILE : undefined,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  const url = 'https://www.netflix.com/title/81708625';
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  const result = await page.evaluate(() => {
    const cache = window.netflix?.falcorCache;
    if (!cache) return { error: 'No Falcor Cache' };
    
    // Find the video entry. Usually under 'videos' key.
    const videoId = window.location.pathname.split('/').pop();
    const videoData = cache.videos?.[videoId];
    
    if (!videoData) {
       // Fallback: search all videos
       return { error: `Video ${videoId} not found in cache`, availableIds: Object.keys(cache.videos || {}) };
    }

    // Extraction helper
    const getList = (ref) => {
      if (!ref || !ref.value) return [];
      // If it's a list of references, we need to resolve them
      // But Falcor cache often has the data nearby
      return []; 
    };

    return {
      title: videoData.title?.value,
      synopsis: videoData.regularSynopsis?.value || videoData.synopsis?.value,
      releaseYear: videoData.releaseYear?.value,
      // Cast and Genres are usually references
      raw: videoData
    };
  });

  console.log('Extraction Result:', JSON.stringify(result, null, 2));
  await browser.close();
}

testFalcorExtraction();
