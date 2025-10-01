import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { GOOGLE_FIT_CONFIG } from '../config/googleFit';
import { testGoogleFitConfig, testGoogleFitAPI } from '../utils/googleFitTest';

const GoogleFitDebug = () => {
  const [showSensitive, setShowSensitive] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const runDiagnostics = async () => {
    console.log('Running Google Fit diagnostics...');
    
    const results = {
      configTest: testGoogleFitConfig(),
      envVars: {
        clientId: import.meta.env.VITE_GOOGLE_FIT_CLIENT_ID,
        apiKey: import.meta.env.VITE_GOOGLE_FIT_API_KEY,
        mode: import.meta.env.MODE,
        prod: import.meta.env.PROD
      },
      configValues: {
        clientId: GOOGLE_FIT_CONFIG.CLIENT_ID,
        apiKey: GOOGLE_FIT_CONFIG.API_KEY
      },
      issues: []
    };

    // Check for common issues
    if (!results.envVars.clientId) {
      results.issues.push('VITE_GOOGLE_FIT_CLIENT_ID environment variable is not set');
    }
    
    if (!results.envVars.apiKey) {
      results.issues.push('VITE_GOOGLE_FIT_API_KEY environment variable is not set');
    }
    
    if (results.configValues.clientId === 'your-google-client-id.apps.googleusercontent.com') {
      results.issues.push('CLIENT_ID is still using placeholder value');
    }
    
    if (results.configValues.apiKey === 'your-google-api-key') {
      results.issues.push('API_KEY is still using placeholder value');
    }

    if (results.envVars.clientId !== results.configValues.clientId) {
      results.issues.push('Environment variable and config CLIENT_ID mismatch');
    }

    if (results.envVars.apiKey !== results.configValues.apiKey) {
      results.issues.push('Environment variable and config API_KEY mismatch');
    }

    setTestResults(results);
  };

  const maskValue = (value, show) => {
    if (!value) return 'Not set';
    if (show) return value;
    return value.substring(0, 8) + '...' + value.substring(value.length - 4);
  };

  return (
    <motion.div 
      className="card p-6 mb-6 border-orange-200 bg-orange-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-orange-600" />
        <div>
          <h3 className="font-bold text-orange-800">Google Fit Debug Panel</h3>
          <p className="text-sm text-orange-600">Diagnostic information for troubleshooting</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={runDiagnostics}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Run Diagnostics
          </button>
          
          <button
            onClick={() => setShowSensitive(!showSensitive)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {showSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showSensitive ? 'Hide' : 'Show'} Sensitive Data
          </button>
        </div>

        {testResults && (
          <div className="space-y-4">
            {/* Environment Variables */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-3 text-gray-800">Environment Variables</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">VITE_GOOGLE_FIT_CLIENT_ID:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {maskValue(testResults.envVars.clientId, showSensitive)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">VITE_GOOGLE_FIT_API_KEY:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {maskValue(testResults.envVars.apiKey, showSensitive)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">MODE:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {testResults.envVars.mode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">PROD:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {testResults.envVars.prod ? 'true' : 'false'}
                  </span>
                </div>
              </div>
            </div>

            {/* Config Values */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-3 text-gray-800">Config Values</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">CLIENT_ID:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {maskValue(testResults.configValues.clientId, showSensitive)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">API_KEY:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {maskValue(testResults.configValues.apiKey, showSensitive)}
                  </span>
                </div>
              </div>
            </div>

            {/* Issues */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-3 text-gray-800">Issues Found</h4>
              {testResults.issues.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">No configuration issues detected</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {testResults.issues.map((issue, index) => (
                    <div key={index} className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">{issue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold mb-2 text-blue-800">Setup Instructions</h4>
              <div className="text-sm text-blue-700 space-y-2">
                <p>1. Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></p>
                <p>2. Enable the Fitness API</p>
                <p>3. Create OAuth 2.0 credentials</p>
                <p>4. Add your domain to authorized origins</p>
                <p>5. Set environment variables in Vercel:</p>
                <div className="bg-blue-100 p-2 rounded font-mono text-xs">
                  VITE_GOOGLE_FIT_CLIENT_ID=your-client-id.apps.googleusercontent.com<br/>
                  VITE_GOOGLE_FIT_API_KEY=your-api-key
                </div>
                <p>6. Redeploy your application after setting environment variables</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GoogleFitDebug;
