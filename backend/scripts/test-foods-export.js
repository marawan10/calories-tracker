#!/usr/bin/env node

/**
 * Test Foods Export API
 * Tests that the foods API works with high limits for export functionality
 */

const axios = require('axios');

async function testFoodsExport() {
  try {
    console.log('🧪 Testing foods export API...');
    
    // Test with the limit that was failing
    const response = await axios.get('http://localhost:5000/api/foods?limit=10000', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ Total Foods Returned:', response.data.foods?.length || 0);
    console.log('✅ Pagination Info:', response.data.pagination);
    
    if (response.data.foods && response.data.foods.length > 0) {
      const sampleFood = response.data.foods[0];
      console.log('✅ Sample Food Structure:');
      console.log('   - Name:', sampleFood.name);
      console.log('   - Category:', sampleFood.category);
      console.log('   - Nutrition:', sampleFood.nutrition ? 'Present' : 'Missing');
      console.log('   - Calories:', sampleFood.nutrition?.calories || 'N/A');
    }
    
    console.log('\n🎉 Foods export API test passed!');
    console.log('✅ The admin can now export foods successfully.');
    
  } catch (error) {
    console.error('❌ Foods export test failed:');
    console.error('   Status:', error.response?.status);
    console.error('   Message:', error.response?.data?.message || error.message);
    console.error('   Errors:', error.response?.data?.errors);
  }
}

// Run test
testFoodsExport();
