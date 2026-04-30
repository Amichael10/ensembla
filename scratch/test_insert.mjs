import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const payload = {
        mubi_id: '1234567890',
        mubi_slug: 'test-film-1234',
        title: 'Test Film',
        year: 2026,
        synopsis: 'Test',
        runtime_minutes: 120,
        poster_url: null,
        backdrop_url: null,
        is_nollywood: true,
        source: 'mubi',
        status: 'released',
        needs_review: true
  };
  
  const { data, error } = await supabase.from('films').insert(payload).select('id').single();
  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Insert success:', data);
    // cleanup
    await supabase.from('films').delete().eq('id', data.id);
  }
}
test();
