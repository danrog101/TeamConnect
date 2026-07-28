-- Create users table for TeamConnect
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  sport VARCHAR(50),
  location VARCHAR(100),
  city VARCHAR(100),
  skill_level VARCHAR(20),
  gender VARCHAR(10),
  avatar TEXT,
  bio TEXT,
  phone VARCHAR(20),
  date_of_birth DATE,
  
  -- Verification fields
  verification_code VARCHAR(10),
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Rating fields
  rating_overall DECIMAL(3,1) DEFAULT 5.0,
  rating_attack DECIMAL(3,1) DEFAULT 5.0,
  rating_defense DECIMAL(3,1) DEFAULT 5.0,
  rating_teamwork DECIMAL(3,1) DEFAULT 5.0,
  rating_consistency DECIMAL(3,1) DEFAULT 5.0,
  rating_last_updated TIMESTAMP,
  rank VARCHAR(20),
  
  -- Statistics
  total_matches INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_goals INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_sport ON users(sport);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_skill_level ON users(skill_level);
CREATE INDEX IF NOT EXISTS idx_users_rating_overall ON users(rating_overall DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Create policy for users to update their own data
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policy for users to insert their own data
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Allow public read access for user profiles (for finding players)
CREATE POLICY "Public read access to user profiles" ON users
  FOR SELECT USING (true);
