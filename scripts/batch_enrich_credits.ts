import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { spawn } from 'child_process';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runCastExtractor(url: string, timeoutMs: number = 600000): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`\n🎬 Starting AI extraction for: ${url}`);
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    
    const extractor = spawn(pythonCmd, ['cast_extractor.py', url], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' }
    });

    const timeout = setTimeout(() => {
      console.log(`⚠️ Process timed out after ${timeoutMs/1000}s. Killing...`);
      extractor.kill('SIGTERM');
      resolve(false);
    }, timeoutMs);

    extractor.on('close', (code) => {
      clearTimeout(timeout);
      resolve(code === 0);
    });

    extractor.on('error', (err) => {
      console.error('❌ Failed to start extractor:', err);
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

async function main() {
  console.log('🚀 Starting Batch Credit Enrichment...\n');

  // 1. Fetch films from YouTube
  console.log('📦 Fetching YouTube films from database...');
  const { data: films, error } = await supabase
    .from('films')
    .select('id, title, youtube_watch_url')
    .eq('source', 'youtube')
    .not('youtube_watch_url', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching films:', error.message);
    return;
  }

  // 2. Filter for films with 0 or 1 credits
  console.log('🔍 Analyzing credit counts...');
  const { data: credits } = await supabase
    .from('credits')
    .select('film_id');

  const creditCounts: Record<string, number> = {};
  credits?.forEach(c => {
    creditCounts[c.film_id] = (creditCounts[c.film_id] || 0) + 1;
  });

  const targets = films.filter(f => (creditCounts[f.id] || 0) <= 1);
  console.log(`📝 Found ${targets.length} candidates needing credit enrichment.`);

  if (targets.length === 0) {
    console.log('✅ No films need enrichment at this time.');
    return;
  }

  // 3. Process batch
  const LIMIT = 10; // Process 10 at a time for now
  const toProcess = targets.slice(0, LIMIT);
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const film = toProcess[i];
    console.log(`\n[${i + 1}/${toProcess.length}] 🎥 "${film.title}"`);
    console.log(`🔗 URL: ${film.youtube_watch_url}`);
    
    // Retry logic: try up to 2 times
    let success = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (attempt > 1) console.log(`   🔄 Retry attempt ${attempt}...`);
      success = await runCastExtractor(film.youtube_watch_url!);
      if (success) break;
      if (attempt < 2) await delay(5000); // Small wait before retry
    }
    
    if (success) {
      console.log(`✅ SUCCESS: Finished ${film.title}`);
      successCount++;
    } else {
      console.log(`❌ FAILURE: Failed to process ${film.title} after all attempts.`);
      failCount++;
    }

    if (i < toProcess.length - 1) {
      console.log(`\n⏳ Cooling down for 15s...`);
      await delay(15000);
    }
  }

  console.log('\n==========================================');
  console.log('🏁 Batch Processing Complete');
  console.log(`✅ Successes: ${successCount}`);
  console.log(`❌ Failures:  ${failCount}`);
  console.log('==========================================\n');
}

main().catch(err => {
  console.error('💥 Critical Error in main loop:', err);
  process.exit(1);
});
