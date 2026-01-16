-- TeamConnect Supabase Database Schema
-- Migration from MongoDB to PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE skill_level_enum AS ENUM ('beginner', 'intermediate', 'advanced', 'professional');
CREATE TYPE profile_visibility_enum AS ENUM ('public', 'friends', 'private');
CREATE TYPE rank_enum AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'master');
CREATE TYPE activity_type_enum AS ENUM (
  'team_created', 'team_joined', 'match_played', 'video_uploaded', 
  'tournament_created', 'tournament_joined', 'field_added', 'friend_added',
  'achievement_unlocked', 'rank_up', 'goal_scored', 'match_won'
);
CREATE TYPE notification_type_enum AS ENUM (
  'friend_request', 'friend_accepted', 'team_invite', 'team_joined',
  'match_starting', 'tournament_starting', 'waitlist_spot_available',
  'achievement_unlocked', 'rank_up', 'video_liked', 'video_commented',
  'mention', 'system'
);
CREATE TYPE visibility_enum AS ENUM ('public', 'friends', 'private');
CREATE TYPE sport_format_enum AS ENUM ('knockout', 'league');
CREATE TYPE tournament_status_enum AS ENUM ('upcoming', 'active', 'finished');
CREATE TYPE match_status_enum AS ENUM ('scheduled', 'live', 'finished', 'cancelled');
CREATE TYPE video_category_enum AS ENUM ('goal', 'save', 'skill', 'compilation', 'fail', 'other');
CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'location', 'system');
CREATE TYPE event_type_enum AS ENUM ('goal', 'yellow_card', 'red_card', 'substitution', 'injury', 'other');
CREATE TYPE availability_enum AS ENUM ('Dostupno', 'Rezervirano', 'Nedostupno');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  
  -- Basic info
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  gender gender_enum,
  
  -- Sports preferences
  sport VARCHAR(100),
  favorite_sports TEXT[],
  skill_level skill_level_enum,
  position VARCHAR(100),
  
  -- Enhanced player statistics (NEW FEATURES)
  league_level VARCHAR(100),
  years_experience INTEGER DEFAULT 0,
  self_rating INTEGER CHECK (self_rating >= 1 AND self_rating <= 10),
  
  -- Location
  location VARCHAR(255),
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Hrvatska',
  
  -- Profile
  avatar VARCHAR(255) DEFAULT '👤',
  bio TEXT CHECK (LENGTH(bio) <= 500),
  cover_photo VARCHAR(255),
  
  -- Contact
  phone VARCHAR(50),
  
  -- Social media
  instagram VARCHAR(100),
  twitter VARCHAR(100),
  facebook VARCHAR(100),
  
  -- Privacy
  profile_visibility profile_visibility_enum DEFAULT 'public',
  show_email BOOLEAN DEFAULT FALSE,
  show_phone BOOLEAN DEFAULT FALSE,
  
  -- Verification
  verification_code VARCHAR(10),
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Statistics
  total_matches INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_goals INTEGER DEFAULT 0,
  
  -- Rating system
  rating_overall INTEGER DEFAULT 1000 CHECK (rating_overall >= 0 AND rating_overall <= 3000),
  rating_attack INTEGER DEFAULT 50 CHECK (rating_attack >= 0 AND rating_attack <= 100),
  rating_defense INTEGER DEFAULT 50 CHECK (rating_defense >= 0 AND rating_defense <= 100),
  rating_teamwork INTEGER DEFAULT 50 CHECK (rating_teamwork >= 0 AND rating_teamwork <= 100),
  rating_consistency INTEGER DEFAULT 50 CHECK (rating_consistency >= 0 AND rating_consistency <= 100),
  rating_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ranking
  rank rank_enum DEFAULT 'bronze',
  
  -- JWT tokens
  refresh_token VARCHAR(500),
  refresh_token_expiry TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sport VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) DEFAULT 'Hrvatska',
  date DATE NOT NULL,
  time VARCHAR(50) NOT NULL,
  max_players INTEGER NOT NULL,
  current_players INTEGER DEFAULT 1,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members (many-to-many relationship)
CREATE TABLE team_members (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Team waitlist (NEW - Enhanced for tournaments too)
CREATE TABLE team_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Team messages (chat)
CREATE TABLE team_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type message_type_enum DEFAULT 'text',
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address VARCHAR(255),
  image_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournaments table (Enhanced with new features)
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sport VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_teams INTEGER NOT NULL,
  min_players_per_team INTEGER DEFAULT 5,
  max_players_per_team INTEGER DEFAULT 7,
  team_size INTEGER DEFAULT 5, -- Deprecated, kept for compatibility
  format sport_format_enum DEFAULT 'knockout',
  entry_fee DECIMAL(10, 2) DEFAULT 0,
  prize VARCHAR(255),
  description TEXT,
  status tournament_status_enum DEFAULT 'upcoming',
  
  -- NEW: Gender filter for tournaments
  gender_filter gender_enum, -- male, female, mixed, or null for all
  
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournament waitlist (NEW - Max 5 people)
CREATE TABLE tournament_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- Registered tournament teams
CREATE TABLE tournament_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_name VARCHAR(255) NOT NULL,
  captain_id UUID REFERENCES users(id) ON DELETE SET NULL,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournament team players
CREATE TABLE tournament_team_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_team_id UUID NOT NULL REFERENCES tournament_teams(id) ON DELETE CASCADE,
  name VARCHAR(255),
  position VARCHAR(100)
);

