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

  const url = 'https://www.netflix.com/title/81708625'; // Sisi London
  console.log(`🔍 Testing metadata extraction for: ${url}`);
  
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  if (page.url().includes('/ProfilesGate') || page.url().includes('/profiles')) {
    console.log('👤 Profile gate detected, handling...');
    await handleProfileSelection(page);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  await page.waitForTimeout(3000);
  
  const rawData = await page.evaluate(`(() => {
    const videoId = window.location.href.match(/\/title\/(\d+)/)?.[1];
    const cache = window.netflix?.falcorCache || {};
    const videoData = videoId ? (cache.videos?.[videoId] || {}) : {};
    
    const getFromLabels = (labelName) => {
      const labels = Array.from(document.querySelectorAll('.label, .item-label, .about-item-label, [data-uia$="-label"]'));
      for (const l of labels) {
        const text = l.textContent?.toLowerCase() || '';
        if (text.includes(labelName.toLowerCase())) {
          const container = l.closest('.about-item, .more-details-item, .item-container, .previewModal--about');
          const contentEl = container?.querySelector('.content, .about-item-content, .item-text, [data-uia$="-content"]');
          if (contentEl) return contentEl.textContent?.split(',').map(s => s.trim()).filter(Boolean);
          if (l.nextElementSibling) return l.nextElementSibling.textContent?.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      return null;
    };

    let synopsis = document.querySelector('[data-uia="video-metadata--synopsis"], [data-uia="video-description"], .description-text')?.textContent?.trim() || '';
    let cast = Array.from(document.querySelectorAll('.about-item[data-uia="about-item-cast"] .about-item-content, .item-cast'))
                    .map(el => el.textContent?.trim().split(',')).flat().map(s => s?.trim()).filter(Boolean);
    let genres = Array.from(document.querySelectorAll('.about-item[data-uia="about-item-genre"] .about-item-content, .item-genres'))
                      .map(el => el.textContent?.trim().split(',')).flat().map(s => s?.trim()).filter(Boolean);
    
    if (cast.length === 0) cast = getFromLabels('Cast') || [];
    if (genres.length === 0) genres = getFromLabels('Genres') || getFromLabels('Genre') || [];

    if (videoData) {
      if (!synopsis) synopsis = videoData.synopsis?.value || videoData.synopsis || '';
      const videoCacheStr = JSON.stringify(videoData);
      if (genres.length === 0) {
        const genreKeywords = ['Nollywood', 'Nigerian', 'African', 'South African', 'Ghanaian', 'Kenyan', 'Senegalese', 'Egyptian', 'Cameroonian'];
        genres = genreKeywords.filter(k => videoCacheStr.includes(k));
      }
    }

    const isAfrican = genres.some(g => 
      /Nollywood|Nigerian|African|South African|Ghanaian|Kenyan|Senegalese|Egyptian|Cameroonian|Yoruba|Hausa|Igbo/i.test(g)
    ) || /Nollywood|Nigerian|African/i.test(JSON.stringify(videoData));

    const yearEl = document.querySelector('[data-uia="year"], [data-uia="video-year"], .year, .release-year');
    const runtimeEl = document.querySelector('[data-uia="duration"], [data-uia="video-runtime"], .duration');
    const detailTitleEl = document.querySelector('[data-uia="video-title"], .title-title, h1');
    
    return {
      title: detailTitleEl?.textContent?.trim() || null,
      synopsis: synopsis || '',
      year: yearEl?.textContent?.trim() || videoData.releaseYear?.value || videoData.releaseYear || null,
      runtimeStr: runtimeEl?.textContent?.trim() || (videoData.runtime?.value ? (Math.floor(videoData.runtime.value / 60) + 'm') : null),
      cast: Array.from(new Set(cast)).slice(0, 15),
      genres: Array.from(new Set(genres)),
      isAfrican
    };
  })()`);

  console.log('📊 Result:', JSON.stringify(rawData, null, 2));
  await browser.close();
}

test();
