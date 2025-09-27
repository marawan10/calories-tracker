# Google Fit API Integration Setup Guide

This guide will help you integrate Google Fit API with your calories tracker application to sync fitness data like calories burned, steps, heart rate, and activities.

## 🚀 **Quick Overview**

The Google Fit integration allows users to:
- **Sync fitness data** from Google Fit (calories, steps, distance, heart rate)
- **Automatic data import** from fitness trackers and smartwatches
- **Unified dashboard** showing both nutrition and fitness data
- **Historical data sync** for comprehensive health tracking

## 📋 **Prerequisites**

1. **Google Cloud Console Account**
2. **Domain/localhost setup** for OAuth
3. **HTTPS enabled** (required for production)

## 🔧 **Step 1: Google Cloud Console Setup**

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"** or select existing project
3. Enter project name: `"Calories Tracker App"`
4. Click **"Create"**

### 1.2 Enable Google Fitness API
1. In your project, go to **"APIs & Services" > "Library"**
2. Search for **"Fitness API"**
3. Click on **"Fitness API"** and click **"Enable"**

### 1.3 Create OAuth 2.0 Credentials
1. Go to **"APIs & Services" > "Credentials"**
2. Click **"Create Credentials" > "OAuth client ID"**
3. If prompted, configure OAuth consent screen first:
   - Choose **"External"** user type
   - Fill in app name: `"Calories Tracker"`
   - Add your email as developer contact
   - Add scopes: `fitness.activity.read`, `fitness.body.read`, `fitness.heart_rate.read`
4. For OAuth client ID:
   - Application type: **"Web application"**
   - Name: `"Calories Tracker Web Client"`
   - Authorized origins: 
     - `http://localhost:3000` (for development)
     - `https://calories-tracker-6oiu.vercel.app` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000` (for development)
     - `https://calories-tracker-6oiu.vercel.app` (for production)

### 1.4 Create API Key
1. Click **"Create Credentials" > "API key"**
2. Copy the API key
3. (Optional) Restrict the key to Fitness API only

## 🔐 **Step 2: Environment Configuration**

### 2.1 Frontend Environment Variables
Create or update your `.env` file in the frontend directory:

```env
# For Development
VITE_API_URL=http://localhost:5000/api

# For Production (Vercel)
VITE_API_URL=https://calories-tracker-opal.vercel.app/api

# Google Fit API Configuration
REACT_APP_GOOGLE_FIT_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
REACT_APP_GOOGLE_FIT_API_KEY=your-actual-api-key
```

### 2.2 Vercel Environment Variables Setup
**For your production deployment, set these in Vercel Dashboard:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `calories-tracker-6oiu`
3. Go to **Settings > Environment Variables**
4. Add these variables:

```
VITE_API_URL = https://calories-tracker-opal.vercel.app/api
REACT_APP_GOOGLE_FIT_CLIENT_ID = your-actual-client-id.apps.googleusercontent.com
REACT_APP_GOOGLE_FIT_API_KEY = your-actual-api-key
```

### 2.3 Replace Placeholder Values
- Replace `your-actual-client-id.apps.googleusercontent.com` with your OAuth client ID
- Replace `your-actual-api-key` with your API key
- **Redeploy** your frontend after adding environment variables

## 🗄️ **Step 3: Database Setup**

The integration includes a new `FitnessData` model. Make sure your MongoDB is running and the model will be created automatically.

### Database Collections Created:
- `fitnessdata` - Stores Google Fit sync data
- Indexes on `user`, `date`, and `source` for optimal performance

## 🎯 **Step 4: Testing the Integration**

### 4.1 Start Your Application
```bash
# Backend
cd backend
npm start

# Frontend  
cd frontend
npm run dev
```

### 4.2 Test Google Fit Connection
1. Navigate to your dashboard
2. Scroll to the **"Google Fit"** section
3. Click **"الاتصال بـ Google Fit"** (Connect to Google Fit)
4. Sign in with your Google account
5. Grant permissions for fitness data access
6. Click **"مزامنة البيانات"** (Sync Data) to import fitness data

### 4.3 Verify Data Sync
- Check browser console for sync logs
- Verify fitness data appears in the dashboard
- Check MongoDB for `fitnessdata` collection entries

## 📊 **Step 5: Features Overview**

### 5.1 Dashboard Integration
- **Calories Burned**: Shows cumulative calories from Google Fit
- **Steps Counter**: Daily and cumulative step tracking  
- **Heart Rate**: Average heart rate data
- **Distance**: Total distance traveled

### 5.2 API Endpoints Added
- `POST /api/activities/sync-google-fit` - Sync fitness data
- `GET /api/activities/fitness-data` - Get fitness data
- `GET /api/activities/google-fit/status` - Check sync status

### 5.3 Data Storage
- **Automatic deduplication** prevents duplicate entries
- **Source tracking** distinguishes Google Fit vs manual data
- **Raw data preservation** for debugging and future features

## 🔒 **Step 6: Security Considerations**

### 6.1 Production Setup
- **Use HTTPS** - Google requires HTTPS for OAuth in production
- **Restrict API keys** - Limit API key usage to your domain
- **Environment variables** - Never commit API keys to version control

### 6.2 OAuth Consent Screen
- Add privacy policy URL
- Add terms of service URL
- Request only necessary scopes
- Verify domain ownership

## 🐛 **Step 7: Troubleshooting**

### Common Issues:

#### 7.1 "Invalid Client ID" Error
- Verify client ID is correct in `.env` file
- Check authorized origins in Google Cloud Console
- Ensure no extra spaces or characters

#### 7.2 "Access Denied" Error  
- Check OAuth consent screen configuration
- Verify user has Google Fit data
- Ensure scopes are properly configured

#### 7.3 "CORS Error"
- Add your domain to authorized origins
- Check if running on HTTPS in production
- Verify API key restrictions

#### 7.4 No Data Synced
- Check browser console for errors
- Verify user has fitness data in Google Fit
- Check MongoDB connection and collections

### Debug Mode:
Enable debug logging by checking browser console for:
- `"Google Fit API initialized successfully"`
- `"Successfully signed in to Google Fit"`
- `"Cumulative stats received:"`

## 📱 **Step 8: Mobile App Integration (Future)**

The current setup works with web browsers. For mobile app integration:
- Use Google Fit SDK for Android
- Use HealthKit integration for iOS
- Consider React Native Google Fit plugin

## 🎉 **Step 9: Success Verification**

Your Google Fit integration is working correctly when you see:
1. ✅ **Connection Status**: "متصل" (Connected) in dashboard
2. ✅ **Data Display**: Calories, steps, heart rate showing real values
3. ✅ **Sync Status**: Last sync time displayed
4. ✅ **Database**: FitnessData entries in MongoDB
5. ✅ **Console Logs**: No error messages during sync

## 🆘 **Support**

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure Google Cloud Console setup is complete
4. Check MongoDB connection and collections
5. Review API quotas and limits in Google Cloud Console

## 📈 **Next Steps**

Consider adding:
- **Automatic sync scheduling** (hourly/daily)
- **Fitness goals tracking** 
- **Activity type recognition**
- **Sleep data integration**
- **Body composition tracking**

---

**🎯 Your calories tracker now has powerful Google Fit integration for comprehensive health and fitness tracking!**
