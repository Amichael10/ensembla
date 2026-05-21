import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function count() {
  const { count, error } = await supabase
    .from('channel_videos')
    .select('*', { count: 'exact', head: true })
    .is('film_id', null)
    .gte('duration_seconds', 3600);
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log(`COUNT_RESULT: ${count}`);
  }
}

count().catch(console.error);
