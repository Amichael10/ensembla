
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findYoutubeEnrichedFilms() {
  console.log('Searching for YouTube films with 3+ credits...');
  
  // 1. Get YouTube films
  const { data: youtubeFilms, error: filmError } = await supabase
    .from('films')
    .select('id, title, youtube_watch_url')
    .eq('source', 'youtube');

  if (filmError) {
    console.error('Error fetching films:', filmError);
    return;
  }

  const filmIds = youtubeFilms.map(f => f.id);

  // 2. Count credits for these films
  const { data: credits, error } = await supabase
    .from('credits')
    .select('film_id')
    .in('film_id', filmIds);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const counts: Record<string, number> = {};
  credits.forEach(c => {
    counts[c.film_id] = (counts[c.film_id] || 0) + 1;
  });

  const enrichedFilms = youtubeFilms.filter(f => (counts[f.id] || 0) >= 3);

  if (enrichedFilms.length === 0) {
    console.log('No YouTube films found with 3+ credits.');
    return;
  }

  console.log(`Found ${enrichedFilms.length} YouTube films with 3+ credits:`);
  for (const film of enrichedFilms) {
    console.log(`\n🎬 Film: ${film.title}`);
    console.log(`🔗 URL: ${film.youtube_watch_url}`);
    console.log(`📈 Credits Found: ${counts[film.id]}`);
    
    // Get cast for this film
    const { data: filmCredits } = await supabase
      .from('credits')
      .select('role, character_name, people(name)')
      .eq('film_id', film.id);
    
    filmCredits?.forEach(c => {
       console.log(`   • ${(c.people as any)?.name} - ${c.role} (${c.character_name || 'N/A'})`);
    });
  }
}

findYoutubeEnrichedFilms();
