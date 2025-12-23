-- Delete all articles from the database
-- This will also delete enhanced articles due to CASCADE constraint
DELETE FROM articles;

-- Reset the sequence (optional, but recommended for clean IDs)
ALTER SEQUENCE articles_id_seq RESTART WITH 1;


