
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findOneSuccessfulFilm() {
  console.log('Finding a YouTube film with multiple credits...');
  
  // Get latest credits and join with films
  const { data: credits, error } = await supabase
    .from('credits')
    .select('*, films!inner(*)')
    .eq('films.source', 'youtube')
    .limit(100);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const filmCounts: Record<string, {title: string, url: string, count: number, cast: string[]}> = {};
  
  credits.forEach((c: any) => {
    const id = c.film_id;
    if (!filmCounts[id]) {
      filmCounts[id] = {
        title: c.films.title,
        url: c.films.youtube_watch_url,
        count: 0,
        cast: []
      };
    }
    filmCounts[id].count++;
  });

  const winner = Object.values(filmCounts).find(f => f.count >= 3);

  if (winner) {
    console.log(`\n✅ FOUND SUCCESSFUL FILM:`);
    console.log(`🎬 Title: ${winner.title}`);
    console.log(`🔗 URL: ${winner.url}`);
    console.log(`📊 Credits extracted: ${winner.count}`);
    
    // Fetch full cast for this winner
    const { data: fullCast } = await supabase
      .from('credits')
      .select('role, character_name, people(name)')
      .eq('film_id', Object.keys(filmCounts).find(key => filmCounts[key].title === winner.title));
    
    fullCast?.forEach(c => {
       console.log(`   • ${(c.people as any)?.name} - ${c.role} (${c.character_name || 'N/A'})`);
    });
  } else {
    console.log('No YouTube film found with 3+ credits in the latest 100 credits.');
  }
}

findOneSuccessfulFilm();
