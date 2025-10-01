import { GOOGLE_FIT_CONFIG } from '../config/googleFit';

/**
 * Test if Google Fit configuration is valid
 * @returns {boolean} True if configuration is valid
 */
export const testGoogleFitConfig = () => {
  try {
    // Check if required configuration values exist
    if (!GOOGLE_FIT_CONFIG.CLIENT_ID || GOOGLE_FIT_CONFIG.CLIENT_ID === 'your_google_client_id_here') {
      console.error('Google Fit CLIENT_ID is not configured');
      return false;
    }

    if (!GOOGLE_FIT_CONFIG.API_KEY || GOOGLE_FIT_CONFIG.API_KEY === 'your_google_api_key_here') {
      console.error('Google Fit API_KEY is not configured');
      return false;
    }

    // Check if CLIENT_ID has correct format (should end with .googleusercontent.com)
    if (!GOOGLE_FIT_CONFIG.CLIENT_ID.includes('.googleusercontent.com')) {
      console.error('Google Fit CLIENT_ID format appears invalid');
      return false;
    }

    console.log('Google Fit configuration is valid');
    return true;
  } catch (error) {
    console.error('Error testing Google Fit configuration:', error);
    return false;
  }
};

/**
 * Test Google Fit API access with a token
 * @param {string} accessToken - The access token to test
 * @returns {Promise<boolean>} True if API access is working
 */
export const testGoogleFitAPI = async (accessToken) => {
  try {
    if (!accessToken) {
      console.error('No access token provided for API test');
      return false;
    }

    // Test API access by making a simple request to the fitness API
    const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataSources', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('Google Fit API access test successful');
      return true;
    } else {
      console.error('Google Fit API access test failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error testing Google Fit API access:', error);
    return false;
  }
};

/**
 * Test Google Fit API permissions
 * @param {string} accessToken - The access token to test
 * @returns {Promise<Object>} Object containing permission test results
 */
export const testGoogleFitPermissions = async (accessToken) => {
  const permissions = {
    steps: false,
    calories: false,
    distance: false,
    heartRate: false,
  };

  try {
    // Test steps permission
    const stepsResponse = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataSources?dataTypeName=com.google.step_count.delta', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    permissions.steps = stepsResponse.ok;

    // Test calories permission
    const caloriesResponse = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataSources?dataTypeName=com.google.calories.expended', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    permissions.calories = caloriesResponse.ok;

    // Test distance permission
    const distanceResponse = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataSources?dataTypeName=com.google.distance.delta', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    permissions.distance = distanceResponse.ok;

    // Test heart rate permission
    const heartRateResponse = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataSources?dataTypeName=com.google.heart_rate.bpm', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    permissions.heartRate = heartRateResponse.ok;

    console.log('Google Fit permissions test results:', permissions);
    return permissions;
  } catch (error) {
    console.error('Error testing Google Fit permissions:', error);
    return permissions;
  }
};
