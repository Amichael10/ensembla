import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const AFRICAN_COUNTRIES = ['Nigeria', 'Egypt', 'South Africa', 'Senegal'];

async function testScrape() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  
  try {
    const slug = 'the-boy-who-harnessed-the-wind'; // I saw this in the user's screenshot
    
    // Use the logic from mubi_playwright.js
    const url = `https://mubi.com/en/films/${slug}`;
    console.log(`📡 Visiting: ${url}`);
    
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    const nextDataStr = await page.evaluate(() => document.getElementById('__NEXT_DATA__')?.textContent);
    if (!nextDataStr) throw new Error('No __NEXT_DATA__ found');
    
    const nextData = JSON.parse(nextDataStr);
    const film = nextData.props.pageProps.initFilm;
    
    // Get Credits
    const castUrl = `${url}/cast`;
    await page.goto(castUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    const castDataStr = await page.evaluate(() => document.getElementById('__NEXT_DATA__')?.textContent);
    const credits = [];
    if (castDataStr) {
      const castData = JSON.parse(castDataStr).props.pageProps;
      if (castData.cast) castData.cast.forEach(c => credits.push({name: c.name, role: 'actor', character_name: c.role, mubi_slug: c.slug}));
      if (castData.crew) castData.crew.forEach(c => credits.push({name: c.name, role: 'crew', original_role: c.job, mubi_slug: c.slug}));
    }
    
    await page.close();
    
    const countries = (film.historic_countries || []).filter(c => AFRICAN_COUNTRIES.includes(c));
    
    const payload = {
        mubi_id: String(film.id),
        mubi_slug: slug,
        title: film.title,
        year: film.year,
        synopsis: film.short_synopsis || film.default_editorial || '',
        runtime_minutes: film.duration,
        poster_url: film.still_url || film.stills?.retina,
        backdrop_url: film.stills?.retina,
        is_nollywood: countries.includes('Nigeria'),
        source: 'mubi',
        status: 'released',
        needs_review: true
    };
    
    console.log("Attempting insert:", payload);
    const { data: inserted, error } = await supabase.from('films').insert(payload).select('id').single();
    
    if (error) {
      console.error('Insert error:', error.message);
    } else {
      console.log('Inserted correctly!');
      await supabase.from('films').delete().eq('id', inserted.id);
    }
    
  } catch (e) {
    console.error('Error in script:', e);
  } finally {
    await browser.close();
  }
}

testScrape();
