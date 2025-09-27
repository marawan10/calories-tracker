const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/calories-calculator');
    console.log('Connected to MongoDB');

    const userEmail = 'marawanmokhtar10@gmail.com';
    const newPassword = '123456';
    
    console.log('Looking for user with email:', userEmail);
    
    // Find and update user directly
    const result = await mongoose.connection.db.collection('users').findOne({ email: userEmail });
    
    if (!result) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log('✅ User found, generating new hash for password:', newPassword);
    
    // Generate correct hash with salt rounds 12 (same as model)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log('🔐 New hash generated:', hashedPassword);
    
    // Update password directly in database
    await mongoose.connection.db.collection('users').updateOne(
      { email: userEmail },
      { $set: { password: hashedPassword } }
    );
    
    console.log('✅ Password updated successfully!');
    console.log('🎉 You can now login with:');
    console.log('   Email:', userEmail);
    console.log('   Password:', newPassword);
    
    // Test the hash
    const testMatch = await bcrypt.compare(newPassword, hashedPassword);
    console.log('🧪 Password hash test:', testMatch ? '✅ PASS' : '❌ FAIL');
    
  } catch (error) {
    console.error('❌ Error fixing password:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

console.log('🚀 Starting password fix...');
fixPassword();
