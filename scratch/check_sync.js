import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSync() {
  console.log('--- Sync Health Check ---');
  
  // Check Videos (Buffer)
  const { count: videoCount, data: recentVideos } = await supabase
    .from('channel_videos')
    .select('title, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log(`Total Videos in Buffer: ${videoCount}`);
  console.log('Most Recent Videos:');
  recentVideos?.forEach(v => console.log(`- ${v.title} (${v.created_at})`));

  // Check Showtimes
  const { count: showtimeCount, data: recentShowtimes } = await supabase
    .from('showtimes')
    .select('id, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(`\nTotal Showtimes: ${showtimeCount}`);
  if (recentShowtimes?.length) {
     console.log(`Last showtime added at: ${recentShowtimes[0].created_at}`);
  }

  // Check Kava Channel specifically
  const { data: kavaVideos } = await supabase
    .from('channel_videos')
    .select('id')
    .ilike('video_id', 'kava-%');
    
  console.log(`\nKava Scraped Items: ${kavaVideos?.length || 0}`);
}

checkSync();
