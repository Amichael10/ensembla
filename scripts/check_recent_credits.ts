
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRecentCredits() {
  console.log('Checking for recent credits...');
  
  // Get credits ordered by created_at if possible, otherwise just get some
  const { data: credits, error } = await supabase
    .from('credits')
    .select('*, films(title), people(name)')
    .order('id', { ascending: false }) // Assuming ID is incremental or we don't have created_at
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!credits || credits.length === 0) {
    console.log('No credits found.');
    return;
  }

  console.log('Latest Credits Added:');
  const groupedByFilm: Record<string, any[]> = {};
  credits.forEach(c => {
    const filmTitle = (c.films as any)?.title || 'Unknown Film';
    if (!groupedByFilm[filmTitle]) groupedByFilm[filmTitle] = [];
    groupedByFilm[filmTitle].push(`${(c.people as any)?.name} as ${c.character_name || c.role}`);
  });

  Object.entries(groupedByFilm).forEach(([title, cast]) => {
    console.log(`\n🎬 Film: ${title}`);
    cast.forEach(member => console.log(`  - ${member}`));
  });
}

checkRecentCredits();
