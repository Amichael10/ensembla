-- Migration to add social media links to actor & crew profiles in the people table
ALTER TABLE public.people 
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT;

COMMENT ON COLUMN public.people.instagram_url IS 'Instagram profile URL of the actor/crew member';
COMMENT ON COLUMN public.people.facebook_url IS 'Facebook profile URL of the actor/crew member';
COMMENT ON COLUMN public.people.twitter_url IS 'X (Twitter) profile URL of the actor/crew member';
