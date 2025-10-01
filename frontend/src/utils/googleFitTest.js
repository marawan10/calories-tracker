// Google Fit Configuration Test Utility
import { GOOGLE_FIT_CONFIG } from '../config/googleFit';

export const testGoogleFitConfig = () => {
  console.log('=== Google Fit Configuration Test ===');
  
  // Check environment variables
  console.log('Environment variables:');
  console.log('VITE_GOOGLE_FIT_CLIENT_ID:', import.meta.env.VITE_GOOGLE_FIT_CLIENT_ID);
  console.log('VITE_GOOGLE_FIT_API_KEY:', import.meta.env.VITE_GOOGLE_FIT_API_KEY);
  
  // Check config object
  console.log('\nConfig object:');
  console.log('CLIENT_ID:', GOOGLE_FIT_CONFIG.CLIENT_ID);
  console.log('API_KEY:', GOOGLE_FIT_CONFIG.API_KEY);
  
  // Validate configuration
  const issues = [];
  
  if (!GOOGLE_FIT_CONFIG.CLIENT_ID || GOOGLE_FIT_CONFIG.CLIENT_ID === 'your-google-client-id.apps.googleusercontent.com') {
    issues.push('CLIENT_ID is not set or using default placeholder');
  }
  
  if (!GOOGLE_FIT_CONFIG.API_KEY || GOOGLE_FIT_CONFIG.API_KEY === 'your-google-api-key') {
    issues.push('API_KEY is not set or using default placeholder');
  }
  
  if (!GOOGLE_FIT_CONFIG.CLIENT_ID.includes('.apps.googleusercontent.com')) {
    issues.push('CLIENT_ID format appears incorrect (should end with .apps.googleusercontent.com)');
  }
  
  if (issues.length > 0) {
    console.error('\n❌ Configuration Issues Found:');
    issues.forEach(issue => console.error(`- ${issue}`));
    return false;
  } else {
    console.log('\n✅ Configuration appears valid');
    return true;
  }
};

export const testGoogleFitAPI = async (accessToken) => {
  if (!accessToken) {
    console.error('No access token provided for API test');
    return false;
  }
  
  console.log('\n=== Testing Google Fit API Access ===');
  
  try {
    // Test basic API access
    const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataSources', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Access Successful');
      console.log('Available data sources:', data.dataSource?.length || 0);
      return true;
    } else {
      const errorData = await response.json();
      console.error('❌ API Access Failed:', errorData);
      return false;
    }
  } catch (error) {
    console.error('❌ API Test Error:', error);
    return false;
  }
};
