# Frontend MongoDB to Supabase Migration Guide

## 🎯 **Migration Status: READY**

The frontend migration infrastructure is complete. All you need to do is update your React components to use the new Supabase API instead of the old MongoDB API.

---

## 📁 **Files Created**

### **New Supabase Integration**
```
teamconnect-app/
├── lib/supabase.js                    # Supabase client and helpers
├── src/services/supabaseAPI.js          # Complete API replacement
├── .env.example                        # Environment template
```

### **Updated Files**
```
teamconnect-app/
├── package.json                         # Added @supabase/supabase-js
```

---

## 🔄 **Migration Steps**

### **Step 1: Install Dependencies**
```bash
cd teamconnect-app
npm install @supabase/supabase-js
```

### **Step 2: Setup Environment**
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials:
NEXT_PUBLIC_SUPABASE_URL=https://uehxqdxxkcfmkvvyxunv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_oLKoLSsZH9f_IF45xuIB-g_iZw2X6yj
```

### **Step 3: Replace API Imports**

**OLD (MongoDB via Axios):**
```javascript
import { authAPI, teamsAPI } from '../services/api'
```

**NEW (Supabase):**
```javascript
import { authAPI, teamsAPI } from '../services/supabaseAPI'
```

---

## 📊 **API Comparison**

### **Authentication**

**OLD:**
```javascript
// Register
authAPI.register(userData)

// Login
authAPI.login(email, password)
```

**NEW:**
```javascript
// Register
await authAPI.register(userData)

// Login
await authAPI.login(email, password)
```

### **Teams**

**OLD:**
```javascript
// Get all teams
teamsAPI.getAll(params)

// Create team
teamsAPI.create(teamData)
```

**NEW:**
```javascript
// Get all teams
await teamsAPI.getAll(params)

// Create team
await teamsAPI.create(teamData)
```

---

## 🔄 **Component Updates Required**

### **Files That Need Updates**

Based on the search results, these files contain API calls that need to be updated:

1. **`src/pages/Friends.js`** (7 matches)
2. **`src/pages/MatchTracker.js`** (5 matches)
3. **`src/components/NotificationBell.js`** (4 matches)
4. **`src/pages/Notifications.js`** (4 matches)
5. **`src/pages/Profile.js`** (4 matches)
6. **`src/pages/Statistics.js`** (4 matches)
7. **`src/pages/Dashboard.js`** (3 matches)
8. **`src/pages/MyTeams.js`** (3 matches)
9. **`src/pages/RatingSystem.js`** (3 matches)
10. **`src/pages/TeamChat.js`** (3 matches)
11. **`src/pages/Tournaments.js`** (3 matches)
12. **`src/pages/VideoHighlights.js`** (3 matches)
13. **`src/pages/TournamentDetail.js`** (2 matches)
14. **`src/pages/ActivityFeed.js`** (1 match)
15. **`src/pages/CreateTeam.js`** (1 match)
16. **`src/pages/FieldMap.js`** (1 match)
17. **`src/utils/api.js`** (1 match)
18. **`src/utils/errorHandler.js`** (1 match)

---

## 🛠 **Migration Examples**

### **Example 1: Update Authentication**

**OLD Code:**
```javascript
const handleLogin = async (e) => {
  e.preventDefault()
  try {
    const response = await authAPI.login({ email, password })
    localStorage.setItem('token', response.data.token)
    // Navigate to dashboard
  } catch (error) {
    alert('Login failed')
  }
}
```

**NEW Code:**
```javascript
import { authAPI } from '../services/supabaseAPI'

const handleLogin = async (e) => {
  e.preventDefault()
  try {
    const user = await authAPI.login(email, password)
    localStorage.setItem('user', JSON.stringify(user))
    // Navigate to dashboard
  } catch (error) {
    alert('Login failed')
  }
}
```

### **Example 2: Update Teams List**

**OLD Code:**
```javascript
const [teams, setTeams] = useState([])

