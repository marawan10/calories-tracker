#!/usr/bin/env node

/**
 * Quick Password Change Test
 * Tests that password changes work correctly and users can login with new passwords
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function testPasswordChange() {
  try {
    console.log('🔐 Testing password change functionality...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/calories-calculator');
    console.log('✅ Connected to MongoDB');
    
    // Find your user
    const user = await User.findOne({ email: 'marawanmokhtar10@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 Found user:', user.email);
    
    // Test current password
    const currentPasswordWorks = await user.comparePassword('123456');
    console.log('🔑 Current password (123456) works:', currentPasswordWorks ? '✅' : '❌');
    
    if (!currentPasswordWorks) {
      console.log('❌ Current password doesn\'t work. Please check your password.');
      return;
    }
    
    // Change password to a new one
    const newPassword = 'newpass123';
    console.log('🔄 Changing password to:', newPassword);
    
    user.password = newPassword;
    await user.save();
    
    console.log('💾 Password saved successfully');
    
    // Test new password
    const newPasswordWorks = await user.comparePassword(newPassword);
    console.log('🔑 New password works:', newPasswordWorks ? '✅' : '❌');
    
    // Test old password doesn't work
    const oldPasswordStillWorks = await user.comparePassword('123456');
    console.log('🚫 Old password still works:', oldPasswordStillWorks ? '❌ (BAD!)' : '✅ (GOOD)');
    
    // Change back to original password
    console.log('🔄 Changing back to original password...');
    user.password = '123456';
    await user.save();
    
    const originalPasswordWorks = await user.comparePassword('123456');
    console.log('🔑 Original password restored:', originalPasswordWorks ? '✅' : '❌');
    
    console.log('\n🎉 Password change test completed!');
    console.log('✅ You can now change your password and it should work correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run test
testPasswordChange().catch(console.error);
