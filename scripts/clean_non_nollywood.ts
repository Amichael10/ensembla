import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const envLocal = fs.existsSync('.env.local') ? dotenv.parse(fs.readFileSync('.env.local')) : {};
const envDefault = fs.existsSync('.env') ? dotenv.parse(fs.readFileSync('.env')) : {};
const env = { ...envDefault, ...envLocal, ...process.env };

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const TMDB_KEY = env.TMDB_API_KEY;

async function cleanNonNollywood() {
  console.log('Fetching tmdb_cinema films...');
  const { data: films, error } = await supabase
    .from('films')
    .select('id, title, tmdb_id')
    .eq('source', 'tmdb_cinema');

  if (error) {
    console.error('Error fetching films:', error);
    return;
  }

  console.log(`Found ${films.length} films to check.`);

  const toDelete = [];

  for (const film of films) {
    if (!film.tmdb_id) continue;
    
    try {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${film.tmdb_id}?api_key=${TMDB_KEY}`);
      if (!res.ok) continue;
      
      const detailsData = await res.json();
      const isNollywood = detailsData.production_countries?.some((c: any) => c.iso_3166_1 === 'NG');
      
      if (!isNollywood) {
        console.log(`🗑️ Non-Nollywood film detected: ${film.title}`);
        toDelete.push(film.id);
      } else {
        console.log(`✅ Kept Nollywood film: ${film.title}`);
      }
    } catch (e) {
      console.error(`Failed to check ${film.title}:`, e);
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 100));
  }

  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} non-Nollywood films...`);
    // Delete in batches of 50
    for (let i = 0; i < toDelete.length; i += 50) {
      const batch = toDelete.slice(i, i + 50);
      const { error: delError } = await supabase
        .from('films')
        .delete()
        .in('id', batch);
      
      if (delError) {
        console.error('Error deleting batch:', delError);
      } else {
        console.log(`Deleted batch of ${batch.length}`);
      }
    }
  } else {
    console.log('No non-Nollywood films found to delete.');
  }
}

cleanNonNollywood();
