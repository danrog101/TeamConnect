DROP TABLE IF EXISTS match_moderators CASCADE;
  DROP TABLE IF EXISTS friend_requests CASCADE;
  DROP TABLE IF EXISTS friendships CASCADE;
  DROP TABLE IF EXISTS video_comments CASCADE;
  DROP TABLE IF EXISTS video_likes CASCADE;
  DROP TABLE IF EXISTS player_match_history CASCADE;
  DROP TABLE IF EXISTS player_stats CASCADE;
  DROP TABLE IF EXISTS notifications CASCADE;
  DROP TABLE IF EXISTS activities CASCADE;
  DROP TABLE IF EXISTS field_reviews CASCADE;
  DROP TABLE IF EXISTS field_facilities CASCADE;
  DROP TABLE IF EXISTS field_images CASCADE;
  DROP TABLE IF EXISTS fields CASCADE;
  DROP TABLE IF EXISTS match_commentary CASCADE;
  DROP TABLE IF EXISTS match_events CASCADE;
  DROP TABLE IF EXISTS match_statistics CASCADE;
  DROP TABLE IF EXISTS match_participants CASCADE;
  DROP TABLE IF EXISTS matches CASCADE;
  DROP TABLE IF EXISTS tournament_bracket CASCADE;
  DROP TABLE IF EXISTS tournament_team_players CASCADE;
  DROP TABLE IF EXISTS tournament_teams CASCADE;
  DROP TABLE IF EXISTS tournament_registrations CASCADE;
  DROP TABLE IF EXISTS tournaments CASCADE;
  DROP TABLE IF EXISTS team_messages CASCADE;
  DROP TABLE IF EXISTS team_waitlist CASCADE;
  DROP TABLE IF EXISTS team_members CASCADE;
  DROP TABLE IF EXISTS teams CASCADE;
  DROP TABLE IF EXISTS videos CASCADE;
  DROP TABLE IF EXISTS users CASCADE;

  -- Drop types
  DROP TYPE IF EXISTS availability_enum CASCADE;
  DROP TYPE IF EXISTS event_type_enum CASCADE;
  DROP TYPE IF EXISTS message_type_enum CASCADE;
  DROP TYPE IF EXISTS video_category_enum CASCADE;
  DROP TYPE IF EXISTS match_status_enum CASCADE;
  DROP TYPE IF EXISTS tournament_status_enum CASCADE;
  DROP TYPE IF EXISTS sport_format_enum CASCADE;
  DROP TYPE IF EXISTS visibility_enum CASCADE;
  DROP TYPE IF EXISTS notification_type_enum CASCADE;
  DROP TYPE IF EXISTS activity_type_enum CASCADE;
  DROP TYPE IF EXISTS rank_enum CASCADE;
  DROP TYPE IF EXISTS profile_visibility_enum CASCADE;
  DROP TYPE IF EXISTS skill_level_enum CASCADE;
  DROP TYPE IF EXISTS team_gender_preference_enum CASCADE;
  DROP TYPE IF EXISTS gender_enum CASCADE;

  -- ============================================
  -- CREATE TYPES
  -- ============================================

  CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
  CREATE TYPE team_gender_preference_enum AS ENUM ('male', 'female', 'mix');
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

  -- ============================================
  -- CREATE TABLES
  -- ============================================

  -- Enable UUID extension
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Users table
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender gender_enum,
    sport VARCHAR(100),
    favorite_sports TEXT[],
    skill_level skill_level_enum,
    position VARCHAR(100),
    league_level VARCHAR(100),
    years_experience INTEGER DEFAULT 0,
    has_self_rated BOOLEAN DEFAULT FALSE,
    self_rating_attack INTEGER DEFAULT NULL,
    self_rating_defense INTEGER DEFAULT NULL,
    self_rating_teamwork INTEGER DEFAULT NULL,
    self_rating_consistency INTEGER DEFAULT NULL,
    self_rated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    location VARCHAR(255),
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Hrvatska',
    avatar VARCHAR(255) DEFAULT '👤',
    bio TEXT,
    cover_photo VARCHAR(255),
    phone VARCHAR(50),
    instagram VARCHAR(100),
    twitter VARCHAR(100),
    facebook VARCHAR(100),
    profile_visibility profile_visibility_enum DEFAULT 'public',
    show_email BOOLEAN DEFAULT FALSE,
    show_phone BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(10),
    is_verified BOOLEAN DEFAULT FALSE,
    total_matches INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_goals INTEGER DEFAULT 0,
    rating_overall INTEGER DEFAULT NULL,
    rating_attack INTEGER DEFAULT NULL,
    rating_defense INTEGER DEFAULT NULL,
    rating_teamwork INTEGER DEFAULT NULL,
    rating_consistency INTEGER DEFAULT NULL,
    rating_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    rank rank_enum DEFAULT NULL,
    skill_level_numeric INTEGER DEFAULT NULL,
    is_amateur BOOLEAN DEFAULT TRUE,
    refresh_token VARCHAR(500),
    refresh_token_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Videos table (must be before activities due to FK)
  CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category video_category_enum DEFAULT 'other',
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    thumbnail VARCHAR(500),
    duration VARCHAR(20),
    file_size BIGINT,
    mime_type VARCHAR(100),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0,
    trending BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    gender_preference team_gender_preference_enum DEFAULT 'mix',
    min_skill_level INTEGER DEFAULT NULL,
    max_skill_level INTEGER DEFAULT NULL,
    amateur_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Team members
  CREATE TABLE team_members (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position VARCHAR(100),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (team_id, user_id)
  );

  -- Team waitlist
  CREATE TABLE team_waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
  );

  -- Team messages
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

  -- Tournaments table
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
    team_size INTEGER DEFAULT 5,
    format sport_format_enum DEFAULT 'knockout',
    entry_fee DECIMAL(10, 2) DEFAULT 0,
    prize VARCHAR(255),
    description TEXT,
    status tournament_status_enum DEFAULT 'upcoming',
    gender_category team_gender_preference_enum DEFAULT 'mix',
    gender_preference team_gender_preference_enum DEFAULT 'mix',
    min_skill_level INTEGER DEFAULT NULL,
    max_skill_level INTEGER DEFAULT NULL,
    amateur_only BOOLEAN DEFAULT FALSE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Tournament registrations
  CREATE TABLE tournament_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_name VARCHAR(255) NOT NULL,
    players JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'registered',
    is_waitlist BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Tournament teams
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

  -- Tournament bracket
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

  -- Match participants
  CREATE TABLE match_participants (
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_side VARCHAR(10),
    PRIMARY KEY (match_id, user_id)
  );

  -- Match statistics
  CREATE TABLE match_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_side VARCHAR(10),
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
    team_side VARCHAR(10),
    player_name VARCHAR(255),
    minute INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Match commentary
  CREATE TABLE match_commentary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    minute INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Fields table
  CREATE TABLE fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sport VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    formatted_address VARCHAR(500),
    place_id VARCHAR(255),
    price DECIMAL(10, 2),
    description TEXT,
    coordinates_lat DECIMAL(10, 8),
    coordinates_lng DECIMAL(11, 8),
    availability availability_enum DEFAULT 'Dostupno',
    rating DECIMAL(3, 2) DEFAULT 0,
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
    rating INTEGER NOT NULL,
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
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    friend_request_id VARCHAR(255),
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Player statistics table
  CREATE TABLE player_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sport VARCHAR(100) NOT NULL,
    total_matches INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    goals_scored INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    clean_sheets INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
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
    result VARCHAR(10),
    score VARCHAR(50),
    goals_scored INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    position VARCHAR(100)
  );

  -- Sport-specific ratings (stores detailed ratings per sport)
  CREATE TABLE sport_ratings (
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

  -- Friendships
  CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
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

  -- ============================================
  -- CREATE INDEXES
  -- ============================================

  CREATE INDEX idx_users_email ON users(email);
  CREATE INDEX idx_users_username ON users(username);
  CREATE INDEX idx_users_sport ON users(sport);
  CREATE INDEX idx_users_city ON users(city);
  CREATE INDEX idx_teams_sport ON teams(sport);
  CREATE INDEX idx_teams_city ON teams(city);
  CREATE INDEX idx_teams_date ON teams(date);
  CREATE INDEX idx_teams_creator ON teams(creator_id);
  CREATE INDEX idx_tournaments_sport ON tournaments(sport);
  CREATE INDEX idx_tournaments_city ON tournaments(city);
  CREATE INDEX idx_tournaments_status ON tournaments(status);
  CREATE INDEX idx_matches_sport ON matches(sport);
  CREATE INDEX idx_matches_status ON matches(status);
  CREATE INDEX idx_fields_sport ON fields(sport);
  CREATE INDEX idx_fields_city ON fields(city);
  CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read);
  CREATE INDEX idx_videos_author ON videos(author_id);
  CREATE INDEX idx_sport_ratings_user ON sport_ratings(user_id);
  CREATE INDEX idx_sport_ratings_sport ON sport_ratings(sport);

  -- ============================================
  -- CREATE FUNCTIONS & TRIGGERS
  -- ============================================

  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
  END;
  $$ language 'plpgsql';

  CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats FOR EACH ROW EXECUTE FUNCTION
  update_updated_at_column();
  CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_sport_ratings_updated_at BEFORE UPDATE ON sport_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 

  