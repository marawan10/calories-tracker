const mongoose = require('mongoose');

const fitnessDataSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  source: {
    type: String,
    enum: ['google_fit', 'manual', 'smartwatch'],
    default: 'google_fit'
  },
  // Calories burned from activities
  caloriesBurned: {
    type: Number,
    default: 0
  },
  // Steps taken
  steps: {
    type: Number,
    default: 0
  },
  // Distance in meters
  distance: {
    type: Number,
    default: 0
  },
  // Heart rate data
  heartRate: {
    average: { type: Number, default: 0 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    resting: { type: Number, default: 0 }
  },
  // Activities breakdown
  activities: [{
    type: {
      type: String,
      enum: ['walking', 'running', 'cycling', 'swimming', 'gym', 'other']
    },
    duration: Number, // in minutes
    calories: Number,
    startTime: Date,
    endTime: Date
  }],
  // Body measurements
  bodyMeasurements: {
    weight: { type: Number }, // in kg
    height: { type: Number }, // in cm
    bodyFat: { type: Number }, // percentage
    muscleMass: { type: Number } // in kg
  },
  // Sync metadata
  syncedAt: {
    type: Date,
    default: Date.now
  },
  googleFitId: String, // Store Google Fit data source ID for deduplication
  
  // Raw data from Google Fit (for debugging)
  rawData: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better query performance
fitnessDataSchema.index({ user: 1, date: -1 });
fitnessDataSchema.index({ user: 1, source: 1, date: -1 });
fitnessDataSchema.index({ googleFitId: 1 }, { sparse: true });

// Static method to get daily totals for a user
fitnessDataSchema.statics.getDailyTotals = async function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const data = await this.findOne({
    user: userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  if (!data) {
    return {
      totalCaloriesBurned: 0,
      totalSteps: 0,
      totalDistance: 0,
      averageHeartRate: 0,
      activities: []
    };
  }

  return {
    totalCaloriesBurned: data.caloriesBurned || 0,
    totalSteps: data.steps || 0,
    totalDistance: data.distance || 0,
    averageHeartRate: data.heartRate?.average || 0,
    activities: data.activities || [],
    bodyMeasurements: data.bodyMeasurements
  };
};

// Static method to get summary statistics for a date range
fitnessDataSchema.statics.getSummaryStats = async function(userId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalCaloriesBurned: { $sum: '$caloriesBurned' },
        totalSteps: { $sum: '$steps' },
        totalDistance: { $sum: '$distance' },
        avgHeartRate: { $avg: '$heartRate.average' },
        daysWithData: { $sum: 1 },
        activeDays: {
          $sum: {
            $cond: [{ $gt: ['$caloriesBurned', 0] }, 1, 0]
          }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  
  if (result.length === 0) {
    return {
      totalCaloriesBurned: 0,
      totalSteps: 0,
      totalDistance: 0,
      avgHeartRate: 0,
      daysWithData: 0,
      activeDays: 0
    };
  }

  const stats = result[0];
  return {
    totalCaloriesBurned: Math.round(stats.totalCaloriesBurned || 0),
    totalSteps: stats.totalSteps || 0,
    totalDistance: Math.round(stats.totalDistance || 0),
    avgHeartRate: Math.round(stats.avgHeartRate || 0),
    daysWithData: stats.daysWithData || 0,
    activeDays: stats.activeDays || 0
  };
};

// Method to upsert fitness data (update if exists, create if not)
fitnessDataSchema.statics.upsertFitnessData = async function(userId, date, fitnessData) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await this.findOneAndUpdate(
    {
      user: userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    },
    {
      $set: {
        ...fitnessData,
        syncedAt: new Date()
      }
    },
    {
      upsert: true,
      new: true,
      runValidators: true
    }
  );
};

module.exports = mongoose.model('FitnessData', fitnessDataSchema);
