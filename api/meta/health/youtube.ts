import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ status: 'missing_api_key' });
  }

  try {
    const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=US&key=${apiKey}`);
    if (ytRes.ok) {
      return res.status(200).json({ status: 'active' });
    }
    return res.status(ytRes.status).json({ status: 'error' });
  } catch (error) {
    return res.status(500).json({ status: 'unreachable' });
  }
}
