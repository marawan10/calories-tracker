// Google Fit API Configuration
// You need to get these from Google Cloud Console:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project or select existing one
// 3. Enable Google Fitness API
// 4. Create credentials (OAuth 2.0 Client ID)
// 5. Add your domain to authorized origins

export const GOOGLE_FIT_CONFIG = {
  // Replace with your actual Google Cloud Console credentials
  CLIENT_ID: import.meta.env.REACT_APP_GOOGLE_FIT_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com',
  API_KEY: import.meta.env.REACT_APP_GOOGLE_FIT_API_KEY || 'your-google-api-key',
  
  // Scopes for Google Fit API
  SCOPES: [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.location.read'
  ],
  
  // Data types we want to sync
  DATA_TYPES: {
    CALORIES_EXPENDED: 'com.google.calories.expended',
    STEP_COUNT_DELTA: 'com.google.step_count.delta',
    HEART_RATE_BPM: 'com.google.heart_rate.bpm',
    WEIGHT: 'com.google.weight',
    HEIGHT: 'com.google.height',
    DISTANCE_DELTA: 'com.google.distance.delta',
    ACTIVITY_SEGMENT: 'com.google.activity.segment'
  }
};

// Environment variables you need to add to your .env file:
/*
REACT_APP_GOOGLE_FIT_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
REACT_APP_GOOGLE_FIT_API_KEY=your-google-api-key
*/
