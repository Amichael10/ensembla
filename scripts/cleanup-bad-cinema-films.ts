import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function run() {
  // 1. Find test-created films (source='cinema')
  const { data: badFilms } = await supabase.from('films').select('id, title').eq('source', 'cinema');
  console.log(`Found ${badFilms?.length ?? 0} test-created films to delete.`);

  if (badFilms?.length) {
    const ids = badFilms.map(f => f.id);

    // 2. Delete showtimes referencing those films
    const { error: stErr, count: stCount } = await supabase
      .from('showtimes')
      .delete({ count: 'exact' })
      .in('film_id', ids);
    if (stErr) console.error('showtime delete:', stErr.message);
    else console.log(`  ✓ deleted ${stCount ?? 0} showtimes`);

    // 3. Delete any credits referencing those films
    await supabase.from('credits').delete().in('film_id', ids);

    // 4. Delete the films themselves
    const { error: fErr, count: fCount } = await supabase
      .from('films')
      .delete({ count: 'exact' })
      .in('id', ids);
    if (fErr) console.error('film delete:', fErr.message);
    else console.log(`  ✓ deleted ${fCount ?? 0} test films`);
  }

  // 5. Ensure all remaining films are flagged is_nollywood=true
  const { error: upErr, count: upCount } = await supabase
    .from('films')
    .update({ is_nollywood: true }, { count: 'exact' })
    .or('is_nollywood.is.null,is_nollywood.eq.false');
    
  if (upErr) console.error('is_nollywood update:', upErr.message);
  else console.log(`  ✓ ensured is_nollywood=true on ${upCount ?? 0} films`);

  console.log('\n✅ Cleanup complete.');
}

run();
