const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { auth } = require('../middleware/auth');
const FitnessData = require('../models/FitnessData');
const User = require('../models/User');
const Activity = require('../models/Activity');

const router = express.Router();
// @desc    Get predefined activities with MET values
// @access  Private
router.get('/predefined', auth, async (req, res) => {
  try {
    const predefinedActivities = Activity.getPredefinedActivities();
    res.json({
      message: 'Predefined activities retrieved successfully',
      activities: predefinedActivities
    });
  } catch (error) {
    console.error('Error fetching predefined activities:', error);
    res.status(500).json({
      message: 'Server error while fetching predefined activities',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/activities
// @desc    Get user's activities with optional filtering
// @access  Private
router.get('/', [
  auth,
  query('date').optional().isISO8601().withMessage('Date must be in ISO format'),
  query('type').optional().isIn(['cardio', 'strength', 'sports', 'daily', 'other']).withMessage('Invalid activity type'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { date, type, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { user: req.user._id };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }
    
    if (type) {
      query.type = type;
    }

    // Get activities with pagination
    const activities = await Activity.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const total = await Activity.countDocuments(query);

    // Calculate daily totals if date is specified
    let dailyTotals = null;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      const dailyStats = await Activity.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: startDate, $lt: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalCaloriesBurned: { $sum: '$caloriesBurned' },
            totalDuration: { $sum: '$duration' },
            activityCount: { $sum: 1 },
            typeBreakdown: {
              $push: {
                type: '$type',
                calories: '$caloriesBurned',
                duration: '$duration'
              }
            }
          }
        }
      ]);

      if (dailyStats.length > 0) {
        const stats = dailyStats[0];
        
        // Calculate type breakdown
        const typeStats = {};
        stats.typeBreakdown.forEach(item => {
          if (!typeStats[item.type]) {
            typeStats[item.type] = { calories: 0, duration: 0, count: 0 };
          }
          typeStats[item.type].calories += item.calories;
          typeStats[item.type].duration += item.duration;
          typeStats[item.type].count += 1;
        });

        dailyTotals = {
          totalCaloriesBurned: stats.totalCaloriesBurned,
          totalDuration: stats.totalDuration,
          activityCount: stats.activityCount,
          typeBreakdown: typeStats
        };
      }
    }

    res.json({
      message: 'Activities retrieved successfully',
      activities,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      dailyTotals
    });

  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      message: 'Server error while fetching activities',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/activities
// @desc    Create a new activity
// @access  Private
router.post('/', [
  auth,
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Activity name is required and must be less than 100 characters'),
  body('nameAr').optional().trim().isLength({ max: 100 }).withMessage('Arabic name must be less than 100 characters'),
  body('type').isIn(['cardio', 'strength', 'sports', 'daily', 'other']).withMessage('Invalid activity type'),
  body('duration').optional().isInt({ min: 1, max: 1440 }).withMessage('Duration must be between 1 and 1440 minutes'),
  body('intensity').optional().isIn(['low', 'moderate', 'high', 'very_high']).withMessage('Invalid intensity level'),
  body('metValue').optional().isFloat({ min: 1, max: 25 }).withMessage('MET value must be between 1 and 25'),
  body('caloriesBurned').optional().isInt({ min: 1, max: 5000 }).withMessage('Calories burned must be between 1 and 5000'),
  body('date').optional().isISO8601().withMessage('Date must be in ISO format'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, nameAr, type, duration, intensity, metValue, date, notes, caloriesBurned: providedCalories } = req.body;

    let caloriesBurned;
    let finalDuration = duration || 60; // Default duration
    let finalMetValue = metValue || 5.0; // Default MET value

    // If calories are provided directly (from smartwatch), use them
    if (providedCalories) {
      caloriesBurned = providedCalories;
    } else {
      // Otherwise calculate calories using MET formula
      const user = await User.findById(req.user._id);
      if (!user || !user.profile.weight) {
        return res.status(400).json({
          message: 'User weight is required for calorie calculation. Please update your profile.'
        });
      }
      caloriesBurned = Activity.calculateCaloriesBurned(finalMetValue, user.profile.weight, finalDuration);
    }

    // Create activity
    const activity = new Activity({
      user: req.user._id,
      name,
      nameAr,
      type,
      duration: finalDuration,
      intensity: intensity || 'moderate',
      caloriesBurned,
      metValue: finalMetValue,
      date: date ? new Date(date) : new Date(),
      notes
    });

    await activity.save();

    res.status(201).json({
      message: 'Activity created successfully',
      activity
    });

  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({
      message: 'Server error while creating activity',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/activities/:id
// @desc    Get a specific activity
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!activity) {
      return res.status(404).json({
        message: 'Activity not found'
      });
    }

    res.json({
      message: 'Activity retrieved successfully',
      activity
    });

  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      message: 'Server error while fetching activity',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/activities/:id
// @desc    Update an activity
// @access  Private
router.put('/:id', [
  auth,
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Activity name must be less than 100 characters'),
  body('nameAr').optional().trim().isLength({ max: 100 }).withMessage('Arabic name must be less than 100 characters'),
  body('type').optional().isIn(['cardio', 'strength', 'sports', 'daily', 'other']).withMessage('Invalid activity type'),
  body('duration').optional().isInt({ min: 1, max: 1440 }).withMessage('Duration must be between 1 and 1440 minutes'),
  body('intensity').optional().isIn(['low', 'moderate', 'high', 'very_high']).withMessage('Invalid intensity level'),
  body('metValue').optional().isFloat({ min: 1, max: 25 }).withMessage('MET value must be between 1 and 25'),
  body('caloriesBurned').optional().isInt({ min: 1, max: 5000 }).withMessage('Calories burned must be between 1 and 5000'),
  body('date').optional().isISO8601().withMessage('Date must be in ISO format'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const activity = await Activity.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!activity) {
      return res.status(404).json({
        message: 'Activity not found'
      });
    }

    // Update fields
    const { name, nameAr, type, duration, intensity, metValue, date, notes, caloriesBurned: providedCalories } = req.body;
    
    if (name !== undefined) activity.name = name;
    if (nameAr !== undefined) activity.nameAr = nameAr;
    if (type !== undefined) activity.type = type;
    if (duration !== undefined) activity.duration = duration;
    if (intensity !== undefined) activity.intensity = intensity;
    if (metValue !== undefined) activity.metValue = metValue;
    if (date !== undefined) activity.date = new Date(date);
    if (notes !== undefined) activity.notes = notes;

    // Handle calories update
    if (providedCalories !== undefined) {
      // If calories are provided directly (from smartwatch), use them
      activity.caloriesBurned = providedCalories;
    } else if (duration !== undefined || metValue !== undefined) {
      // Otherwise recalculate calories if duration or metValue changed
      const user = await User.findById(req.user._id);
      if (user && user.profile.weight) {
        activity.caloriesBurned = Activity.calculateCaloriesBurned(
          activity.metValue, 
          user.profile.weight, 
          activity.duration
        );
      }
    }

    await activity.save();

    res.json({
      message: 'Activity updated successfully',
      activity
    });

  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({
      message: 'Server error while updating activity',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/activities/:id
// @desc    Delete an activity
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!activity) {
      return res.status(404).json({
        message: 'Activity not found'
      });
    }

    res.json({
      message: 'Activity deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({
      message: 'Server error while deleting activity',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/activities/stats/summary
// @desc    Get activity statistics summary
// @access  Private
router.get('/stats/summary', [
  auth,
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await Activity.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalCaloriesBurned: { $sum: '$caloriesBurned' },
          totalDuration: { $sum: '$duration' },
          totalActivities: { $sum: 1 },
          avgCaloriesPerActivity: { $avg: '$caloriesBurned' },
          avgDurationPerActivity: { $avg: '$duration' },
          typeBreakdown: {
            $push: {
              type: '$type',
              calories: '$caloriesBurned',
              duration: '$duration'
            }
          },
          dailyBreakdown: {
            $push: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              calories: '$caloriesBurned',
              duration: '$duration'
            }
          }
        }
      }
    ]);

    let summary = {
      totalCaloriesBurned: 0,
      totalDuration: 0,
      totalActivities: 0,
      avgCaloriesPerActivity: 0,
      avgDurationPerActivity: 0,
      typeBreakdown: {},
      dailyBreakdown: {}
    };

    if (stats.length > 0) {
      const data = stats[0];
      summary.totalCaloriesBurned = data.totalCaloriesBurned;
      summary.totalDuration = data.totalDuration;
      summary.totalActivities = data.totalActivities;
      summary.avgCaloriesPerActivity = Math.round(data.avgCaloriesPerActivity || 0);
      summary.avgDurationPerActivity = Math.round(data.avgDurationPerActivity || 0);

      // Process type breakdown
      data.typeBreakdown.forEach(item => {
        if (!summary.typeBreakdown[item.type]) {
          summary.typeBreakdown[item.type] = { calories: 0, duration: 0, count: 0 };
        }
        summary.typeBreakdown[item.type].calories += item.calories;
        summary.typeBreakdown[item.type].duration += item.duration;
        summary.typeBreakdown[item.type].count += 1;
      });

      // Process daily breakdown
      data.dailyBreakdown.forEach(item => {
        if (!summary.dailyBreakdown[item.date]) {
          summary.dailyBreakdown[item.date] = { calories: 0, duration: 0, count: 0 };
        }
        summary.dailyBreakdown[item.date].calories += item.calories;
        summary.dailyBreakdown[item.date].duration += item.duration;
        summary.dailyBreakdown[item.date].count += 1;
      });
    }

    res.json({
      message: 'Activity statistics retrieved successfully',
      summary,
      period: `${days} days`
    });

  } catch (error) {
    console.error('Error fetching activity statistics:', error);
    res.status(500).json({
      message: 'Server error while fetching activity statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/activities/sync-google-fit
// @desc    Sync fitness data from Google Fit
// @access  Private
router.post('/sync-google-fit', [
  auth,
  body('fitnessData').isArray().withMessage('Fitness data must be an array'),
  body('syncDate').isISO8601().withMessage('Sync date must be in ISO format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { fitnessData, syncDate } = req.body;
    const syncedRecords = [];
    const syncErrors = [];

    // Process each day's fitness data
    for (const dayData of fitnessData) {
      try {
        const date = new Date(dayData.date);
        
        // Prepare fitness data for storage
        const fitnessRecord = {
          user: req.user._id,
          date: date,
          source: 'google_fit',
          caloriesBurned: dayData.calories || 0,
          steps: dayData.steps || 0,
          distance: dayData.distance || 0,
          heartRate: {
            average: dayData.heartRate?.average || 0,
            min: dayData.heartRate?.min || 0,
            max: dayData.heartRate?.max || 0
          },
          syncedAt: new Date(syncDate),
          rawData: dayData // Store original data for debugging
        };

        // Upsert fitness data (update if exists, create if not)
        const savedRecord = await FitnessData.upsertFitnessData(
          req.user._id,
          date,
          fitnessRecord
        );

        syncedRecords.push({
          date: dayData.date,
          calories: dayData.calories,
          steps: dayData.steps,
          status: 'synced'
        });

      } catch (error) {
        console.error(`Error syncing data for ${dayData.date}:`, error);
        syncErrors.push({
          date: dayData.date,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully synced ${syncedRecords.length} days of fitness data`,
      syncedRecords,
      errors: syncErrors.length > 0 ? syncErrors : undefined,
      syncDate
    });

  } catch (error) {
    console.error('Error syncing Google Fit data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while syncing Google Fit data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/activities/fitness-data
// @desc    Get fitness data (Google Fit + manual activities)
// @access  Private
router.get('/fitness-data', [
  auth,
  query('date').optional().isISO8601().withMessage('Date must be in ISO format'),
  query('startDate').optional().isISO8601().withMessage('Start date must be in ISO format'),
  query('endDate').optional().isISO8601().withMessage('End date must be in ISO format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { date, startDate, endDate } = req.query;

    if (date) {
      // Get single day's fitness data
      const fitnessData = await FitnessData.getDailyTotals(req.user._id, new Date(date));
      
      res.json({
        message: 'Daily fitness data retrieved successfully',
        date,
        dailyTotals: fitnessData
      });
    } else if (startDate && endDate) {
      // Get fitness data for date range
      const summaryStats = await FitnessData.getSummaryStats(
        req.user._id, 
        new Date(startDate), 
        new Date(endDate)
      );
      
      res.json({
        message: 'Fitness data summary retrieved successfully',
        startDate,
        endDate,
        summary: summaryStats
      });
    } else {
      // Get today's data by default
      const today = new Date();
      const fitnessData = await FitnessData.getDailyTotals(req.user._id, today);
      
      res.json({
        message: 'Today\'s fitness data retrieved successfully',
        date: today.toISOString().split('T')[0],
        dailyTotals: fitnessData
      });
    }

  } catch (error) {
    console.error('Error fetching fitness data:', error);
    res.status(500).json({
      message: 'Server error while fetching fitness data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/activities/google-fit/status
// @desc    Get Google Fit sync status
// @access  Private
router.get('/google-fit/status', auth, async (req, res) => {
  try {
    // Get last sync time and data count
    const lastSyncData = await FitnessData.findOne({
      user: req.user._id,
      source: 'google_fit'
    }).sort({ syncedAt: -1 }).limit(1);

    const totalDays = await FitnessData.countDocuments({
      user: req.user._id,
      source: 'google_fit'
    });

    const last7DaysStats = await FitnessData.getSummaryStats(
      req.user._id,
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      new Date()
    );

    res.json({
      message: 'Google Fit status retrieved successfully',
      status: {
        isConnected: !!lastSyncData,
        lastSync: lastSyncData?.syncedAt || null,
        totalDaysSynced: totalDays,
        last7Days: last7DaysStats
      }
    });

  } catch (error) {
    console.error('Error fetching Google Fit status:', error);
    res.status(500).json({
      message: 'Server error while fetching Google Fit status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
