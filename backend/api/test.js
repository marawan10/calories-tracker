const mongoose = require('mongoose');

// Simple test endpoint
module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Test MongoDB connection
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      return res.status(500).json({ error: 'MongoDB URI not set' });
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });

    return res.json({ 
      message: 'Test endpoint working!',
      mongoConnected: mongoose.connection.readyState === 1,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
};
