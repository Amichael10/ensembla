import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Support .env and .env.local
const envLocal = fs.existsSync('.env.local') ? dotenv.parse(fs.readFileSync('.env.local')) : {};
const envDefault = fs.existsSync('.env') ? dotenv.parse(fs.readFileSync('.env')) : {};
const env = { ...envDefault, ...envLocal, ...process.env };

const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const africanCountries = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cameroon', 'Central African Republic',
  'Chad', 'Comoros', 'Congo', 'Cote d\'Ivoire', 'Ivory Coast', 'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia',
  'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali',
  'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda', 'Sao Tome and Principe', 'Senegal',
  'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
];

async function cleanupNonAfrican() {
  const startTime = Date.now();
  console.log('🧹 Starting Cleanup of Non-African Films...');

  // 1. Create a "running" log entry
  const { data: logEntry } = await supabase.from('sync_logs').insert({
    source: 'cleanup',
    status: 'running',
    message: 'Cleaning up non-African films...',
    details: { started_at: new Date().toISOString() }
  }).select().single();
  
  const logId = logEntry?.id;

  try {
    const { data: films, error } = await supabase
      .from('films')
      .select('id, title, countries, mubi_slug');

    if (error) throw error;

    const toDelete = films.filter(film => {
      if (!film.countries || film.countries.length === 0) return false;
      const hasAfrican = film.countries.some(c => africanCountries.includes(c));
      return !hasAfrican;
    });

    console.log(`Found ${toDelete.length} non-African films.`);
    
    let deleted = 0;
    let errors = 0;

    for (const film of toDelete) {
      console.log(`🗑️ Deleting ${film.title} (Countries: ${film.countries.join(', ')})`);
      const { error: delError } = await supabase
        .from('films')
        .delete()
        .match({ id: film.id });
      
      if (delError) {
        console.error(`  ❌ Failed to delete ${film.title}:`, delError.message);
        errors++;
      } else {
        deleted++;
      }
    }

    console.log('✨ Cleanup complete.');

    if (logId) {
      await supabase.from('sync_logs').update({
        status: errors === 0 ? 'success' : 'partial',
        message: `Cleanup complete. Deleted ${deleted} non-African films.`,
        details: { total_found: toDelete.length, deleted, errors },
        duration_ms: Date.now() - startTime,
        items_processed: toDelete.length,
        items_updated: deleted,
        items_failed: errors
      }).eq('id', logId);
    }

  } catch (err: any) {
    console.error('❌ Cleanup Failed:', err.message);
    if (logId) {
      await supabase.from('sync_logs').update({
        status: 'error',
        message: err.message,
        details: { error: err.stack },
        duration_ms: Date.now() - startTime
      }).eq('id', logId);
    }
  }
}

cleanupNonAfrican();
