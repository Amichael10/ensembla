import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { cleanTitle } from '../api/_lib/yt_service.ts';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function mapLongMoviesFromBuffer() {
  console.log('🚀 Starting Buffer Movie Mapper (Screentime >= 1 hour)...');

  let mappedCount = 0;
  let createdCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  while (true) {
    // 1. Fetch unmapped videos from the buffer with duration >= 1 hour (3600 seconds)
    const { data: signals, error: signalError } = await supabase
      .from('channel_videos')
      .select('*')
      .is('film_id', null)
      .gte('duration_seconds', 3600)
      .order('published_at', { ascending: false })
      .limit(100); // Process in batches of 100

    if (signalError) {
      console.error('❌ Error fetching signals:', signalError.message);
      break;
    }

    if (!signals || signals.length === 0) {
      console.log('✅ No more unmapped movies (>= 1hr) found in the buffer.');
      break;
    }

    console.log(`📋 Processing batch of ${signals.length} unmapped movies...\n`);

    for (const signal of signals) {
      try {
        const rawTitle = signal.title;
        const cleanedTitle = cleanTitle(rawTitle);
        const durationMins = Math.round((signal.duration_seconds || 0) / 60);
        
        if (!cleanedTitle || cleanedTitle.length < 2) {
          console.log(`  ⚠️ Skipping "${rawTitle}" - cleaned title too short.`);
          skippedCount++;
          continue;
        }

        console.log(`🔍 Processing: "${rawTitle}" (${durationMins} mins)`);
        console.log(`   -> Cleaned: "${cleanedTitle}"`);

        // 2. Check if film exists (case-insensitive)
        const { data: existingFilms, error: searchError } = await supabase
          .from('films')
          .select('id, title, streaming_links')
          .ilike('title', cleanedTitle);

        if (searchError) {
          console.error(`  ❌ Error searching for "${cleanedTitle}":`, searchError.message);
          errorCount++;
          continue;
        }

        let filmId: string;

        if (existingFilms && existingFilms.length > 0) {
          // Link to existing film
          const existing = existingFilms[0];
          filmId = existing.id;
          console.log(`  🔗 Found existing film in main list: "${existing.title}" (ID: ${filmId})`);
          
          // Update existing film's streaming links and watch url if needed
          const currentLinks = existing.streaming_links || {};
          if (!currentLinks.youtube) {
            await supabase.from('films').update({
              streaming_links: { ...currentLinks, youtube: `https://www.youtube.com/watch?v=${signal.video_id}` },
              youtube_watch_url: `https://www.youtube.com/watch?v=${signal.video_id}`,
              runtime_minutes: durationMins // Add/update runtime minutes
            }).eq('id', filmId);
            console.log(`  ➕ Updated streaming link and runtime on existing film.`);
          }
          
          mappedCount++;
        } else {
          // Create new film record
          console.log(`  ✨ No matching film found in main list. Creating new record...`);
          const { data: newFilm, error: createError } = await supabase
            .from('films')
            .insert({
              title: cleanedTitle,
              synopsis: signal.description || '',
              poster_url: signal.thumbnail_url || '',
              backdrop_url: signal.thumbnail_url || '',
              source: 'youtube_buffer',
              source_video_id: signal.video_id,
              youtube_watch_url: `https://www.youtube.com/watch?v=${signal.video_id}`,
              status: 'released',
              release_type: 'youtube',
              needs_review: false,
              countries: ['Nigeria'],
              runtime_minutes: durationMins,
              streaming_links: {
                youtube: `https://www.youtube.com/watch?v=${signal.video_id}`
              }
            })
            .select('id')
            .single();

          if (createError) {
            console.error(`  ❌ Error creating film for "${cleanedTitle}":`, createError.message);
            errorCount++;
            continue;
          }

          filmId = newFilm.id;
          console.log(`  ✅ Successfully created new film: (ID: ${filmId})`);
          createdCount++;
        }

        // 3. Update buffer video signal with film_id to link them
        const { error: linkError } = await supabase
          .from('channel_videos')
          .update({ film_id: filmId, match_status: 'auto' })
          .eq('id', signal.id);

        if (linkError) {
          console.error(`  ❌ Error linking signal ${signal.id} to film ${filmId}:`, linkError.message);
          errorCount++;
        } else {
          console.log(`  📍 Linked in buffer.`);
        }
        
        console.log('---');
      } catch (err) {
        console.error(`  ❌ Unexpected error processing signal ${signal.id}:`, err);
        errorCount++;
      }
    }
    // Small delay between batches to be gentle on DB
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n==================================================');
  console.log('✅ Buffer Movie Mapping Complete!');
  console.log(`✨ New Films Created:        ${createdCount}`);
  console.log(`🔗 Existing Films Linked:    ${mappedCount}`);
  console.log(`⚠️ Signals Skipped:          ${skippedCount}`);
  console.log(`❌ Errors Encountered:       ${errorCount}`);
  console.log('==================================================\n');
}

mapLongMoviesFromBuffer().catch(console.error);
