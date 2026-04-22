-- Function to merge two people profiles
CREATE OR REPLACE FUNCTION public.merge_people(primary_id uuid, secondary_id uuid)
RETURNS void AS $$
BEGIN
    -- 1. Move all credits from secondary to primary
    UPDATE public.credits 
    SET person_id = primary_id 
    WHERE person_id = secondary_id;

    -- 2. Move all claims
    UPDATE public.profile_claims
    SET person_id = primary_id
    WHERE person_id = secondary_id;

    -- 3. Move all YouTube video links (if table exists)
    -- UPDATE public.youtube_videos SET person_id = primary_id WHERE person_id = secondary_id;

    -- 4. Fill in missing info on primary from secondary
    UPDATE public.people p
    SET 
        bio = COALESCE(p.bio, s.bio),
        photo_url = COALESCE(p.photo_url, s.photo_url),
        date_of_birth = COALESCE(p.date_of_birth, s.date_of_birth),
        tmdb_id = COALESCE(p.tmdb_id, s.tmdb_id),
        nationality = COALESCE(p.nationality, s.nationality),
        youtube_channel_id = COALESCE(p.youtube_channel_id, s.youtube_channel_id),
        popularity_score = GREATEST(p.popularity_score, s.popularity_score)
    FROM public.people s
    WHERE p.id = primary_id AND s.id = secondary_id;

    -- 5. Delete the secondary profile
    DELETE FROM public.people WHERE id = secondary_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to merge two film records
CREATE OR REPLACE FUNCTION public.merge_films(primary_id uuid, secondary_id uuid)
RETURNS void AS $$
BEGIN
    -- 1. Move credits
    -- Note: We might get primary key conflicts if the same person is credited in both.
    -- We'll delete duplicates first.
    DELETE FROM public.credits c_sec
    WHERE c_sec.film_id = secondary_id
    AND EXISTS (
        SELECT 1 FROM public.credits c_pri 
        WHERE c_pri.film_id = primary_id 
        AND c_pri.person_id = c_sec.person_id 
        AND c_pri.role = c_sec.role
    );

    UPDATE public.credits 
    SET film_id = primary_id 
    WHERE film_id = secondary_id;

    -- 2. Move showtimes
    UPDATE public.showtimes 
    SET film_id = primary_id 
    WHERE film_id = secondary_id;

    -- 3. Move genres (handle duplicates)
    DELETE FROM public.film_genres fg_sec
    WHERE fg_sec.film_id = secondary_id
    AND EXISTS (
        SELECT 1 FROM public.film_genres fg_pri
        WHERE fg_pri.film_id = primary_id
        AND fg_pri.genre_id = fg_sec.genre_id
    );

    UPDATE public.film_genres
    SET film_id = primary_id
    WHERE film_id = secondary_id;

    -- 4. Move watch links
    UPDATE public.watch_links
    SET film_id = primary_id
    WHERE film_id = secondary_id;

    -- 5. Fill in missing metadata
    UPDATE public.films p
    SET 
        synopsis = COALESCE(p.synopsis, s.synopsis),
        poster_url = COALESCE(p.poster_url, s.poster_url),
        backdrop_url = COALESCE(p.backdrop_url, s.backdrop_url),
        tmdb_id = COALESCE(p.tmdb_id, s.tmdb_id),
        tmdb_rating = COALESCE(p.tmdb_rating, s.tmdb_rating),
        tagline = COALESCE(p.tagline, s.tagline),
        runtime_minutes = COALESCE(p.runtime_minutes, s.runtime_minutes),
        view_count = COALESCE(p.view_count, 0) + COALESCE(s.view_count, 0)
    FROM public.films s
    WHERE p.id = primary_id AND s.id = secondary_id;

    -- 6. Delete the secondary film
    DELETE FROM public.films WHERE id = secondary_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
