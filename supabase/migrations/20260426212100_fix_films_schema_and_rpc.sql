-- 1. Relax the release_type constraint
ALTER TABLE films DROP CONSTRAINT IF EXISTS films_release_type_check;
ALTER TABLE films ADD CONSTRAINT films_release_type_check CHECK (
  release_type IN (
    'cinema', 
    'youtube', 
    'netflix', 
    'prime_video', 
    'kava', 
    'showmax', 
    'unreleased', 
    'apple_tv', 
    'disney_plus', 
    'hulu',
    'irokotv',
    'youtube_premium'
  )
);

-- 2. Add missing columns used by the UI
ALTER TABLE films ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;
ALTER TABLE films ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE films ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE films ADD COLUMN IF NOT EXISTS release_date DATE;

-- 3. Update the RPC to default to 'youtube' for YouTube imports and handle metadata better
CREATE OR REPLACE FUNCTION batch_create_films_from_videos(video_db_ids UUID[])
RETURNS TABLE(video_id UUID, new_film_id UUID) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    vid UUID;
    fid UUID;
    v_title TEXT;
    v_desc TEXT;
    v_poster TEXT;
    v_url TEXT;
    v_year INT;
    v_published TIMESTAMP;
    v_channel_id UUID;
    v_adapter TEXT;
    target_release_type TEXT;
BEGIN
    FOREACH vid IN ARRAY video_db_ids
    LOOP
        -- Get video details and channel adapter
        SELECT 
            cv.title, cv.description, cv.poster_url, cv.watch_url, cv.published_at, cv.channel_id, c.adapter
        INTO 
            v_title, v_desc, v_poster, v_url, v_published, v_channel_id, v_adapter
        FROM channel_videos cv
        JOIN channels c ON cv.channel_id = c.id
        WHERE cv.id = vid;

        -- Determine release type based on channel adapter
        IF v_adapter = 'kava' THEN
            target_release_type := 'kava';
        ELSE
            target_release_type := 'youtube';
        END IF;

        -- Extract year
        v_year := EXTRACT(YEAR FROM v_published);

        -- Insert into films if not already existing (by title and year or watch_url)
        INSERT INTO films (
            title, 
            synopsis, 
            poster_url, 
            year, 
            release_type, 
            youtube_watch_url,
            status,
            is_trending,
            is_featured
        )
        VALUES (
            v_title, 
            v_desc, 
            v_poster, 
            COALESCE(v_year, 2024), 
            target_release_type, 
            v_url,
            'released',
            false,
            false
        )
        ON CONFLICT (title, year) DO UPDATE SET
            youtube_watch_url = EXCLUDED.youtube_watch_url,
            release_type = EXCLUDED.release_type
        RETURNING id INTO fid;

        -- Link the video to the film
        UPDATE channel_videos 
        SET film_id = fid, 
            match_status = 'manual' 
        WHERE id = vid;

        video_id := vid;
        new_film_id := fid;
        RETURN NEXT;
    END LOOP;
END;
$$;
