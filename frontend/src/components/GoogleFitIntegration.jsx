import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Heart, 
  Footprints, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Settings,
  Link,
  Unlink
} from 'lucide-react';
import googleFitService from '../services/googleFit';
import { GOOGLE_FIT_CONFIG } from '../config/googleFit';
import api from '../lib/api';

const GoogleFitIntegration = ({ onDataSync }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fitData, setFitData] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeGoogleFit();
    loadLastSyncTime();
  }, []);

  const initializeGoogleFit = async () => {
    try {
      setIsLoading(true);
      await googleFitService.init(GOOGLE_FIT_CONFIG.CLIENT_ID, GOOGLE_FIT_CONFIG.API_KEY);
      setIsConnected(googleFitService.isUserSignedIn());
      setIsInitialized(true);
      
      if (googleFitService.isUserSignedIn()) {
        await loadTodaysFitData();
      }
    } catch (error) {
      console.error('Failed to initialize Google Fit:', error);
      setError('فشل في تهيئة Google Fit. تحقق من إعدادات API.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLastSyncTime = () => {
    const lastSyncTime = localStorage.getItem('googleFit_lastSync');
    if (lastSyncTime) {
      setLastSync(new Date(lastSyncTime));
    }
  };

  const connectToGoogleFit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await googleFitService.signIn();
      setIsConnected(true);
      
      // Load today's data after connecting
      await loadTodaysFitData();
      
      // Save connection status
      localStorage.setItem('googleFit_connected', 'true');
      
    } catch (error) {
      console.error('Failed to connect to Google Fit:', error);
      setError('فشل في الاتصال بـ Google Fit. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectFromGoogleFit = async () => {
    try {
      setIsLoading(true);
      
      await googleFitService.signOut();
      setIsConnected(false);
      setFitData(null);
      
      // Clear stored data
      localStorage.removeItem('googleFit_connected');
      localStorage.removeItem('googleFit_lastSync');
      
    } catch (error) {
      console.error('Failed to disconnect from Google Fit:', error);
      setError('فشل في قطع الاتصال من Google Fit.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTodaysFitData = async () => {
    try {
      const todaysData = await googleFitService.getTodaysSummary();
      setFitData(todaysData);
      return todaysData;
    } catch (error) {
      console.error('Failed to load today\'s fit data:', error);
      setError('فشل في تحميل بيانات اليوم من Google Fit.');
      return null;
    }
  };

  const syncFitnessData = async (days = 7) => {
    if (!isConnected) {
      setError('يجب الاتصال بـ Google Fit أولاً');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Get fitness data from Google Fit
      const fitnessData = await googleFitService.getFitnessData(startDate, endDate);
      
      // Sync data with your backend
      const response = await api.post('/activities/sync-google-fit', {
        fitnessData: fitnessData,
        syncDate: new Date().toISOString()
      });

      if (response.data.success) {
        // Update last sync time
        const now = new Date();
        setLastSync(now);
        localStorage.setItem('googleFit_lastSync', now.toISOString());
        
        // Load updated today's data
        await loadTodaysFitData();
        
        // Notify parent component
        if (onDataSync) {
          onDataSync(fitnessData);
        }
        
        console.log(`Successfully synced ${fitnessData.length} days of fitness data`);
      }
      
    } catch (error) {
      console.error('Failed to sync fitness data:', error);
      setError('فشل في مزامنة البيانات. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="mr-2 text-slate-600">جاري تهيئة Google Fit...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Google Fit</h3>
            <p className="text-sm text-slate-500">مزامنة بيانات اللياقة البدنية</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>متصل</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>غير متصل</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Controls */}
      <div className="mb-6">
        {!isConnected ? (
          <motion.button
            onClick={connectToGoogleFit}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Link className="w-5 h-5" />
            )}
            <span>{isLoading ? 'جاري الاتصال...' : 'الاتصال بـ Google Fit'}</span>
          </motion.button>
        ) : (
          <div className="flex gap-3">
            <motion.button
              onClick={() => syncFitnessData(7)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{isLoading ? 'جاري المزامنة...' : 'مزامنة البيانات'}</span>
            </motion.button>
            
            <motion.button
              onClick={disconnectFromGoogleFit}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Unlink className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Today's Data */}
      {isConnected && fitData && (
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">السعرات</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {fitData.calories}
            </div>
            <div className="text-xs text-red-500">كالوري محروق</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Footprints className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">الخطوات</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {fitData.steps.toLocaleString()}
            </div>
            <div className="text-xs text-blue-500">خطوة</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-700">المسافة</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {(fitData.distance / 1000).toFixed(1)}
            </div>
            <div className="text-xs text-green-500">كيلومتر</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-700">النبض</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {fitData.heartRate.average || '--'}
            </div>
            <div className="text-xs text-purple-500">نبضة/دقيقة</div>
          </div>
        </motion.div>
      )}

      {/* Last Sync Info */}
      {lastSync && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>آخر مزامنة:</span>
            <span>{lastSync.toLocaleString('ar-EG')}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default GoogleFitIntegration;
