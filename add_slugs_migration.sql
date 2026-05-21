-- ============================================================
-- LUMI: Slug-Based URLs Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Add slug columns to all 4 tables
ALTER TABLE channels  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE films     ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE people    ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Step 2: Slug generation helper function
CREATE OR REPLACE FUNCTION generate_slug(input TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN TRIM(
    BOTH '-' FROM
    LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(TRIM(COALESCE(input, '')), '[^a-zA-Z0-9\s]', '', 'g'),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      )
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Populate channels
-- Use channel_handle (strip leading @), fallback to name
UPDATE channels
SET slug = generate_slug(
  COALESCE(
    NULLIF(TRIM(LEADING '@' FROM TRIM(COALESCE(channel_handle, ''))), ''),
    name
  )
)
WHERE slug IS NULL;

-- Handle collisions in channels (add counter)
DO $$
DECLARE
  rec RECORD;
  base_slug TEXT;
  counter INTEGER;
BEGIN
  FOR rec IN
    SELECT id, slug FROM channels
    WHERE slug IN (SELECT slug FROM channels GROUP BY slug HAVING COUNT(*) > 1)
    ORDER BY created_at
  LOOP
    base_slug := rec.slug;
    counter := 2;
    WHILE EXISTS (SELECT 1 FROM channels WHERE slug = base_slug || '-' || counter AND id != rec.id) LOOP
      counter := counter + 1;
    END LOOP;
    UPDATE channels SET slug = base_slug || '-' || counter WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Step 4: Populate films (title-based slug, counter on collision)
UPDATE films SET slug = generate_slug(title) WHERE slug IS NULL;

-- Handle collisions in films (add counter: omo-ghetto, omo-ghetto-2, omo-ghetto-3)
DO $$
DECLARE
  rec RECORD;
  base_slug TEXT;
  counter INTEGER;
BEGIN
  FOR rec IN
    SELECT id, slug FROM films
    WHERE slug IN (SELECT slug FROM films GROUP BY slug HAVING COUNT(*) > 1)
    ORDER BY created_at
  LOOP
    base_slug := rec.slug;
    counter := 2;
    WHILE EXISTS (SELECT 1 FROM films WHERE slug = base_slug || '-' || counter AND id != rec.id) LOOP
      counter := counter + 1;
    END LOOP;
    UPDATE films SET slug = base_slug || '-' || counter WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Step 5: Populate people (name-based slug, counter on collision)
UPDATE people SET slug = generate_slug(name) WHERE slug IS NULL;

DO $$
DECLARE
  rec RECORD;
  base_slug TEXT;
  counter INTEGER;
BEGIN
  FOR rec IN
    SELECT id, slug FROM people
    WHERE slug IN (SELECT slug FROM people GROUP BY slug HAVING COUNT(*) > 1)
    ORDER BY created_at
  LOOP
    base_slug := rec.slug;
    counter := 2;
    WHILE EXISTS (SELECT 1 FROM people WHERE slug = base_slug || '-' || counter AND id != rec.id) LOOP
      counter := counter + 1;
    END LOOP;
    UPDATE people SET slug = base_slug || '-' || counter WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Step 6: Populate companies (name-based slug, counter on collision)
UPDATE companies SET slug = generate_slug(name) WHERE slug IS NULL;

DO $$
DECLARE
  rec RECORD;
  base_slug TEXT;
  counter INTEGER;
BEGIN
  FOR rec IN
    SELECT id, slug FROM companies
    WHERE slug IN (SELECT slug FROM companies GROUP BY slug HAVING COUNT(*) > 1)
    ORDER BY created_at
  LOOP
    base_slug := rec.slug;
    counter := 2;
    WHILE EXISTS (SELECT 1 FROM companies WHERE slug = base_slug || '-' || counter AND id != rec.id) LOOP
      counter := counter + 1;
    END LOOP;
    UPDATE companies SET slug = base_slug || '-' || counter WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Step 7: Indexes for fast slug lookup
CREATE INDEX IF NOT EXISTS idx_channels_slug  ON channels(slug);
CREATE INDEX IF NOT EXISTS idx_films_slug     ON films(slug);
CREATE INDEX IF NOT EXISTS idx_people_slug    ON people(slug);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);

-- Step 8: Auto-generate slug on future INSERTs

CREATE OR REPLACE FUNCTION auto_slug_channels() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(
      COALESCE(NULLIF(TRIM(LEADING '@' FROM TRIM(COALESCE(NEW.channel_handle, ''))), ''), NEW.name)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_slug_films() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_slug_people() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_slug_companies() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_channels_slug  ON channels;
DROP TRIGGER IF EXISTS trg_films_slug     ON films;
DROP TRIGGER IF EXISTS trg_people_slug    ON people;
DROP TRIGGER IF EXISTS trg_companies_slug ON companies;

CREATE TRIGGER trg_channels_slug  BEFORE INSERT ON channels  FOR EACH ROW EXECUTE FUNCTION auto_slug_channels();
CREATE TRIGGER trg_films_slug     BEFORE INSERT ON films     FOR EACH ROW EXECUTE FUNCTION auto_slug_films();
CREATE TRIGGER trg_people_slug    BEFORE INSERT ON people    FOR EACH ROW EXECUTE FUNCTION auto_slug_people();
CREATE TRIGGER trg_companies_slug BEFORE INSERT ON companies FOR EACH ROW EXECUTE FUNCTION auto_slug_companies();

-- ============================================================
-- Verification queries - run after to check results
-- ============================================================
-- SELECT COUNT(*), COUNT(slug), COUNT(*) - COUNT(slug) AS missing FROM films;
-- SELECT COUNT(*), COUNT(slug), COUNT(*) - COUNT(slug) AS missing FROM people;
-- SELECT COUNT(*), COUNT(slug), COUNT(*) - COUNT(slug) AS missing FROM channels;
-- SELECT COUNT(*), COUNT(slug), COUNT(*) - COUNT(slug) AS missing FROM companies;
-- SELECT slug, COUNT(*) FROM films GROUP BY slug HAVING COUNT(*) > 1; -- check no duplicates
