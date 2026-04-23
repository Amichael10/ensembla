/**
 * POST /api/cron/refresh-tmdb
 * 
 * Purpose: Automatically discovers and imports NEW Nigerian films from TMDB.
 * Schedule: Running 1x per day (recommended).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { isValidAuth } from '../_lib/auth';

const TMDB_KEY = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end();
  
  if (!(await isValidAuth(req))) return res.status(401).json({ error: 'Unauthorized' });
  if (!TMDB_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });

  const stats = { scan_count: 0, imported: 0, errors: [] as string[] };

  try {
    // 1. Discover newly released/popular Nigerian films
    const url = `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_origin_country=NG&sort_by=popularity.desc&include_adult=false&page=1`;
    const discoverRes = await fetch(url);
    const discoverData = await discoverRes.json();

    const movies = (discoverData.results || []).slice(0, 10); // Process top 10 new discoveries
    stats.scan_count = movies.length;

    for (const movie of movies) {
      // Check if already in our DB
      const { data: existing } = await supabase.from('films').select('id').eq('tmdb_id', movie.id).maybeSingle();
      if (existing) continue;

      // Import logic (Simplified version of bulk sync)
      const detailsRes = await fetch(`${TMDB_BASE}/movie/${movie.id}?api_key=${TMDB_KEY}&append_to_response=credits`);
      const details = await detailsRes.json();

      const { data: inserted, error: insErr } = await supabase.from('films').insert({
        title: details.title,
        synopsis: details.overview,
        year: details.release_date ? new Date(details.release_date).getFullYear() : null,
        poster_url: details.poster_path ? `${IMAGE_BASE}/w500${details.poster_path}` : null,
        tmdb_id: details.id,
        tmdb_rating: details.vote_average,
        language: details.original_language?.toUpperCase() === 'YO' ? 'Yoruba' : 
                  details.original_language?.toUpperCase() === 'IG' ? 'Igbo' : 'English',
        status: 'released'
      }).select('id').single();

      if (insErr) {
        stats.errors.push(`${movie.title}: ${insErr.message}`);
      } else {
        stats.imported++;
      }
    }

    return res.status(200).json({ ok: true, ...stats });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