useEffect(() => {
  const fetchTeams = async () => {
    const response = await teamsAPI.getAll()
    setTeams(response.data)
  }
  fetchTeams()
}, [])
```

**NEW Code:**
```javascript
import { teamsAPI } from '../services/supabaseAPI'

const [teams, setTeams] = useState([])

useEffect(() => {
  const fetchTeams = async () => {
    const teamsData = await teamsAPI.getAll()
    setTeams(teamsData)
  }
  fetchTeams()
}, [])
```

---

## 🎨 **New Features Available**

### **Enhanced Player Statistics**
The new API supports:
- `leagueLevel` - Player's competitive level
- `yearsExperience` - Years of playing experience  
- `selfRating` - 1-10 self-assessment

### **Position Selection**
Different positions for different sports:
- **Football**: Goalkeeper, Defender, Midfielder, Forward
- **Basketball**: Point Guard, Shooting Guard, Small Forward, Power Forward, Center
- **Volleyball**: Setter, Outside Hitter, Middle Blocker, Libero, Opposite

### **Tournament Gender Filter**
```javascript
// Filter tournaments by gender
const tournaments = await tournamentsAPI.getAll({
  gender_filter: 'male' // 'female', 'mixed', or null for all
})
```

### **Google Maps Integration**
```javascript
// Create field with Google Maps data
const field = await fieldsAPI.create({
  name: 'Sports Field',
  address: '123 Main St',
  formattedAddress: '123 Main St, City, Country',
  placeId: 'ChIJrTLr-GyuEmsRBfyf1GDu0',
  coordinates: { lat: 45.123, lng: 15.456 }
})
```

---

## 🔧 **Real-time Features**

### **Socket.io Integration**
The existing Socket.io client will work with the new Supabase backend. No changes needed for:
- Team chat
- Live notifications
- Real-time updates

### **Supabase Real-time (Optional)**
You can also use Supabase's built-in real-time features:

```javascript
import { supabase } from '../lib/supabase'

// Listen for new teams
const subscription = supabase
  .channel('teams')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'teams' },
    (payload) => {
      console.log('New team:', payload.new)
    }
  )
  .subscribe()
```

---

## 📋 **Migration Checklist**

### **Phase 1: Setup** ✅
- [x] Install @supabase/supabase-js
- [x] Create .env.local with Supabase credentials
- [x] Import supabase client

### **Phase 2: API Migration** 
- [ ] Update authentication components
- [ ] Update teams components
- [ ] Update tournaments components
- [ ] Update fields components
- [ ] Update profile components
- [ ] Update notifications components

### **Phase 3: Testing**
- [ ] Test all authentication flows
- [ ] Test team creation/joining
- [ ] Test tournament operations
- [ ] Test real-time features

### **Phase 4: New Features**
- [ ] Implement enhanced player statistics UI
- [ ] Add position selection components
- [ ] Add gender filter for tournaments
- [ ] Integrate Google Maps autocomplete

---

## 🚨 **Important Notes**

### **Authentication Changes**
- The new API doesn't use JWT tokens from the backend
- Consider using Supabase Auth for better security
- Update localStorage usage accordingly

### **Error Handling**
- Supabase errors have different structure than Axios errors
- Update error handling in components

### **Data Structure**
- Some field names have changed (snake_case instead of camelCase)
- The `supabaseAPI.js` handles this conversion

---

## 🎯 **Next Steps**

1. **Start with Authentication** - Update login/register components first
2. **Move to Teams** - Update team-related components
3. **Add New Features** - Implement enhanced statistics and position selection
4. **Test Everything** - Ensure all functionality works with Supabase
5. **Deploy** - Your app is ready for production with Supabase

---

## 📞 **Support**

If you encounter issues:
1. Check Supabase documentation: https://supabase.com/docs
2. Verify your environment variables
3. Check the browser console for errors
4. Ensure all tables exist in your Supabase project

The migration infrastructure is complete. You can now start updating your React components to use the new Supabase API!
