import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import { cleanTitle } from '../api/_lib/yt_service.js';

// Load stealth plugin
const stealthPlugin = stealth();
chromium.use(stealthPlugin);

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const NETFLIX_URL = 'https://www.netflix.com/browse/genre/1138254';
const LOGIN_URL = 'https://www.netflix.com/login';

async function login(page) {
  const email = process.env.NETFLIX_EMAIL;
  const password = process.env.NETFLIX_PASSWORD;

  if (!email || !password) {
    console.log('⚠️ NETFLIX_EMAIL or NETFLIX_PASSWORD not set. Attempting to proceed without login...');
    return;
  }

  console.log('🔐 Attempting to login to Netflix...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle' });

  try {
    await page.fill('input[name="userLoginId"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('✅ Login successful (presumably)');
  } catch (e) {
    console.error('❌ Login failed:', e.message);
  }
}

async function scrapeNetflix() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  await login(page);

  console.log(`🚀 Navigating to: ${NETFLIX_URL}`);
  await page.goto(NETFLIX_URL, { waitUntil: 'networkidle' });

  // Handle profile selection if it appears
  try {
    const profileSelector = '.profile-link';
    if (await page.isVisible(profileSelector)) {
      console.log('👤 Selecting first profile...');
      await page.click(profileSelector);
      await page.waitForNavigation({ waitUntil: 'networkidle' });
    }
  } catch (e) {}

  console.log('📜 Scrolling to load all Nollywood titles...');
  // Infinite scroll
  let lastHeight = await page.evaluate('document.body.scrollHeight');
  for (let i = 0; i < 10; i++) {
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await page.waitForTimeout(2000);
    let newHeight = await page.evaluate('document.body.scrollHeight');
    if (newHeight === lastHeight) break;
    lastHeight = newHeight;
  }

  console.log('🕵️ Extracting titles and metadata...');
  const movies = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.slider-item, .title-card'));
    return items.map(item => {
      const linkEl = item.querySelector('a');
      const imgEl = item.querySelector('img');
      const titleEl = item.querySelector('.fallback-text');
      
      // Netflix watch link looks like /watch/81234567
      const href = linkEl?.getAttribute('href') || '';
      const watchIdMatch = href.match(/\/watch\/(\d+)/);
      const watchId = watchIdMatch ? watchIdMatch[1] : null;
      
      return {
        title: titleEl?.textContent?.trim() || imgEl?.getAttribute('alt') || 'Unknown',
        netflix_id: watchId,
        url: watchId ? `https://www.netflix.com/title/${watchId}` : null,
        poster_url: imgEl?.src || null
      };
    }).filter(m => m.netflix_id);
  });

  console.log(`🎬 Found ${movies.length} Nollywood titles on Netflix.`);

  // For each movie, we might want to get more details (synopsis, year, cast)
  // But Netflix lazy-loads this. We'd have to click each one.
  // For a first pass, let's just use what we have or try to fetch some details if possible.
  
  await browser.close();
  return movies;
}

async function syncToDatabase(scrapedMovies) {
  let updatedCount = 0;
  let newCount = 0;
  let errorCount = 0;

  for (const movie of scrapedMovies) {
    const cleanedTitle = cleanTitle(movie.title);
    console.log(`🔄 Processing: ${cleanedTitle}`);

    try {
      // 1. Try to find existing film
      // We'll search by title (case insensitive)
      const { data: existing } = await supabase
        .from('films')
        .select('id, streaming_links, release_type, youtube_watch_url')
        .ilike('title', cleanedTitle)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const newStreamingLinks = { 
          ...(existing.streaming_links || {}), 
          netflix: movie.url 
        };

        const updatePayload: any = {
          streaming_links: newStreamingLinks
        };

        const isPrimaryLinkAvailable = existing.youtube_watch_url || ['kava', 'ironflix'].includes(existing.release_type);
        
        if (!isPrimaryLinkAvailable) {
          updatePayload.release_type = 'netflix';
        }

        const { error } = await supabase
          .from('films')
          .update(updatePayload)
          .eq('id', existing.id);

        if (error) throw error;
        updatedCount++;
        console.log(`  ✅ Updated existing record.`);
      } else {
        // Create new record
        const { error } = await supabase.from('films').insert({
          title: cleanedTitle,
          poster_url: movie.poster_url,
          backdrop_url: movie.poster_url, // Use poster as backdrop for now
          release_type: 'netflix',
          streaming_links: { netflix: movie.url },
          source: 'netflix',
          status: 'released',
          countries: ['Nigeria'],
          needs_review: true
        });

        if (error) throw error;
        newCount++;
        console.log(`  ✨ Created new record.`);
      }
    } catch (e) {
      console.error(`  ❌ Error processing ${movie.title}:`, e.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Sync Complete:`);
  console.log(`   - Updated: ${updatedCount}`);
  console.log(`   - New: ${newCount}`);
  console.log(`   - Errors: ${errorCount}`);
}

async function run() {
  try {
    const movies = await scrapeNetflix();
    await syncToDatabase(movies);
  } catch (e) {
    console.error('💀 Fatal error:', e);
    process.exit(1);
  }
}

run();
