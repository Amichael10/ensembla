-- Migration to fix RLS policies for channel_videos
-- Generated on 2026-05-03

-- 1. Enable RLS on channel_videos
ALTER TABLE public.channel_videos ENABLE ROW LEVEL SECURITY;

-- 2. Allow public read access
DROP POLICY IF EXISTS "Allow public read access to channel_videos" ON public.channel_videos;
CREATE POLICY "Allow public read access to channel_videos"
ON public.channel_videos FOR SELECT USING (true);

-- 3. Allow admins to update (for Hiding)
DROP POLICY IF EXISTS "Allow admins to update channel_videos" ON public.channel_videos;
CREATE POLICY "Allow admins to update channel_videos"
ON public.channel_videos FOR UPDATE
TO authenticated
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 4. Allow admins to delete
DROP POLICY IF EXISTS "Allow admins to delete channel_videos" ON public.channel_videos;
CREATE POLICY "Allow admins to delete channel_videos"
ON public.channel_videos FOR DELETE
TO authenticated
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
