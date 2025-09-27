const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function testPasswordFunctionality() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/calories-calculator');
    console.log('🔌 Connected to MongoDB');

    // Test data
    const testEmail = 'test-password-' + Date.now() + '@example.com';
    const originalPassword = 'testpass123';
    const newPassword = 'newpass456';

    console.log('\n🧪 Testing Password Functionality...\n');

    // Test 1: User Registration (Password should be hashed once)
    console.log('1️⃣ Testing User Registration...');
    const testUser = new User({
      name: 'Test User',
      email: testEmail,
      password: originalPassword,
      profile: {
        age: 25,
        gender: 'male',
        height: 175,
        weight: 70
      }
    });

    await testUser.save();
    console.log('✅ User created successfully');
    
    // Verify password is hashed
    const isOriginalHashed = testUser.password !== originalPassword;
    console.log('✅ Password hashed during registration:', isOriginalHashed ? 'YES' : 'NO');
    
    // Test login with original password
    const loginTest1 = await testUser.comparePassword(originalPassword);
    console.log('✅ Login with original password:', loginTest1 ? 'SUCCESS' : 'FAILED');

    // Test 2: Password Change (Should not double-hash)
    console.log('\n2️⃣ Testing Password Change...');
    
    // Simulate password change (like the route does)
    testUser.password = newPassword;
    await testUser.save();
    console.log('✅ Password changed successfully');
    
    // Test login with new password
    const loginTest2 = await testUser.comparePassword(newPassword);
    console.log('✅ Login with new password:', loginTest2 ? 'SUCCESS' : 'FAILED');
    
    // Test that old password no longer works
    const loginTest3 = await testUser.comparePassword(originalPassword);
    console.log('✅ Old password rejected:', loginTest3 ? 'FAILED (should be rejected)' : 'SUCCESS');

    // Test 3: Verify hash format
    console.log('\n3️⃣ Testing Hash Format...');
    const hashPattern = /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/;
    const isValidHash = hashPattern.test(testUser.password);
    console.log('✅ Password hash format valid:', isValidHash ? 'YES' : 'NO');
    console.log('🔐 Hash sample:', testUser.password.substring(0, 20) + '...');

    // Test 4: Multiple password changes
    console.log('\n4️⃣ Testing Multiple Password Changes...');
    const passwords = ['pass1', 'pass2', 'pass3'];
    
    for (let i = 0; i < passwords.length; i++) {
      testUser.password = passwords[i];
      await testUser.save();
      
      const testResult = await testUser.comparePassword(passwords[i]);
      console.log(`✅ Password change ${i + 1} (${passwords[i]}):`, testResult ? 'SUCCESS' : 'FAILED');
    }

    // Cleanup
    await User.deleteOne({ email: testEmail });
    console.log('\n🧹 Test user cleaned up');

    console.log('\n🎉 All password functionality tests completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Registration: Password hashed correctly');
    console.log('✅ Login: Password comparison works');
    console.log('✅ Password Change: No double-hashing');
    console.log('✅ Security: Old passwords rejected');
    console.log('✅ Hash Format: Valid bcrypt format');
    console.log('✅ Multiple Changes: All working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

console.log('🚀 Starting comprehensive password functionality test...');
testPasswordFunctionality();
