const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Food = require('../models/Food');
const Meal = require('../models/Meal');

const router = express.Router();

// Admin-only guard
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
}

// POST /api/admin/purge-non-admins
// Deletes all users except the admin and cleans related foods/meals
router.post('/purge-non-admins', auth, requireAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id email');
    if (admins.length === 0) {
      return res.status(400).json({ message: 'No admin found to keep' });
    }

    const adminIds = admins.map(a => a._id);
    const usersToDelete = await User.find({ role: { $ne: 'admin' } }).select('_id');
    const userIds = usersToDelete.map(u => u._id);

    // Delete related data
    const foodsResult = await Food.deleteMany({ createdBy: { $in: userIds } });
    const mealsResult = await Meal.deleteMany({ user: { $in: userIds } });
    const usersResult = await User.deleteMany({ _id: { $in: userIds } });

    res.json({
      message: 'Purged all non-admin users and related data',
      deleted: {
        users: usersResult.deletedCount || 0,
        foods: foodsResult.deletedCount || 0,
        meals: mealsResult.deletedCount || 0,
      },
      keptAdmins: admins.map(a => a.email)
    });
  } catch (error) {
    console.error('Admin purge error:', error);
    res.status(500).json({ message: 'Server error during purge' });
  }
});

// POST /api/admin/bulk-import-foods
// Bulk import foods from JSON array
router.post('/bulk-import-foods', auth, requireAdmin, [
  body('foods').isArray({ min: 1 }).withMessage('Foods array is required'),
  body('foods.*.name').notEmpty().withMessage('Food name is required'),
  body('foods.*.category').isIn([
    'fruits', 'vegetables', 'grains', 'protein', 'dairy', 'nuts_seeds',
    'oils_fats', 'beverages', 'sweets', 'snacks', 'prepared_foods', 'other'
  ]).withMessage('Invalid category'),
  body('foods.*.nutrition.calories').isNumeric().withMessage('Calories must be numeric'),
  body('foods.*.nutrition.protein').isNumeric().withMessage('Protein must be numeric'),
  body('foods.*.nutrition.carbs').isNumeric().withMessage('Carbs must be numeric'),
  body('foods.*.nutrition.fat').isNumeric().withMessage('Fat must be numeric')
], async (req, res) => {
  try {
    const { foods, clearExisting = false } = req.body;
    
    // Clear existing foods if requested
    if (clearExisting) {
      const deleteResult = await Food.deleteMany({});
      console.log(`Cleared ${deleteResult.deletedCount} existing foods`);
    }
    
    // Process foods and add admin metadata
    const processedFoods = foods.map(food => ({
      ...food,
      createdBy: req.user._id,
      isPublic: food.isPublic !== undefined ? food.isPublic : true,
      isVerified: true,
      per100g: food.servingSize?.unit === 'piece' ? false : true
    }));
    
    // Insert foods
    const insertedFoods = await Food.insertMany(processedFoods);
    
    // Count foods by category for summary
    const categoryCounts = {};
    insertedFoods.forEach(food => {
      categoryCounts[food.category] = (categoryCounts[food.category] || 0) + 1;
    });
    
    res.json({
      message: `Successfully imported ${insertedFoods.length} foods`,
      imported: insertedFoods.length,
      categoryCounts,
      sampleFoods: insertedFoods.slice(0, 5).map(f => ({
        name: f.name,
        nameAr: f.nameAr,
        category: f.category,
        servingSize: f.servingSize
      }))
    });
    
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ 
      message: 'Server error during bulk import',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/admin/users
// Get all users with pagination and search
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      role = '', 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build search query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get user statistics
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format stats
    const roleStats = {};
    stats.forEach(stat => {
      roleStats[stat._id] = stat.count;
    });

    // Get recent activity (users created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      },
      stats: {
        total,
        roles: roleStats,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/admin/users/:id
// Get specific user details with related data
router.get('/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get user details
    const user = await User.findById(id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's meal count and recent activity
    const mealCount = await Meal.countDocuments({ user: id });
    const recentMeals = await Meal.find({ user: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('date totals.calories mealType createdAt')
      .lean();

    // Get user's created foods count
    const foodCount = await Food.countDocuments({ createdBy: id });

    // Calculate user activity stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentMealCount = await Meal.countDocuments({
      user: id,
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      user,
      activity: {
        totalMeals: mealCount,
        totalFoods: foodCount,
        recentMeals: recentMealCount,
        lastActive: recentMeals.length > 0 ? recentMeals[0].createdAt : user.createdAt
      },
      recentMeals
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching user details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/admin/users/:id
// Update user (admin can modify any user)
router.put('/users/:id', auth, requireAdmin, [
  body('name').optional().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 chars'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  body('profile.age').optional().isInt({ min: 1, max: 120 }).withMessage('Age must be 1-120'),
  body('profile.gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('profile.height').optional().isFloat({ min: 50, max: 300 }).withMessage('Height must be 50-300 cm'),
  body('profile.weight').optional().isFloat({ min: 20, max: 500 }).withMessage('Weight must be 20-500 kg')
], async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from demoting themselves
    if (id === req.user._id.toString() && updates.role === 'user') {
      return res.status(400).json({ message: 'Cannot demote yourself from admin' });
    }

    // Check if email is already taken (if email is being updated)
    if (updates.email && updates.email !== user.email) {
      const existingUser = await User.findOne({ email: updates.email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      message: 'Server error while updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/admin/users/:id
// Delete user and all related data
router.delete('/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    // Delete related data
    const [foodsResult, mealsResult] = await Promise.all([
      Food.deleteMany({ createdBy: id }),
      Meal.deleteMany({ user: id })
    ]);

    // Delete user
    await User.findByIdAndDelete(id);

    res.json({
      message: 'User and related data deleted successfully',
      deleted: {
        user: user.name,
        foods: foodsResult.deletedCount || 0,
        meals: mealsResult.deletedCount || 0
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      message: 'Server error while deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/admin/dashboard-stats
// Get admin dashboard statistics
router.get('/dashboard-stats', auth, requireAdmin, async (req, res) => {
  try {
    // Get basic counts
    const [userCount, foodCount, mealCount] = await Promise.all([
      User.countDocuments(),
      Food.countDocuments(),
      Meal.countDocuments()
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentUsers, recentMeals, recentFoods] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Meal.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Food.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    ]);

    // Get user role distribution
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Get most active users (by meal count)
    const activeUsers = await Meal.aggregate([
      { $group: { _id: '$user', mealCount: { $sum: 1 } } },
      { $sort: { mealCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          mealCount: 1
        }
      }
    ]);

    res.json({
      totals: {
        users: userCount,
        foods: foodCount,
        meals: mealCount
      },
      recent: {
        users: recentUsers,
        meals: recentMeals,
        foods: recentFoods
      },
      roles: roleStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      activeUsers
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching dashboard stats',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
