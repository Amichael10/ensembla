import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
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

const PRIME_SEARCH_URL = 'https://www.primevideo.com/search/ref=atv_nb_sug?ie=UTF8&phrase=nollywood';

async function scrapePrime() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log(`🚀 Navigating to Prime Search: ${PRIME_SEARCH_URL}`);
  await page.goto(PRIME_SEARCH_URL, { waitUntil: 'networkidle' });

  // Handle cookies banner if it exists
  try {
    const cookieButton = await page.waitForSelector('#sp-cc-accept', { timeout: 3000 });
    if (cookieButton) await cookieButton.click();
  } catch (e) {}

  let allMovies: any[] = [];
  let pageNum = 1;

  while (pageNum <= 5) { // Limit to first 5 pages for now
    console.log(`🔍 Scraping Page ${pageNum}...`);
    
    const movies = await page.evaluate(() => {
      const results = Array.from(document.querySelectorAll('[data-testid="grid-item"], .tst-title-card'));
      return results.map(item => {
        const titleEl = item.querySelector('h2, .tst-title-card-title, [data-testid="title-card-title"]');
        const linkEl = item.querySelector('a');
        const imgEl = item.querySelector('img');
        
        let url = linkEl?.href || '';
        // Prime links can be long, but they usually contain a title ID
        // e.g., /detail/0XYZ...
        
        return {
          title: titleEl?.textContent?.trim() || imgEl?.getAttribute('alt') || 'Unknown',
          url: url.split('?')[0], // Strip query params
          poster_url: imgEl?.src || null
        };
      }).filter(m => m.url.includes('/detail/'));
    });

    allMovies.push(...movies);
    console.log(`✅ Found ${movies.length} titles on page ${pageNum}.`);

    // Check for next page
    const nextButton = await page.$('a.pagination-next, [aria-label="Next"]');
    if (nextButton && pageNum < 5) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');
      pageNum++;
    } else {
      break;
    }
  }

  await browser.close();
  return allMovies;
}

async function syncToDatabase(scrapedMovies) {
  let updatedCount = 0;
  let newCount = 0;
  let errorCount = 0;

  for (const movie of scrapedMovies) {
    const cleanedTitle = cleanTitle(movie.title);
    console.log(`🔄 Processing: ${cleanedTitle}`);

    try {
      const { data: existing } = await supabase
        .from('films')
        .select('id, streaming_links, release_type, youtube_watch_url')
        .ilike('title', cleanedTitle)
        .maybeSingle();

      if (existing) {
        const newStreamingLinks = { 
          ...(existing.streaming_links || {}), 
          prime_video: movie.url 
        };

        const updatePayload: any = {
          streaming_links: newStreamingLinks
        };

        const isPrimaryLinkAvailable = existing.youtube_watch_url || ['kava', 'ironflix'].includes(existing.release_type);
        
        if (!isPrimaryLinkAvailable) {
          updatePayload.release_type = 'prime_video';
        }

        const { error } = await supabase
          .from('films')
          .update(updatePayload)
          .eq('id', existing.id);

        if (error) throw error;
        updatedCount++;
        console.log(`  ✅ Updated existing record.`);
      } else {
        const { error } = await supabase.from('films').insert({
          title: cleanedTitle,
          poster_url: movie.poster_url,
          backdrop_url: movie.poster_url,
          release_type: 'prime_video',
          streaming_links: { prime_video: movie.url },
          source: 'prime_video',
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

  console.log(`\n📊 Prime Sync Complete:`);
  console.log(`   - Updated: ${updatedCount}`);
  console.log(`   - New: ${newCount}`);
  console.log(`   - Errors: ${errorCount}`);
}

async function run() {
  try {
    const movies = await scrapePrime();
    await syncToDatabase(movies);
  } catch (e) {
    console.error('💀 Fatal error:', e);
    process.exit(1);
  }
}

run();