-- Tournament bracket matches
CREATE TABLE tournament_bracket (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  team1_name VARCHAR(255),
  team2_name VARCHAR(255),
  score1 INTEGER DEFAULT 0,
  score2 INTEGER DEFAULT 0,
  winner VARCHAR(255),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  played_date TIMESTAMP WITH TIME ZONE
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team1_name VARCHAR(255) NOT NULL,
  team1_logo VARCHAR(255),
  team2_name VARCHAR(255) NOT NULL,
  team2_logo VARCHAR(255),
  sport VARCHAR(100) NOT NULL,
  venue VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  country VARCHAR(100),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status match_status_enum DEFAULT 'scheduled',
  score_team1 INTEGER DEFAULT 0,
  score_team2 INTEGER DEFAULT 0,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match participants (many-to-many)
CREATE TABLE match_participants (
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_side VARCHAR(10) CHECK (team_side IN ('team1', 'team2')),
  PRIMARY KEY (match_id, user_id)
);

-- Match statistics
CREATE TABLE match_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_side VARCHAR(10) CHECK (team_side IN ('team1', 'team2')),
  possession INTEGER DEFAULT 0,
  shots INTEGER DEFAULT 0,
  shots_on_target INTEGER DEFAULT 0,
  corners INTEGER DEFAULT 0,
  fouls INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0
);

-- Match events
CREATE TABLE match_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  type event_type_enum NOT NULL,
  team_side VARCHAR(10) CHECK (team_side IN ('team1', 'team2')),
  player_name VARCHAR(255),
  minute INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match live commentary
CREATE TABLE match_commentary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  minute INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fields table (Enhanced with Google Maps)
CREATE TABLE fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sport VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  
  -- Enhanced address for Google Maps autocomplete
  formatted_address VARCHAR(500),
  place_id VARCHAR(255), -- Google Places API ID
  
  price DECIMAL(10, 2), -- Price per hour in EUR
  description TEXT,
  
  -- Coordinates
  coordinates_lat DECIMAL(10, 8),
  coordinates_lng DECIMAL(11, 8),
  
  -- Availability
  availability availability_enum DEFAULT 'Dostupno',
  
  -- Rating
  rating DECIMAL(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  
  added_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Field images
CREATE TABLE field_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  filepath VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE
);

-- Field facilities
CREATE TABLE field_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  facility VARCHAR(100) NOT NULL
);

-- Field reviews
CREATE TABLE field_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(field_id, user_id)
);

-- Activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type activity_type_enum NOT NULL,
  visibility visibility_enum DEFAULT 'public',
  
  -- Dynamic activity data
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  team_name VARCHAR(255),
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  video_title VARCHAR(255),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  tournament_name VARCHAR(255),
  field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
  field_name VARCHAR(255),
  friend_id UUID REFERENCES users(id) ON DELETE SET NULL,
  friend_name VARCHAR(255),
  achievement_name VARCHAR(255),
  old_rank VARCHAR(50),
  new_rank VARCHAR(50),
  score VARCHAR(100),
  opponent VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type notification_type_enum NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  
  -- Additional data
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  friend_request_id VARCHAR(255),
  
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player statistics table (Enhanced)
CREATE TABLE player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport VARCHAR(100) NOT NULL,
  
  -- Basic statistics
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  
  -- Sports statistics
  goals_scored INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  clean_sheets INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  
  -- Position statistics
  position_forward INTEGER DEFAULT 0,
  position_midfielder INTEGER DEFAULT 0,
  position_defender INTEGER DEFAULT 0,
  position_goalkeeper INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sport)
);

-- Player match history
CREATE TABLE player_match_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_stats_id UUID NOT NULL REFERENCES player_stats(id) ON DELETE CASCADE,
  match_date DATE,
  opponent VARCHAR(255),
  result VARCHAR(10) CHECK (result IN ('win', 'loss', 'draw')),
  score VARCHAR(50),
  goals_scored INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  position VARCHAR(100)
);

-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category video_category_enum DEFAULT 'other',
  
  -- File info
  filename VARCHAR(255) NOT NULL,
  filepath VARCHAR(500) NOT NULL,
  thumbnail VARCHAR(500),
  duration VARCHAR(20),
  file_size BIGINT,
  mime_type VARCHAR(100),
  
  -- Metadata
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  trending BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video likes
CREATE TABLE video_likes (
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (video_id, user_id)
);

