-- Migration: Add sport_ratings table for sport-specific player ratings
-- Run this SQL in your Supabase SQL Editor to add sport-specific ratings support

-- Create the sport_ratings table
CREATE TABLE IF NOT EXISTS sport_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport VARCHAR(100) NOT NULL,
  ratings JSONB NOT NULL DEFAULT '{}',
  overall_rating INTEGER DEFAULT 50,
  skill_level INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sport)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sport_ratings_user ON sport_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_sport_ratings_sport ON sport_ratings(sport);

-- Create trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_sport_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sport_ratings_updated_at ON sport_ratings;
CREATE TRIGGER update_sport_ratings_updated_at
  BEFORE UPDATE ON sport_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_sport_ratings_updated_at();

-- Grant permissions (adjust based on your Supabase setup)
-- ALTER TABLE sport_ratings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own sport ratings" ON sport_ratings FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert their own sport ratings" ON sport_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can update their own sport ratings" ON sport_ratings FOR UPDATE USING (auth.uid() = user_id);

COMMENT ON TABLE sport_ratings IS 'Stores sport-specific skill ratings for users';
COMMENT ON COLUMN sport_ratings.ratings IS 'JSONB object containing category-specific ratings (e.g., {"shooting": 75, "passing": 60})';
COMMENT ON COLUMN sport_ratings.skill_level IS 'Calculated skill level (1-5) based on overall rating';
