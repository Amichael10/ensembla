
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRecentPeople() {
  console.log('Checking for recent people added by the extractor...');
  
  const { data: people, error } = await supabase
    .from('people')
    .select('*')
    .eq('nationality', 'Nigerian')
    .order('id', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!people || people.length === 0) {
    console.log('No Nigerian people found.');
    return;
  }

  console.log('Recent People:');
  people.forEach(p => {
    console.log(`- ${p.name} (ID: ${p.id})`);
  });
}

checkRecentPeople();
