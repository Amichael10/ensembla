import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ status: 'missing_api_key' });
  }

  try {
    const tmdbRes = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${apiKey}`);
    if (tmdbRes.ok) {
      return res.status(200).json({ status: 'active' });
    }
    return res.status(tmdbRes.status).json({ status: 'error' });
  } catch (error) {
    return res.status(500).json({ status: 'unreachable' });
  }
}
