
import { createClient } from '@supabase/supabase-client';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkChannels() {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .limit(5);
  
  if (error) {
    console.error('Error fetching channels:', error);
  } else {
    console.log('Channels:', JSON.stringify(data, null, 2));
  }
}

checkChannels();
