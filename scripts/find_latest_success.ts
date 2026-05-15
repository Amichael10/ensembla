
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findLatestSuccessfulYoutubeFilm() {
  const { data: credits, error } = await supabase
    .from('credits')
    .select('film_id, created_at, films!inner(title, youtube_watch_url)')
    .eq('films.source', 'youtube')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const filmMap: Record<string, any> = {};
  credits.forEach((c: any) => {
    if (!filmMap[c.film_id]) {
      filmMap[c.film_id] = {
        title: c.films.title,
        url: c.films.youtube_watch_url,
        count: 0,
        last_added: c.created_at
      };
    }
    filmMap[c.film_id].count++;
  });

  const films = Object.values(filmMap).filter(f => f.count >= 3);
  console.log('Recent YouTube films enriched with credits:');
  films.forEach(f => {
    console.log(`- ${f.title} (${f.count} credits, Enriched at: ${f.last_added})`);
  });
}

findLatestSuccessfulYoutubeFilm();
