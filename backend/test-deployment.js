// Simple test file to verify deployment
console.log('Backend deployment test - Google Fit integration should be available');
console.log('Current time:', new Date().toISOString());

// Check if activities routes exist
const fs = require('fs');
const path = require('path');

const activitiesPath = path.join(__dirname, 'routes', 'activities.js');
if (fs.existsSync(activitiesPath)) {
  const content = fs.readFileSync(activitiesPath, 'utf8');
  if (content.includes('sync-google-fit')) {
    console.log('✅ Google Fit routes found in activities.js');
  } else {
    console.log('❌ Google Fit routes NOT found in activities.js');
  }
} else {
  console.log('❌ activities.js file not found');
}
