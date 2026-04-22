const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function checkVideos() {
  const { data, error } = await supabase
    .from('channel_videos')
    .select('title, duration_seconds')
    .order('duration_seconds', { ascending: false })
    .limit(20);

  if (error) {
    console.error(error);
    return;
  }

  console.table(data);
}

checkVideos();
