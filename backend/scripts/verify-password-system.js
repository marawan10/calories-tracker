#!/usr/bin/env node

/**
 * Password System Verification Script
 * 
 * This script verifies that the password system is working correctly
 * and can detect common issues like double-hashing.
 * 
 * Usage: node scripts/verify-password-system.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

class PasswordSystemVerifier {
  constructor() {
    this.testResults = [];
    this.testUser = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addResult(test, passed, details = '') {
    this.testResults.push({ test, passed, details });
    this.log(`${test}: ${passed ? 'PASSED' : 'FAILED'}${details ? ' - ' + details : ''}`, passed ? 'success' : 'error');
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/calories-calculator');
      this.log('Connected to MongoDB', 'success');
      return true;
    } catch (error) {
      this.log(`Failed to connect to MongoDB: ${error.message}`, 'error');
      return false;
    }
  }

  async createTestUser() {
    try {
      const testEmail = `test-verify-${Date.now()}@example.com`;
      const testPassword = 'testpass123';

      this.testUser = new User({
        name: 'Password Test User',
        email: testEmail,
        password: testPassword,
        profile: {
          age: 25,
          gender: 'male',
          height: 175,
          weight: 70
        }
      });

      await this.testUser.save();
      
      // Verify password was hashed
      const isHashed = this.testUser.password !== testPassword;
      const hasValidFormat = /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/.test(this.testUser.password);
      
      this.addResult('User Creation', isHashed && hasValidFormat, 
        `Hash format: ${hasValidFormat ? 'Valid' : 'Invalid'}`);
      
      return { testEmail, testPassword };
    } catch (error) {
      this.addResult('User Creation', false, error.message);
      throw error;
    }
  }

  async testPasswordComparison(password) {
    try {
      const isValid = await this.testUser.comparePassword(password);
      this.addResult('Password Comparison', isValid, 'Original password matches');
      
      const isInvalid = await this.testUser.comparePassword('wrongpassword');
      this.addResult('Wrong Password Rejection', !isInvalid, 'Wrong password correctly rejected');
      
      return isValid && !isInvalid;
    } catch (error) {
      this.addResult('Password Comparison', false, error.message);
      return false;
    }
  }

  async testPasswordChange() {
    try {
      const newPassword = 'newpass456';
      const oldHash = this.testUser.password;
      
      // Simulate password change (like the route does)
      this.testUser.password = newPassword;
      await this.testUser.save();
      
      const newHash = this.testUser.password;
      const hashChanged = oldHash !== newHash;
      const hasValidFormat = /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/.test(newHash);
      const isNotDoubleHashed = !newHash.includes('$2a$12$') || newHash.indexOf('$2a$12$') === newHash.lastIndexOf('$2a$12$');
      
      this.addResult('Password Change - Hash Updated', hashChanged, 
        `Hash changed: ${hashChanged ? 'Yes' : 'No'}`);
      this.addResult('Password Change - Valid Format', hasValidFormat, 
        `Format: ${hasValidFormat ? 'Valid bcrypt' : 'Invalid'}`);
      this.addResult('Password Change - No Double Hash', isNotDoubleHashed, 
        `Double hash detected: ${isNotDoubleHashed ? 'No' : 'Yes'}`);
      
      // Test login with new password
      const newPasswordWorks = await this.testUser.comparePassword(newPassword);
      this.addResult('New Password Login', newPasswordWorks, 
        'Can login with new password');
      
      return hashChanged && hasValidFormat && isNotDoubleHashed && newPasswordWorks;
    } catch (error) {
      this.addResult('Password Change', false, error.message);
      return false;
    }
  }

  async testMultipleChanges() {
    try {
      const passwords = ['pass1', 'pass2', 'pass3'];
      let allPassed = true;
      
      for (let i = 0; i < passwords.length; i++) {
        const password = passwords[i];
        this.testUser.password = password;
        await this.testUser.save();
        
        const canLogin = await this.testUser.comparePassword(password);
        const hasValidFormat = /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/.test(this.testUser.password);
        
        const passed = canLogin && hasValidFormat;
        this.addResult(`Multiple Changes - Step ${i + 1}`, passed, 
          `Password: ${password}, Login: ${canLogin ? 'OK' : 'FAIL'}, Format: ${hasValidFormat ? 'OK' : 'FAIL'}`);
        
        if (!passed) allPassed = false;
      }
      
      return allPassed;
    } catch (error) {
      this.addResult('Multiple Password Changes', false, error.message);
      return false;
    }
  }

  async checkExistingUsers() {
    try {
      const users = await User.find({}).limit(5);
      let validHashes = 0;
      let invalidHashes = 0;
      let suspiciousHashes = 0;
      
      for (const user of users) {
        const hasValidFormat = /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/.test(user.password);
        const mightBeDoubleHashed = user.password.length > 70 || (user.password.match(/\$2[aby]\$/g) || []).length > 1;
        
        if (hasValidFormat && !mightBeDoubleHashed) {
          validHashes++;
        } else if (mightBeDoubleHashed) {
          suspiciousHashes++;
        } else {
          invalidHashes++;
        }
      }
      
      this.addResult('Existing Users Check', suspiciousHashes === 0 && invalidHashes === 0, 
        `Valid: ${validHashes}, Invalid: ${invalidHashes}, Suspicious: ${suspiciousHashes}`);
      
      if (suspiciousHashes > 0) {
        this.log(`Found ${suspiciousHashes} users with potentially double-hashed passwords`, 'warning');
      }
      
      return suspiciousHashes === 0 && invalidHashes === 0;
    } catch (error) {
      this.addResult('Existing Users Check', false, error.message);
      return false;
    }
  }

  async cleanup() {
    if (this.testUser) {
      try {
        await User.deleteOne({ _id: this.testUser._id });
        this.log('Test user cleaned up', 'success');
      } catch (error) {
        this.log(`Failed to cleanup test user: ${error.message}`, 'warning');
      }
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PASSWORD SYSTEM VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log(`\n📈 Overall Result: ${passed}/${total} tests passed (${percentage}%)`);
    
    if (percentage === 100) {
      console.log('🎉 All tests passed! Password system is working correctly.');
    } else if (percentage >= 80) {
      console.log('⚠️  Most tests passed, but some issues detected. Review failed tests.');
    } else {
      console.log('❌ Multiple test failures detected. Password system needs attention.');
    }
    
    console.log('\n📋 Detailed Results:');
    this.testResults.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status} - ${result.test}${result.details ? ' (' + result.details + ')' : ''}`);
    });
    
    console.log('\n💡 Recommendations:');
    if (percentage < 100) {
      console.log('  - Review failed tests and fix underlying issues');
      console.log('  - Check server logs for detailed error messages');
      console.log('  - Consider running individual test components');
    }
    console.log('  - Run this verification after any password-related code changes');
    console.log('  - Monitor password change success rates in production');
    
    console.log('\n📚 For more information, see: backend/docs/PASSWORD_SECURITY.md');
  }

  async run() {
    this.log('Starting Password System Verification', 'info');
    
    try {
      // Connect to database
      const connected = await this.connect();
      if (!connected) return;
      
      // Check existing users first
      await this.checkExistingUsers();
      
      // Create test user and run tests
      const { testPassword } = await this.createTestUser();
      await this.testPasswordComparison(testPassword);
      await this.testPasswordChange();
      await this.testMultipleChanges();
      
    } catch (error) {
      this.log(`Verification failed: ${error.message}`, 'error');
    } finally {
      await this.cleanup();
      await mongoose.connection.close();
      this.printSummary();
    }
  }
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new PasswordSystemVerifier();
  verifier.run().catch(console.error);
}

module.exports = PasswordSystemVerifier;
