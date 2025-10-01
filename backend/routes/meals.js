const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Meal = require('../models/Meal');
const Food = require('../models/Food');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/meals
// @desc    Get user's meals with filtering
// @access  Private
router.get('/', auth, [
  query('date').optional().isISO8601().withMessage('Invalid date format'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('mealType').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { date, startDate, endDate, mealType, limit = 20, page = 1 } = req.query;

    // Build query
    const query = { user: req.user._id };

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    if (mealType) {
      query.mealType = mealType;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const meals = await Meal.find(query)
      .populate('items.food', 'name nameAr category nutrition')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Meal.countDocuments(query);

    res.json({
      meals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({
      message: 'Server error while fetching meals',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/meals/daily/:date
// @desc    Get daily meal summary and totals
// @access  Private
router.get('/daily/:date', auth, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const { dailyTotals, meals } = await Meal.getDailyTotals(req.user._id, date);

    // Group meals by type
    const mealsByType = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    };

    meals.forEach(meal => {
      if (mealsByType[meal.mealType]) {
        mealsByType[meal.mealType].push(meal);
      }
    });

    res.json({
      date: date.toISOString().split('T')[0],
      dailyTotals,
      mealsByType,
      totalMeals: meals.length
    });
  } catch (error) {
    console.error('Get daily meals error:', error);
    res.status(500).json({
      message: 'Server error while fetching daily meals',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/meals/stats
// @desc    Get meal statistics for a date range
// @access  Private
router.get('/stats', auth, [
  query('startDate').optional().isISO8601().withMessage('Start date must be valid'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid'),
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

    let { startDate, endDate, days } = req.query;
    
    // If days parameter is provided, calculate startDate and endDate
    if (days) {
      const endDateObj = new Date();
      const startDateObj = new Date();
      startDateObj.setDate(endDateObj.getDate() - parseInt(days) + 1);
      
      startDate = startDateObj.toISOString();
      endDate = endDateObj.toISOString();
    }
    
    // Validate that we have both dates
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'Either provide startDate and endDate, or provide days parameter'
      });
    }
    
    const stats = await Meal.getStatistics(
      req.user._id, 
      new Date(startDate), 
      new Date(endDate)
    );

    res.json(stats);
  } catch (error) {
    console.error('Get meal stats error:', error);
    res.status(500).json({
      message: 'Server error while fetching meal statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/meals/:id
// @desc    Get single meal by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id)
      .populate('items.food', 'name nameAr category nutrition');
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Check if user owns this meal
    if (!meal.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied to this meal' });
    }

    res.json(meal);
  } catch (error) {
    console.error('Get meal error:', error);
    res.status(500).json({
      message: 'Server error while fetching meal',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/meals
// @desc    Create a new meal
// @access  Private
router.post('/', auth, [
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('mealType').isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('items').isArray({ min: 1 }).withMessage('At least one food item is required'),
  body('items.*.food').isMongoId().withMessage('Invalid food ID'),
  body('items.*.weight').isFloat({ min: 0.1, max: 5000 }).withMessage('Weight must be between 0.1 and 5000'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { date, mealType, items, notes } = req.body;

    // Validate and calculate nutrition for each item
    const processedItems = [];
    
    for (const item of items) {
      // Processing meal item
      
      const food = await Food.findById(item.food);
      
      if (!food) {
        console.error('Food not found:', item.food);
        return res.status(400).json({
          message: `Food with ID ${item.food} not found`
        });
      }

      // Found food for meal item

      // Check if user can access this food
      if (!food.isPublic && !food.createdBy.equals(req.user._id)) {
        return res.status(403).json({
          message: `Access denied to food: ${food.name}`
        });
      }

      try {
        // Calculate nutrition for the specified weight
        const nutrition = food.calculateNutrition(item.weight);
        // Calculated nutrition for item
        
        processedItems.push({
          food: food._id,
          weight: item.weight,
          nutrition
        });
      } catch (error) {
        console.error('Error calculating nutrition:', error);
        return res.status(500).json({
          message: `Error calculating nutrition for ${food.name}`,
          error: error.message
        });
      }
    }

    // Create meal
    const meal = new Meal({
      user: req.user._id,
      date: date ? new Date(date) : new Date(),
      mealType,
      items: processedItems,
      notes
    });

    await meal.save();
    
    // Populate food details for response
    await meal.populate('items.food', 'name nameAr category nutrition');

    res.status(201).json({
      message: 'Meal logged successfully',
      meal
    });
  } catch (error) {
    console.error('Create meal error:', error);
    res.status(500).json({
      message: 'Server error while creating meal',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/meals/:id
// @desc    Update a meal
// @access  Private
router.put('/:id', auth, [
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('mealType').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('items').optional().isArray({ min: 1 }).withMessage('At least one food item is required'),
  body('items.*.food').if(body('items').exists()).isMongoId().withMessage('Invalid food ID'),
  body('items.*.weight').if(body('items').exists()).isFloat({ min: 0.1, max: 5000 }).withMessage('Weight must be between 0.1 and 5000'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const meal = await Meal.findById(req.params.id);
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Check if user owns this meal
    if (!meal.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied. You can only update your own meals.' });
    }

    const { date, mealType, items, notes } = req.body;

    // Update basic fields
    if (date) meal.date = new Date(date);
    if (mealType) meal.mealType = mealType;
    if (notes !== undefined) meal.notes = notes;

    // Update items if provided
    if (items) {
      const processedItems = [];
      
      for (const item of items) {
        // Processing meal item for update
        
        const food = await Food.findById(item.food);
        
        if (!food) {
          console.error('UPDATE - Food not found:', item.food);
          return res.status(400).json({
            message: `Food with ID ${item.food} not found`
          });
        }

        // Found food for meal item update

        // Check if user can access this food
        if (!food.isPublic && !food.createdBy.equals(req.user._id)) {
          return res.status(403).json({
            message: `Access denied to food: ${food.name}`
          });
        }

        try {
          // Calculate nutrition for the specified weight
          const nutrition = food.calculateNutrition(item.weight);
          // Calculated nutrition for item update
          
          processedItems.push({
            food: food._id,
            weight: item.weight,
            nutrition
          });
        } catch (error) {
          console.error('UPDATE - Error calculating nutrition:', error);
          return res.status(500).json({
            message: `Error calculating nutrition for ${food.name}`,
            error: error.message
          });
        }
      }

      meal.items = processedItems;
    }

    await meal.save();
    
    // Populate food details for response
    await meal.populate('items.food', 'name nameAr category nutrition');

    res.json({
      message: 'Meal updated successfully',
      meal
    });
  } catch (error) {
    console.error('Update meal error:', error);
    res.status(500).json({
      message: 'Server error while updating meal',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/meals/:id
// @desc    Delete a meal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Check if user owns this meal
    if (!meal.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own meals.' });
    }

    await Meal.findByIdAndDelete(req.params.id);

    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({
      message: 'Server error while deleting meal',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/meals/quick-add
// @desc    Quick add a single food item as a meal
// @access  Private
router.post('/quick-add', auth, [
  body('foodId').isMongoId().withMessage('Invalid food ID'),
  body('weight').isFloat({ min: 0.1, max: 5000 }).withMessage('Weight must be between 0.1 and 5000 grams'),
  body('mealType').isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('date').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { foodId, weight, mealType, date } = req.body;

    const food = await Food.findById(foodId);
    
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    // Check if user can access this food
    if (!food.isPublic && !food.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied to this food' });
    }

    // Calculate nutrition
    const nutrition = food.calculateNutrition(weight);

    // Create meal
    const meal = new Meal({
      user: req.user._id,
      date: date ? new Date(date) : new Date(),
      mealType,
      items: [{
        food: food._id,
        weight,
        nutrition
      }]
    });

    await meal.save();
    await meal.populate('items.food', 'name nameAr category nutrition');

    res.status(201).json({
      message: 'Food added to meal successfully',
      meal
    });
  } catch (error) {
    console.error('Quick add meal error:', error);
    res.status(500).json({
      message: 'Server error while adding food to meal',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
