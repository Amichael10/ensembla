
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findEnrichedFilms() {
  console.log('Searching for films with 5+ credits...');
  
  const { data: credits, error } = await supabase
    .from('credits')
    .select('film_id');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const counts: Record<string, number> = {};
  credits.forEach(c => {
    counts[c.film_id] = (counts[c.film_id] || 0) + 1;
  });

  const enrichedFilmIds = Object.entries(counts)
    .filter(([id, count]) => count >= 5)
    .map(([id]) => id);

  if (enrichedFilmIds.length === 0) {
    console.log('No films found with 5+ credits.');
    return;
  }

  const { data: films, error: filmError } = await supabase
    .from('films')
    .select('title, youtube_watch_url')
    .in('id', enrichedFilmIds);

  if (filmError) {
    console.error('Error fetching films:', filmError);
    return;
  }

  console.log(`Found ${films.length} films with 5+ credits:`);
  for (const film of films) {
    console.log(`- ${film.title} (${film.youtube_watch_url})`);
    
    // Get cast for this film
    const { data: filmCredits } = await supabase
      .from('credits')
      .select('role, character_name, people(name)')
      .eq('film_id', (await supabase.from('films').select('id').eq('title', film.title).single()).data?.id);
    
    filmCredits?.forEach(c => {
       console.log(`   • ${(c.people as any)?.name} - ${c.role} (${c.character_name || 'N/A'})`);
    });
  }
}

findEnrichedFilms();
