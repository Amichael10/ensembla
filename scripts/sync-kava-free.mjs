import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('🚀 Starting FREE Kava Scrape via Playwright...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    // 1. Ensure Kava Channel exists
    let { data: channel } = await supabase.from('channels').select('id').eq('name', 'Kava Data').maybeSingle();
    
    if (!channel) {
      console.log('Creating Kava Data channel...');
      const { data: newChannel, error } = await supabase.from('channels').insert([{ 
        name: 'Kava Data', 
        channel_handle: 'kava.tv',
        adapter: 'kava',
        is_active: true 
      }]).select().single();
      
      if (error) throw error;
      channel = newChannel;
    }

    // 2. Navigate and Scrape
    console.log('Navigating to Kava.tv...');
    await page.goto('https://kava.tv/category/p1', { waitUntil: 'networkidle', timeout: 60000 });
    
    // Wait for content to be visible
    await page.waitForSelector('.dataContents', { timeout: 15000 });

    console.log('Extracting movie data...');
    const movies = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.col-lg-3, .col-md-4, .col-sm-6'));
      return cards.map(card => {
        const titleEl = card.querySelector('.dataContents span');
        const descEl = card.querySelector('.dataContents div');
        const linkEl = card.querySelector('a.dataContents');
        const imgEl = card.querySelector('.content_img img');
        
        if (!titleEl || !linkEl) return null;

        return {
          title: titleEl.textContent?.trim(),
          synopsis: descEl?.textContent?.trim() || '',
          slug: linkEl.getAttribute('href')?.split('/').pop() || '',
          poster_url: imgEl?.getAttribute('src') || null
        };
      }).filter(m => m !== null && m.title);
    });

    console.log(`✅ Found ${movies.length} movies on Kava via Playwright.`);

    if (movies.length === 0) {
      console.warn('⚠️ No movies found. Site structure might have changed.');
      await browser.close();
      return;
    }

    // Fetch hidden videos for this channel
    const { data: hiddenVids } = await supabase
      .from('channel_videos')
      .select('video_id')
      .eq('channel_id', channel.id)
      .eq('is_hidden', true);
    const hiddenSet = new Set(hiddenVids?.map(v => v.video_id) || []);

    // 3. Upsert into channel_videos
    const videoRows = movies.map(m => ({
      channel_id: channel.id,
      video_id: `kava-${m.slug || m.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title: m.title,
      description: m.synopsis,
      thumbnail_url: m.poster_url || null,
      published_at: new Date().toISOString()
    })).filter(row => !hiddenSet.has(row.video_id));

    const { error: upsertError } = await supabase.from('channel_videos').upsert(videoRows, { 
      onConflict: 'channel_id,video_id' 
    });

    if (upsertError) throw upsertError;
    console.log(`✨ Successfully synced ${videoRows.length} items to the buffer.`);

  } catch (err) {
    console.error('❌ Playwright Scrape Failed:', err.message);
    // Take a screenshot for debugging if it fails
    try {
      await page.screenshot({ path: 'kava-error-screenshot.png' });
      console.log('Error screenshot saved to kava-error-screenshot.png');
    } catch (e) {}
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
