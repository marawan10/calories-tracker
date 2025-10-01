// Google Fit API Integration Service
class GoogleFitService {
  constructor() {
    this.isInitialized = false;
    this.isSignedIn = false;
    this.gapi = null;
    
    // Google Fit API scopes
    this.scopes = [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.body.read',
      'https://www.googleapis.com/auth/fitness.heart_rate.read',
      'https://www.googleapis.com/auth/fitness.location.read'
    ];
    
    // Data source types we want to read
    this.dataTypes = {
      CALORIES_EXPENDED: 'com.google.calories.expended',
      STEP_COUNT_DELTA: 'com.google.step_count.delta',
      HEART_RATE_BPM: 'com.google.heart_rate.bpm',
      WEIGHT: 'com.google.weight',
      HEIGHT: 'com.google.height',
      DISTANCE_DELTA: 'com.google.distance.delta',
      ACTIVITY_SEGMENT: 'com.google.activity.segment'
    };
  }

  // Initialize Google API with new Google Identity Services
  async init(clientId, apiKey) {
    return new Promise((resolve, reject) => {
      if (this.isInitialized) {
        resolve(true);
        return;
      }

      this.clientId = clientId;
      this.apiKey = apiKey;

      // Load Google Identity Services script
      if (!window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
          this.loadGoogleIdentityServices(resolve, reject);
        };
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(script);
      } else {
        this.loadGoogleIdentityServices(resolve, reject);
      }
    });
  }

  loadGoogleIdentityServices(resolve, reject) {
    try {
      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: this.handleCredentialResponse.bind(this)
      });

      // Load GAPI for API calls
      if (!window.gapi) {
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.onload = () => {
          window.gapi.load('client', async () => {
            await window.gapi.client.init({
              apiKey: this.apiKey,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest']
            });
            
            this.gapi = window.gapi;
            this.isInitialized = true;
            console.log('Google Fit API initialized successfully with GIS');
            resolve(true);
          });
        };
        gapiScript.onerror = () => reject(new Error('Failed to load GAPI'));
        document.head.appendChild(gapiScript);
      } else {
        window.gapi.load('client', async () => {
          await window.gapi.client.init({
            apiKey: this.apiKey,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest']
          });
          
          this.gapi = window.gapi;
          this.isInitialized = true;
          console.log('Google Fit API initialized successfully with GIS');
          resolve(true);
        });
      }
    } catch (error) {
      console.error('Error initializing Google Identity Services:', error);
      reject(error);
    }
  }

  handleCredentialResponse(response) {
    // Handle the credential response
    console.log('Credential response:', response);
    this.isSignedIn = true;
  }

  // Sign in to Google using modern OAuth 2.0 flow
  async signIn() {
    if (!this.isInitialized) {
      throw new Error('Google Fit API not initialized');
    }

    try {
      if (this.isSignedIn) {
        return true;
      }

      // Use Google OAuth 2.0 popup flow
      return new Promise((resolve, reject) => {
        // Create OAuth URL
        const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
        const params = new URLSearchParams({
          client_id: this.clientId,
          redirect_uri: `${window.location.origin}/google-auth-callback.html`,
          response_type: 'token',
          scope: this.scopes.join(' '),
          include_granted_scopes: 'true',
          state: 'google_fit_auth'
        });

        const authUrl = `${oauth2Endpoint}?${params.toString()}`;
        
        // Open popup window
        const popup = window.open(
          authUrl,
          'google-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for popup messages
        const messageListener = (event) => {
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            this.accessToken = event.data.access_token;
            this.tokenExpiry = Date.now() + (3600 * 1000); // Assume 1 hour expiry
            this.isSignedIn = true;
            window.removeEventListener('message', messageListener);
            popup.close();
            console.log('Successfully signed in to Google Fit');
            console.log('Access token received:', this.accessToken ? 'Yes' : 'No');
            resolve(true);
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            window.removeEventListener('message', messageListener);
            popup.close();
            console.error('Google Auth Error:', event.data.error);
            reject(new Error(event.data.error));
          }
        };

        window.addEventListener('message', messageListener);

        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            reject(new Error('Authentication popup was closed'));
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          if (!popup.closed) {
            popup.close();
          }
          reject(new Error('Authentication timeout'));
        }, 300000);
      });
    } catch (error) {
      console.error('Error signing in to Google Fit:', error);
      throw error;
    }
  }

  // Sign out from Google
  async signOut() {
    if (!this.isInitialized) {
      return;
    }

    try {
      if (window.gapi && window.gapi.auth2) {
        const authInstance = window.gapi.auth2.getAuthInstance();
        if (authInstance) {
          await authInstance.signOut();
        }
      }
      
      // Also sign out from Google Identity Services
      if (window.google && window.google.accounts) {
        window.google.accounts.id.disableAutoSelect();
      }
      
      this.isSignedIn = false;
      console.log('Successfully signed out from Google Fit');
    } catch (error) {
      console.error('Error signing out from Google Fit:', error);
      throw error;
    }
  }

  // Check if user is signed in
  isUserSignedIn() {
    return this.isInitialized && this.isSignedIn && this.accessToken && this.isTokenValid();
  }

  // Check if access token is still valid
  isTokenValid() {
    if (!this.accessToken || !this.tokenExpiry) {
      return false;
    }
    return Date.now() < this.tokenExpiry;
  }

  // Get fitness data for a date range
  async getFitnessData(startDate, endDate) {
    if (!this.isUserSignedIn()) {
      throw new Error('User not signed in to Google Fit');
    }

    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const startTimeMillis = new Date(startDate).getTime();
    const endTimeMillis = new Date(endDate).getTime();

    try {
      console.log('Making fitness data request with token:', this.accessToken ? 'Present' : 'Missing');
      console.log('Token validity:', this.isTokenValid());
      console.log('Request timeframe:', new Date(startTimeMillis), 'to', new Date(endTimeMillis));
      
      // Use direct fetch with proper headers
      const requestBody = {
        aggregateBy: [
          { dataTypeName: this.dataTypes.CALORIES_EXPENDED },
          { dataTypeName: this.dataTypes.STEP_COUNT_DELTA },
          { dataTypeName: this.dataTypes.DISTANCE_DELTA },
          { dataTypeName: this.dataTypes.HEART_RATE_BPM }
        ],
        bucketByTime: { durationMillis: 86400000 }, // 1 day buckets
        startTimeMillis: startTimeMillis,
        endTimeMillis: endTimeMillis
      };
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Fit API Error Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: { message: errorText } };
        }
        
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || errorText}`);
      }

      const result = await response.json();
      console.log('API Response:', result);
      return this.processFitnessData(result);
    } catch (error) {
      console.error('Error fetching fitness data:', error);
      throw error;
    }
  }

  // Process raw fitness data into usable format
  processFitnessData(rawData) {
    console.log('Processing raw fitness data:', rawData);
    const processedData = [];

    if (!rawData.bucket || !Array.isArray(rawData.bucket)) {
      console.log('No bucket data found in response');
      return processedData;
    }

    rawData.bucket.forEach((bucket, bucketIndex) => {
      console.log(`Processing bucket ${bucketIndex}:`, bucket);
      const startTime = new Date(parseInt(bucket.startTimeMillis));
      const date = startTime.toISOString().split('T')[0];

      const dayData = {
        date: date,
        calories: 0,
        steps: 0,
        distance: 0,
        heartRate: {
          average: 0,
          min: 0,
          max: 0
        }
      };

      if (bucket.dataset && Array.isArray(bucket.dataset)) {
        bucket.dataset.forEach((dataset, datasetIndex) => {
          console.log(`Processing dataset ${datasetIndex}:`, dataset);
          
          if (dataset.point && Array.isArray(dataset.point)) {
            dataset.point.forEach((point, pointIndex) => {
              console.log(`Processing point ${pointIndex}:`, point);
              
              // Check dataSourceId or dataTypeName
              const dataType = dataset.dataSourceId || dataset.dataTypeName || '';
              
              if (dataType.includes('calories.expended')) {
                if (point.value && point.value[0]) {
                  dayData.calories += point.value[0].fpVal || 0;
                }
              } else if (dataType.includes('step_count.delta')) {
                if (point.value && point.value[0]) {
                  dayData.steps += point.value[0].intVal || 0;
                }
              } else if (dataType.includes('distance.delta')) {
                if (point.value && point.value[0]) {
                  dayData.distance += point.value[0].fpVal || 0;
                }
              } else if (dataType.includes('heart_rate.bpm')) {
                if (point.value && point.value[0]) {
                  const heartRate = point.value[0].fpVal || 0;
                  if (heartRate > 0) {
                    dayData.heartRate.average = heartRate;
                    dayData.heartRate.min = Math.min(dayData.heartRate.min || heartRate, heartRate);
                    dayData.heartRate.max = Math.max(dayData.heartRate.max, heartRate);
                  }
                }
              }
            });
          }
        });
      }

      // Round values
      dayData.calories = Math.round(dayData.calories);
      dayData.distance = Math.round(dayData.distance); // meters
      dayData.heartRate.average = Math.round(dayData.heartRate.average);

      console.log('Processed day data:', dayData);
      processedData.push(dayData);
    });

    console.log('Final processed data:', processedData);
    return processedData;
  }

  // Get today's fitness summary
  async getTodaysSummary() {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      console.log('Fetching today\'s data from:', startOfDay, 'to:', endOfDay);
      const data = await this.getFitnessData(startOfDay, endOfDay);
      
      const todaysData = data.length > 0 ? data[0] : {
        date: today.toISOString().split('T')[0],
        calories: 0,
        steps: 0,
        distance: 0,
        heartRate: { average: 0, min: 0, max: 0 }
      };
      
      console.log('Today\'s fitness data:', todaysData);
      return todaysData;
    } catch (error) {
      console.error('Error in getTodaysSummary:', error);
      throw error;
    }
  }

  // Get body measurements (weight, height)
  async getBodyMeasurements(startDate, endDate) {
    if (!this.isUserSignedIn()) {
      throw new Error('User not signed in to Google Fit');
    }

    const startTimeMillis = new Date(startDate).getTime();
    const endTimeMillis = new Date(endDate).getTime();

    try {
      const response = await this.gapi.client.fitness.users.dataSources.datasets.get({
        userId: 'me',
        dataSourceId: 'derived:com.google.weight:com.google.android.gms:merge_weight',
        datasetId: `${startTimeMillis * 1000000}-${endTimeMillis * 1000000}`
      });

      const measurements = [];
      if (response.result.point) {
        response.result.point.forEach(point => {
          const date = new Date(parseInt(point.startTimeNanos) / 1000000);
          const weight = point.value[0].fpVal;
          
          measurements.push({
            date: date.toISOString().split('T')[0],
            weight: Math.round(weight * 10) / 10 // Round to 1 decimal
          });
        });
      }

      return measurements;
    } catch (error) {
      console.error('Error fetching body measurements:', error);
      return [];
    }
  }
}

// Export singleton instance
export default new GoogleFitService();
