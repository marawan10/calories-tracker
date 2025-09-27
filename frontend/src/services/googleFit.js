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

  // Sign in to Google using OAuth 2.0 flow
  async signIn() {
    if (!this.isInitialized) {
      throw new Error('Google Fit API not initialized');
    }

    try {
      if (this.isSignedIn) {
        return true;
      }

      // Use OAuth 2.0 flow for API access
      return new Promise((resolve, reject) => {
        window.gapi.load('auth2', () => {
          window.gapi.auth2.init({
            client_id: this.clientId,
            scope: this.scopes.join(' ')
          }).then(() => {
            const authInstance = window.gapi.auth2.getAuthInstance();
            return authInstance.signIn();
          }).then(() => {
            this.isSignedIn = true;
            console.log('Successfully signed in to Google Fit');
            resolve(true);
          }).catch(error => {
            console.error('Error signing in to Google Fit:', error);
            reject(error);
          });
        });
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
    return this.isInitialized && this.isSignedIn;
  }

  // Get fitness data for a date range
  async getFitnessData(startDate, endDate) {
    if (!this.isUserSignedIn()) {
      throw new Error('User not signed in to Google Fit');
    }

    const startTimeMillis = new Date(startDate).getTime();
    const endTimeMillis = new Date(endDate).getTime();

    try {
      // Get aggregated data for the date range
      const response = await this.gapi.client.fitness.users.dataset.aggregate({
        userId: 'me',
        resource: {
          aggregateBy: [
            { dataTypeName: this.dataTypes.CALORIES_EXPENDED },
            { dataTypeName: this.dataTypes.STEP_COUNT_DELTA },
            { dataTypeName: this.dataTypes.DISTANCE_DELTA },
            { dataTypeName: this.dataTypes.HEART_RATE_BPM }
          ],
          bucketByTime: { durationMillis: 86400000 }, // 1 day buckets
          startTimeMillis: startTimeMillis,
          endTimeMillis: endTimeMillis
        }
      });

      return this.processFitnessData(response.result);
    } catch (error) {
      console.error('Error fetching fitness data:', error);
      throw error;
    }
  }

  // Process raw fitness data into usable format
  processFitnessData(rawData) {
    const processedData = [];

    if (!rawData.bucket) {
      return processedData;
    }

    rawData.bucket.forEach(bucket => {
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

      bucket.dataset.forEach(dataset => {
        dataset.point.forEach(point => {
          switch (dataset.dataSourceId.split(':')[0]) {
            case this.dataTypes.CALORIES_EXPENDED:
              if (point.value && point.value[0]) {
                dayData.calories += point.value[0].fpVal || 0;
              }
              break;
            
            case this.dataTypes.STEP_COUNT_DELTA:
              if (point.value && point.value[0]) {
                dayData.steps += point.value[0].intVal || 0;
              }
              break;
            
            case this.dataTypes.DISTANCE_DELTA:
              if (point.value && point.value[0]) {
                dayData.distance += point.value[0].fpVal || 0;
              }
              break;
            
            case this.dataTypes.HEART_RATE_BPM:
              if (point.value && point.value[0]) {
                const heartRate = point.value[0].fpVal || 0;
                if (heartRate > 0) {
                  dayData.heartRate.average = heartRate;
                  dayData.heartRate.min = Math.min(dayData.heartRate.min || heartRate, heartRate);
                  dayData.heartRate.max = Math.max(dayData.heartRate.max, heartRate);
                }
              }
              break;
          }
        });
      });

      // Round values
      dayData.calories = Math.round(dayData.calories);
      dayData.distance = Math.round(dayData.distance); // meters
      dayData.heartRate.average = Math.round(dayData.heartRate.average);

      processedData.push(dayData);
    });

    return processedData;
  }

  // Get today's fitness summary
  async getTodaysSummary() {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const data = await this.getFitnessData(startOfDay, endOfDay);
    return data.length > 0 ? data[0] : {
      date: today.toISOString().split('T')[0],
      calories: 0,
      steps: 0,
      distance: 0,
      heartRate: { average: 0, min: 0, max: 0 }
    };
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
