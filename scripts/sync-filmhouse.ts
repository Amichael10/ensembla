import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import { cleanTitle } from '../api/_lib/yt_service.js';

const stealthPlugin = stealth();
chromium.use(stealthPlugin);

// Support .env and .env.local
const envLocal = fs.existsSync('.env.local') ? dotenv.parse(fs.readFileSync('.env.local')) : {};
const envDefault = fs.existsSync('.env') ? dotenv.parse(fs.readFileSync('.env')) : {};
const env = { ...envDefault, ...envLocal, ...process.env };

const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function scrapeFilmhouse() {
  const startTime = Date.now();
  console.log('🌍 Starting Filmhouse Scraper...');

  // 1. Create a "running" log entry
  const { data: logEntry } = await supabase.from('sync_logs').insert({
    source: 'filmhouse',
    status: 'running',
    message: 'Scraping Filmhouse showtimes...',
    details: { started_at: new Date().toISOString() }
  }).select().single();
  
  const logId = logEntry?.id;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  const locations = [
    { name: 'Lekki IMAX', cinemaId: '6c9c38f0-f790-4573-aaa0-483d96ccaa43' },
    { name: 'Circle Mall', cinemaId: '13641c31-b2f2-4300-bcdd-23173e33c4f8' },
    { name: 'Surulere', cinemaId: '6201cbdf-dcf7-44b4-982c-bc860bb70230' },
    { name: 'Samonda', cinemaId: 'a2b15cfa-b044-491a-9c0f-13d2ff853886' },
    { name: 'Landmark', cinemaId: '314079fe-6416-469b-9241-2ce049954662' }
  ];

  const today = new Date().toISOString().split('T')[0];
  let totalProcessed = 0;
  let totalInserted = 0;
  let totalErrors = 0;

  try {
    await page.goto('https://filmhouseng.com/', { waitUntil: 'networkidle', timeout: 60000 });
    
    for (const loc of locations) {
      console.log(`📍 Processing ${loc.name}...`);
      
      try {
        await page.waitForSelector('.dropdownHeader', { timeout: 10000 });
        const headers = await page.$$('.dropdownHeader');
        let clicked = false;
        for (const header of headers) {
          if (await header.isVisible()) {
            await header.click();
            clicked = true;
            break;
          }
        }
        
        if (!clicked) {
          console.log('  ⚠️ No visible dropdown header found');
          continue;
        }
        
        await page.waitForTimeout(2000);
        
        const found = await page.evaluate((locName) => {
          const bodies = Array.from(document.querySelectorAll('.dropdownBody'));
          const visibleBody = bodies.find(b => (b as HTMLElement).offsetParent !== null);
          if (!visibleBody) return false;
          
          const items = Array.from(visibleBody.querySelectorAll('.item, div'));
          const item = items.find(i => i.textContent?.trim().toLowerCase().includes(locName.toLowerCase()));
          if (item) {
            (item as HTMLElement).click();
            return true;
          }
          return false;
        }, loc.name);
        
        if (!found) {
          console.log(`  ⚠️ Could not find ${loc.name} in dropdown`);
          continue;
        }

        await page.waitForTimeout(3000);
        
        const films = await page.evaluate(() => {
          const movieNodes = document.querySelectorAll('.pc-movie-item, .movie-card-wrap, [class*="movie-item"]');
          return Array.from(movieNodes).map(node => {
            const titleEl = node.querySelector('h1, h2, h3, .pc-movie-title');
            const showtimeEls = node.querySelectorAll('.pc-show-time, .showtime');

            const showtimes = Array.from(showtimeEls).map(btn => {
              const timeText = btn.textContent?.trim() || '';
              return {
                time: timeText,
                format: 'Standard',
                ticketUrl: null
              };
            });

            return {
              title: titleEl ? titleEl.textContent?.trim() : null,
              showtimes
            };
          }).filter(f => f.title && f.showtimes.length > 0);
        });

        console.log(`  Found ${films.length} films for ${loc.name}`);
        totalProcessed += films.length;
        
        for (const film of films) {
          const cleanedTitle = cleanTitle(film.title!);
          console.log(`    🔍 Syncing ${cleanedTitle}...`);
          
          let { data: dbFilm } = await supabase
            .from('films')
            .select('id, title')
            .ilike('title', cleanedTitle)
            .maybeSingle();

          if (!dbFilm) {
            const { data: fuzzy } = await supabase
              .from('films')
              .select('id, title')
              .ilike('title', `%${cleanedTitle}%`)
              .limit(1);
            dbFilm = fuzzy && fuzzy.length > 0 ? fuzzy[0] : null;
          }

          if (!dbFilm) {
            console.log(`      ⚠️ Film not found in DB: ${cleanedTitle}`);
            continue;
          }

          await supabase
            .from('showtimes')
            .delete()
            .match({ film_id: dbFilm.id, cinema_id: loc.cinemaId, show_date: today });

          const showtimesToInsert = film.showtimes.map(s => {
            let [time, modifier] = s.time.split(/(AM|PM)/i);
            let [hoursStr, minutes] = time.split(':');
            let hours = parseInt(hoursStr, 10);
            if (hours === 12 && modifier?.toUpperCase() === 'AM') hours = 0;
            if (hours !== 12 && modifier?.toUpperCase() === 'PM') hours += 12;
            const formattedTime = `${String(hours).padStart(2, '0')}:${minutes}:00`;

            return {
              film_id: dbFilm!.id,
              cinema_id: loc.cinemaId,
              show_date: today,
              show_time: formattedTime,
              format: s.format,
              source: 'filmhouse_playwright',
              is_available: true,
              last_seen_at: new Date().toISOString()
            };
          });

          const { error } = await supabase.from('showtimes').insert(showtimesToInsert);
          if (error) {
            console.error(`      ❌ Error: ${error.message}`);
            totalErrors++;
          } else {
            console.log(`      ✅ Synced ${showtimesToInsert.length} showtimes`);
            totalInserted += showtimesToInsert.length;
          }
        }
        
      } catch (e: any) {
        console.error(`  ❌ Error processing ${loc.name}:`, e.message);
        totalErrors++;
      }
    }
    
    if (logId) {
      await supabase.from('sync_logs').update({
        status: totalErrors === 0 ? 'success' : 'partial',
        message: `Filmhouse sync complete. Processed ${totalProcessed} films, synced ${totalInserted} showtimes.`,
        details: { total_processed: totalProcessed, total_inserted: totalInserted, errors: totalErrors },
        duration_ms: Date.now() - startTime,
        items_processed: totalProcessed,
        items_updated: totalInserted,
        items_failed: totalErrors
      }).eq('id', logId);
    }

  } catch (err: any) {
    console.error("Filmhouse Scraper failed:", err);
    if (logId) {
      await supabase.from('sync_logs').update({
        status: 'error',
        message: err.message,
        details: { error: err.stack },
        duration_ms: Date.now() - startTime
      }).eq('id', logId);
    }
  } finally {
    await browser.close();
  }
}

scrapeFilmhouse();
