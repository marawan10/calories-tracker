const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('age').optional().isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('height').optional().isFloat({ min: 50, max: 300 }).withMessage('Height must be between 50 and 300 cm'),
  body('weight').optional().isFloat({ min: 20, max: 500 }).withMessage('Weight must be between 20 and 500 kg'),
  body('activityLevel').optional().isIn(['sedentary', 'light', 'moderate', 'active', 'very_active']).withMessage('Invalid activity level'),
  body('goal').optional().isIn(['lose_weight', 'maintain_weight', 'gain_weight']).withMessage('Invalid goal'),
  body('name').optional().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 chars'),
  body('avatar').optional().isString().withMessage('Avatar must be a string URL or data URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { age, gender, height, weight, activityLevel, goal, name, avatar } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // Update profile fields
    if (age !== undefined) user.profile.age = age;
    if (gender !== undefined) user.profile.gender = gender;
    if (height !== undefined) user.profile.height = height;
    if (weight !== undefined) user.profile.weight = weight;
    if (activityLevel !== undefined) user.profile.activityLevel = activityLevel;
    if (goal !== undefined) user.profile.goal = goal;
    // Basic account fields
    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;

    // Auto-calculate daily calorie goal if we have enough data
    if (user.profile.age && user.profile.gender && user.profile.height && user.profile.weight) {
      const calculatedCalories = user.calculateDailyCalories();
      if (calculatedCalories) {
        // Adjust based on goal
        let adjustedCalories = calculatedCalories;
        if (user.profile.goal === 'lose_weight') {
          adjustedCalories = Math.round(calculatedCalories * 0.85); // 15% deficit
        } else if (user.profile.goal === 'gain_weight') {
          adjustedCalories = Math.round(calculatedCalories * 1.15); // 15% surplus
        }
        
        user.dailyGoals.calories = adjustedCalories;
        
        // Calculate macro goals (protein: 25%, carbs: 45%, fat: 30%)
        user.dailyGoals.protein = Math.round((adjustedCalories * 0.25) / 4);
        user.dailyGoals.carbs = Math.round((adjustedCalories * 0.45) / 4);
        user.dailyGoals.fat = Math.round((adjustedCalories * 0.30) / 9);
      }
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        dailyGoals: user.dailyGoals,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Server error while updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/users/goals
// @desc    Update daily nutrition goals
// @access  Private
router.put('/goals', auth, [
  body('calories').optional().isInt({ min: 800, max: 5000 }).withMessage('Calories must be between 800 and 5000'),
  body('protein').optional().isFloat({ min: 20 }).withMessage('Protein must be at least 20g'),
  body('carbs').optional().isFloat({ min: 50 }).withMessage('Carbs must be at least 50g'),
  body('fat').optional().isFloat({ min: 20 }).withMessage('Fat must be at least 20g')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { calories, protein, carbs, fat } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // Update goals
    if (calories !== undefined) user.dailyGoals.calories = calories;
    if (protein !== undefined) user.dailyGoals.protein = protein;
    if (carbs !== undefined) user.dailyGoals.carbs = carbs;
    if (fat !== undefined) user.dailyGoals.fat = fat;

    await user.save();

    res.json({
      message: 'Daily goals updated successfully',
      dailyGoals: user.dailyGoals
    });
  } catch (error) {
    console.error('Update goals error:', error);
    res.status(500).json({
      message: 'Server error while updating goals',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', auth, [
  body('language').optional().isIn(['en', 'ar']).withMessage('Language must be en or ar'),
  body('units').optional().isIn(['metric', 'imperial']).withMessage('Units must be metric or imperial')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { language, units } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // Update preferences
    if (language !== undefined) user.preferences.language = language;
    if (units !== undefined) user.preferences.units = units;

    await user.save();

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      message: 'Server error while updating preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const stats = {
      bmr: user.calculateBMR(),
      dailyCalories: user.calculateDailyCalories(),
      profile: user.profile,
      dailyGoals: user.dailyGoals,
      joinedDate: user.createdAt
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      message: 'Server error while fetching stats',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/users/password
// @desc    Change user password
// @access  Private
router.put('/password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }

    // Set new password (let the pre-save hook handle hashing)
    const oldPasswordHash = user.password;
    user.password = newPassword;
    await user.save();

    // Log for debugging (in development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Password change successful for user:', user.email);
      console.log('Old hash length:', oldPasswordHash.length);
      console.log('New hash length:', user.password.length);
      console.log('Hash format valid:', /^\$2[aby]\$\d{1,2}\$/.test(user.password));
    }

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Server error while changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
