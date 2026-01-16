# TeamConnect MongoDB to Supabase Migration Guide

## Overview
This guide walks you through migrating TeamConnect from MongoDB to Supabase (PostgreSQL) and implementing the requested new features.

## Prerequisites

### 1. Supabase Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > Database to get your:
   - Project URL
   - Service Role Key
3. Enable the UUID extension (usually enabled by default)

### 2. Environment Setup
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp backend/.env.example backend/.env
```

Update the following variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key
- `JWT_SECRET`: Generate a secure random string
- `EMAIL_USER`/`EMAIL_PASS`: Your Gmail credentials for email verification

## Migration Steps

### Step 1: Database Schema Setup

1. **Execute the SQL Schema**
   ```bash
   # Run the complete schema in Supabase SQL Editor
   # Copy contents of: backend/database/schema.sql
   ```

2. **Verify Tables Created**
   The following tables should be created:
   - `users` - User accounts and profiles
   - `teams` - Team information
   - `team_members` - Team membership
   - `team_waitlist` - Team waiting lists
   - `team_messages` - Team chat messages
   - And all other tables from the schema

### Step 2: Backend Migration

1. **Install Dependencies**
   ```bash
   cd backend
   npm install @supabase/supabase-js
   ```

2. **Update Package Dependencies**
   The `package.json` has been updated to:
   - Remove: `mongoose`, `express-mongo-sanitize`
   - Add: `@supabase/supabase-js`

3. **Configuration Files**
   - `config/config.js` - Updated for Supabase
   - `config/supabase.js` - New Supabase client configuration

4. **Model Migration**
   - **Old**: `models/User.js` → **New**: `models/UserModel.js`
   - **Old**: `models/Team.js` → **New**: `models/TeamModel.js`
   - Other models will be migrated in subsequent steps

5. **Controller Migration**
   - **Old**: `controllers/authController.js` → **New**: `controllers/authControllerSupabase.js`
   - **Old**: `controllers/teamController.js` → **New**: `controllers/teamControllerSupabase.js`

6. **Server Migration**
   - **Old**: `server.js` → **New**: `serverSupabase.js`

### Step 3: Testing the Migration

1. **Start the Supabase Server**
   ```bash
   cd backend
   node serverSupabase.js
   ```

2. **Test Basic Functionality**
   - User registration and login
   - Team creation and joining
   - Real-time chat functionality

## New Features Implementation

### 1. Enhanced Player Statistics
The `users` table now includes:
- `league_level` - Player's competitive level
- `years_experience` - Years of playing experience
- `self_rating` - 1-10 self-assessment rating

### 2. Position Selection
Enhanced position support for different sports:
- **Football**: Goalkeeper, Defender, Midfielder, Forward
- **Basketball**: Point Guard, Shooting Guard, Small Forward, Power Forward, Center
- **Volleyball**: Setter, Outside Hitter, Middle Blocker, Libero, Opposite

### 3. Gender Filter for Tournaments
The `tournaments` table includes:
- `gender_filter` - Filter tournaments by male/female/mixed

### 4. Tournament Waiting List
New `tournament_waitlist` table with:
- Maximum 5 people per tournament
- Automatic notification when spots become available

### 5. Google Maps Address Autocomplete
Enhanced `fields` table with:
- `formatted_address` - Full Google Maps address
- `place_id` - Google Places API identifier
- `coordinates_lat`/`coordinates_lng` - Precise location

## Data Migration (If Existing Data)

### Option 1: Manual Export/Import
1. Export MongoDB data to JSON
2. Transform data to match Supabase schema
3. Import using Supabase's CSV import or API

### Option 2: Migration Script
Create a migration script that:
1. Connects to both MongoDB and Supabase
2. Reads data from MongoDB collections
3. Transforms and inserts into Supabase tables

### Key Transformations Needed
- MongoDB `ObjectId` → PostgreSQL `UUID`
- Embedded documents → Related tables
- Mongoose middleware → PostgreSQL triggers
- Array fields → PostgreSQL arrays or junction tables

## Frontend Changes

The frontend (`teamconnect-app`) requires minimal changes:
1. **No database dependencies** - Uses API calls only
2. **Update field names** to match new API responses
3. **Add new UI components** for enhanced features

## Security Considerations

### Row Level Security (RLS)
The schema includes RLS policies:
- Users can only see their own private data
- Public data is visible to all authenticated users
- Team/tournament creators can manage their own content

### API Security
- JWT authentication maintained
- Rate limiting preserved
- Input validation continued

## Performance Optimizations

### Database Indexes
All critical fields are indexed:
- User lookups (email, username)
- Team searches (sport, city, date)
- Full-text search on names and descriptions

### Query Optimization
- Use of PostgreSQL's advanced features
- Efficient JOIN operations
- Proper pagination

## Testing Checklist

### Authentication
- [ ] User registration with email verification
- [ ] Login with refresh tokens
- [ ] Password reset functionality
- [ ] Profile updates

### Teams
- [ ] Team creation
- [ ] Joining teams (including waitlist)
- [ ] Leaving teams
- [ ] Real-time messaging
- [ ] Team management

### New Features
- [ ] Enhanced player statistics
- [ ] Position selection
- [ ] Gender filtering
- [ ] Tournament waitlist
- [ ] Google Maps integration

## Deployment

### Environment Variables
Ensure all required environment variables are set in production:
```bash
NODE_ENV=production
SUPABASE_URL=your_production_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
JWT_SECRET=your_production_jwt_secret
```

### Database Backups
Set up automated backups in Supabase:
1. Go to Settings > Database
2. Configure daily backups
3. Test restore procedures

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
   - Check network connectivity

2. **Authentication Issues**
   - Ensure JWT_SECRET matches between environments
   - Verify token expiration settings

3. **Permission Errors**
   - Check RLS policies
   - Verify service role key permissions

4. **Performance Issues**
   - Review query execution plans
   - Check missing indexes

### Debug Mode
Enable debug logging:
```bash
DEBUG=* node serverSupabase.js
```

## Rollback Plan

If issues arise:
1. Stop Supabase server
2. Start original MongoDB server
3. Restore from backup if needed
4. Revert environment variables

## Next Steps

After completing the core migration:

1. **Migrate remaining models**:
   - Tournaments
   - Matches
   - Fields
   - Activities
   - Notifications
   - PlayerStats
   - Videos

2. **Implement UI improvements**:
   - Replace alert() with modal dialogs
   - Update color scheme (white, beige, light brown)
   - Translate all text to English

3. **Add advanced features**:
   - Enhanced search and filtering
   - Advanced analytics
   - Mobile app integration

## Support

For issues during migration:
1. Check Supabase documentation
2. Review error logs
3. Test with small data sets first
4. Create database backups before major changes
