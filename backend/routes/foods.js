const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Food = require('../models/Food');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/foods
// @desc    Get foods with search and filtering
// @access  Public/Private (shows user's foods if authenticated)
router.get('/', optionalAuth, [
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query too long'),
  query('category').optional().isIn([
    'fruits', 'vegetables', 'grains', 'protein', 'dairy', 'nuts_seeds', 
    'oils_fats', 'beverages', 'sweets', 'snacks', 'prepared_foods', 'other'
  ]).withMessage('Invalid category'),
  query('limit').optional().isInt({ min: 1, max: 50000 }).withMessage('Limit must be between 1 and 50000'),
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

    const { search, category, limit = 20, page = 1 } = req.query;
    const userId = req.user?._id;
    const isAdmin = req.user?.role === 'admin';

    // Build query
    const query = isAdmin
      ? {}
      : {
          $or: [
            { isPublic: true },
            ...(userId ? [{ createdBy: userId }] : [])
          ]
        };

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      query.category = category;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const foods = await Food.find(query)
      .populate('createdBy', 'name')
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Food.countDocuments(query);

    res.json({
      foods,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get foods error:', error);
    res.status(500).json({
      message: 'Server error while fetching foods',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/foods/:id
// @desc    Get single food by ID
// @access  Public/Private
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const food = await Food.findById(req.params.id).populate('createdBy', 'name');
    
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    // Check if user can access this food
    const userId = req.user?._id;
    if (!food.isPublic && (!userId || !food.createdBy._id.equals(userId))) {
      return res.status(403).json({ message: 'Access denied to this food item' });
    }

    res.json(food);
  } catch (error) {
    console.error('Get food error:', error);
    res.status(500).json({
      message: 'Server error while fetching food',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/foods
// @desc    Create a new food
// @access  Private
router.post('/', auth, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  body('nameAr').optional().trim().isLength({ max: 100 }).withMessage('Arabic name cannot exceed 100 characters'),
  // category optional; default to 'other' if missing
  body('category').optional().isIn([
    'fruits', 'vegetables', 'grains', 'protein', 'dairy', 'nuts_seeds', 
    'oils_fats', 'beverages', 'sweets', 'snacks', 'prepared_foods', 'other'
  ]).withMessage('Invalid category'),
  body('brand').optional().trim().isLength({ max: 50 }).withMessage('Brand cannot exceed 50 characters'),
  // Accept either nested nutrition.* or flat fields calories/protein/carbs/fat
  body('nutrition.calories').optional().isFloat({ min: 0, max: 2000 }).withMessage('Calories must be between 0 and 2000'),
  body('nutrition.protein').optional().isFloat({ min: 0, max: 100 }).withMessage('Protein must be between 0 and 100g'),
  body('nutrition.carbs').optional().isFloat({ min: 0, max: 100 }).withMessage('Carbs must be between 0 and 100g'),
  body('nutrition.fat').optional().isFloat({ min: 0, max: 100 }).withMessage('Fat must be between 0 and 100g'),
  body('calories').optional().isFloat({ min: 0, max: 2000 }).withMessage('Calories must be between 0 and 2000'),
  body('protein').optional().isFloat({ min: 0, max: 100 }).withMessage('Protein must be between 0 and 100g'),
  body('carbs').optional().isFloat({ min: 0, max: 100 }).withMessage('Carbs must be between 0 and 100g'),
  body('fat').optional().isFloat({ min: 0, max: 100 }).withMessage('Fat must be between 0 and 100g'),
  body('nutrition.fiber').optional().isFloat({ min: 0, max: 100 }).withMessage('Fiber must be between 0 and 100g'),
  body('nutrition.sugar').optional().isFloat({ min: 0, max: 100 }).withMessage('Sugar must be between 0 and 100g'),
  body('nutrition.sodium').optional().isFloat({ min: 0, max: 50000 }).withMessage('Sodium must be between 0 and 50000mg'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
], async (req, res) => {
  try {
    // Admin-only guard for creating foods
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create foods' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Map flat fields into nutrition if provided
    const nutrition = {
      calories: req.body?.nutrition?.calories ?? req.body?.calories,
      protein: req.body?.nutrition?.protein ?? req.body?.protein,
      carbs: req.body?.nutrition?.carbs ?? req.body?.carbs,
      fat: req.body?.nutrition?.fat ?? req.body?.fat,
      fiber: req.body?.nutrition?.fiber ?? 0,
      sugar: req.body?.nutrition?.sugar ?? 0,
      sodium: req.body?.nutrition?.sodium ?? 0,
    };

    if ([nutrition.calories, nutrition.protein, nutrition.carbs, nutrition.fat].some(v => v === undefined)) {
      return res.status(400).json({ message: 'Calories, protein, carbs and fat are required (per 100g).' });
    }

    const foodData = {
      name: req.body.name,
      nameAr: req.body.nameAr,
      category: req.body.category || 'other',
      brand: req.body.brand,
      barcode: req.body.barcode,
      nutrition,
      servingSize: req.body.servingSize || { amount: 100, unit: 'g' },
      createdBy: req.user._id,
      isPublic: req.body.isPublic ?? false,
      isVerified: req.body.isVerified ?? false,
      per100g: req.body.per100g ?? true,
      tags: req.body.tags,
      description: req.body.description,
    };

    const food = new Food(foodData);
    await food.save();

    await food.populate('createdBy', 'name');

    res.status(201).json({
      message: 'Food created successfully',
      food
    });
  } catch (error) {
    console.error('Create food error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'A food with this barcode already exists',
        code: 'DUPLICATE_BARCODE'
      });
    }

    res.status(500).json({
      message: 'Server error while creating food',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/foods/:id
// @desc    Update a food
// @access  Private (only creator can update)
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  body('nameAr').optional().trim().isLength({ max: 100 }).withMessage('Arabic name cannot exceed 100 characters'),
  body('category').optional().isIn([
    'fruits', 'vegetables', 'grains', 'protein', 'dairy', 'nuts_seeds', 
    'oils_fats', 'beverages', 'sweets', 'snacks', 'prepared_foods', 'other'
  ]).withMessage('Invalid category'),
  body('brand').optional().trim().isLength({ max: 50 }).withMessage('Brand cannot exceed 50 characters'),
  body('nutrition.calories').optional().isFloat({ min: 0, max: 2000 }).withMessage('Calories must be between 0 and 2000'),
  body('nutrition.protein').optional().isFloat({ min: 0, max: 100 }).withMessage('Protein must be between 0 and 100g'),
  body('nutrition.carbs').optional().isFloat({ min: 0, max: 100 }).withMessage('Carbs must be between 0 and 100g'),
  body('nutrition.fat').optional().isFloat({ min: 0, max: 100 }).withMessage('Fat must be between 0 and 100g'),
  body('nutrition.fiber').optional().isFloat({ min: 0, max: 100 }).withMessage('Fiber must be between 0 and 100g'),
  body('nutrition.sugar').optional().isFloat({ min: 0, max: 100 }).withMessage('Sugar must be between 0 and 100g'),
  body('nutrition.sodium').optional().isFloat({ min: 0, max: 50000 }).withMessage('Sodium must be between 0 and 50000mg'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const food = await Food.findById(req.params.id);
    
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    // Check if user owns this food or is admin
    if (!food.createdBy.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You can only update your own foods.' });
    }

    // Update food
    Object.assign(food, req.body);
    await food.save();

    await food.populate('createdBy', 'name');

    res.json({
      message: 'Food updated successfully',
      food
    });
  } catch (error) {
    console.error('Update food error:', error);
    res.status(500).json({
      message: 'Server error while updating food',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/foods/:id
// @desc    Delete a food
// @access  Private (only creator can delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    // Check if user owns this food or is admin
    if (!food.createdBy.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You can only delete your own foods.' });
    }

    await Food.findByIdAndDelete(req.params.id);

    res.json({ message: 'Food deleted successfully' });
  } catch (error) {
    console.error('Delete food error:', error);
    res.status(500).json({
      message: 'Server error while deleting food',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/foods/categories/list
// @desc    Get list of all food categories
// @access  Public
router.get('/categories/list', (req, res) => {
  const categories = [
    { value: 'fruits', label: 'Fruits', labelAr: 'فواكه' },
    { value: 'vegetables', label: 'Vegetables', labelAr: 'خضروات' },
    { value: 'grains', label: 'Grains & Cereals', labelAr: 'حبوب ونشويات' },
    { value: 'protein', label: 'Protein', labelAr: 'بروتين' },
    { value: 'dairy', label: 'Dairy', labelAr: 'منتجات الألبان' },
    { value: 'nuts_seeds', label: 'Nuts & Seeds', labelAr: 'مكسرات وبذور' },
    { value: 'oils_fats', label: 'Oils & Fats', labelAr: 'زيوت ودهون' },
    { value: 'beverages', label: 'Beverages', labelAr: 'مشروبات' },
    { value: 'sweets', label: 'Sweets & Desserts', labelAr: 'حلويات' },
    { value: 'snacks', label: 'Snacks', labelAr: 'وجبات خفيفة' },
    { value: 'prepared_foods', label: 'Prepared Foods', labelAr: 'أطعمة جاهزة' },
    { value: 'other', label: 'Other', labelAr: 'أخرى' }
  ];

  res.json(categories);
});

module.exports = router;