-- Video comments
CREATE TABLE video_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friend relationships
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Friend requests
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- Match moderators
CREATE TABLE match_moderators (
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (match_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_rating_overall ON users(rating_overall DESC);
CREATE INDEX idx_users_rank ON users(rank);
CREATE INDEX idx_users_sport ON users(sport);
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_last_active ON users(last_active DESC);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

CREATE INDEX idx_teams_sport ON teams(sport);
CREATE INDEX idx_teams_city ON teams(city);
CREATE INDEX idx_teams_date ON teams(date);
CREATE INDEX idx_teams_creator ON teams(creator_id);

CREATE INDEX idx_tournaments_sport ON tournaments(sport);
CREATE INDEX idx_tournaments_city ON tournaments(city);
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_creator ON tournaments(creator_id);

CREATE INDEX idx_matches_sport ON matches(sport);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_scheduled_date ON matches(scheduled_date);
CREATE INDEX idx_matches_created_by ON matches(created_by);

CREATE INDEX idx_fields_sport ON fields(sport);
CREATE INDEX idx_fields_city ON fields(city);
CREATE INDEX idx_fields_availability ON fields(availability);
CREATE INDEX idx_fields_rating ON fields(rating DESC);
CREATE INDEX idx_fields_coordinates ON fields(coordinates_lat, coordinates_lng);

CREATE INDEX idx_activities_user ON activities(user_id, created_at DESC);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_visibility ON activities(visibility);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read, created_at DESC);
CREATE INDEX idx_notifications_sender ON notifications(sender_id);
CREATE INDEX idx_notifications_type ON notifications(type);

CREATE INDEX idx_player_stats_user_sport ON player_stats(user_id, sport);

CREATE INDEX idx_videos_author ON videos(author_id);
CREATE INDEX idx_videos_category ON videos(category);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_videos_views ON videos(views DESC);
CREATE INDEX idx_videos_trending ON videos(trending);

-- Full-text search indexes
CREATE INDEX idx_users_search ON users USING gin(to_tsvector('english', username || ' ' || email));
CREATE INDEX idx_teams_search ON teams USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_tournaments_search ON tournaments USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_fields_search ON fields USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_videos_search ON videos USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate average field rating
CREATE OR REPLACE FUNCTION calculate_field_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE fields 
    SET rating = (
        SELECT COALESCE(AVG(rating), 0) 
        FROM field_reviews 
        WHERE field_id = NEW.field_id
    )
    WHERE id = NEW.field_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for field rating calculation
CREATE TRIGGER update_field_rating AFTER INSERT OR UPDATE ON field_reviews FOR EACH ROW EXECUTE FUNCTION calculate_field_rating();

-- Function to enforce tournament waitlist limit (max 5)
CREATE OR REPLACE FUNCTION check_tournament_waitlist_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        SELECT COUNT(*) 
        FROM tournament_waitlist 
        WHERE tournament_id = NEW.tournament_id
    ) >= 5 THEN
        RAISE EXCEPTION 'Tournament waitlist is full (maximum 5 people)';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for tournament waitlist limit
CREATE TRIGGER enforce_tournament_waitlist_limit BEFORE INSERT ON tournament_waitlist FOR EACH ROW EXECUTE FUNCTION check_tournament_waitlist_limit();

-- Function to validate tournament player limits
CREATE OR REPLACE FUNCTION validate_tournament_player_limits()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.max_players_per_team < NEW.min_players_per_team THEN
        RAISE EXCEPTION 'Maximum players per team must be greater than or equal to minimum players';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for tournament player limits
CREATE TRIGGER validate_tournament_players BEFORE INSERT OR UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION validate_tournament_player_limits();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be enhanced based on specific requirements)
CREATE POLICY "Users can view public profiles" ON users FOR SELECT USING (profile_visibility = 'public');
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Teams are publicly viewable" ON teams FOR SELECT USING (true);
CREATE POLICY "Team creators can manage their teams" ON teams FOR ALL USING (creator_id = auth.uid()::text);

CREATE POLICY "Tournaments are publicly viewable" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Tournament creators can manage their tournaments" ON tournaments FOR ALL USING (creator_id = auth.uid()::text);

CREATE POLICY "Matches are publicly viewable" ON matches FOR SELECT USING (true);
CREATE POLICY "Match creators can manage their matches" ON matches FOR ALL USING (created_by = auth.uid()::text);

CREATE POLICY "Fields are publicly viewable" ON fields FOR SELECT USING (true);
CREATE POLICY "Field creators can manage their fields" ON fields FOR ALL USING (added_by = auth.uid()::text);

CREATE POLICY "Users can view own activities" ON activities FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can view public activities" ON activities FOR SELECT USING (visibility = 'public');

CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (recipient_id = auth.uid()::text);

CREATE POLICY "Users can view own player stats" ON player_stats FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can update own player stats" ON player_stats FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Videos are publicly viewable" ON videos FOR SELECT USING (true);
CREATE POLICY "Video authors can manage their videos" ON videos FOR ALL USING (author_id = auth.uid()::text);
