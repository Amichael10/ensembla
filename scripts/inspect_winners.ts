
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspectFilm(title: string) {
  const { data: film } = await supabase.from('films').select('*').eq('title', title).single();
  if (!film) {
    console.log(`Film "${title}" not found.`);
    return;
  }
  console.log(`\n🎬 Film: ${film.title}`);
  console.log(`🔗 URL: ${film.youtube_watch_url}`);
  
  const { data: credits } = await supabase
    .from('credits')
    .select('role, character_name, people(name)')
    .eq('film_id', film.id);
  
  console.log(`📊 Credits (${credits?.length || 0}):`);
  credits?.forEach(c => {
    console.log(`   • ${(c.people as any)?.name} - ${c.role} (${c.character_name || 'N/A'})`);
  });
}

async function run() {
  await inspectFilm('Ago');
  await inspectFilm('Àkúdàáyà');
}

run();
