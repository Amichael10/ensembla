
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
  const { count: filmCount } = await supabase.from('films').select('*', { count: 'exact', head: true });
  const { count: creditCount } = await supabase.from('credits').select('*', { count: 'exact', head: true });
  const { count: personCount } = await supabase.from('people').select('*', { count: 'exact', head: true });
  
  console.log('--- Database Stats ---');
  console.log('Total Films:  ', filmCount);
  console.log('Total Credits:', creditCount);
  console.log('Total People: ', personCount);
}

test().catch(console.error);
