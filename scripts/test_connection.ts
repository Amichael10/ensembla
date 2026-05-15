
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
  console.log('Testing connection to:', process.env.VITE_SUPABASE_URL);
  const { data, error, count } = await supabase.from('films').select('*', { count: 'exact', head: true });
  if (error) {
    console.error('Connection error:', error);
  } else {
    console.log('Connection successful! Total films:', count);
  }
}

test().catch(console.error);
