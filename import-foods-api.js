const fs = require('fs');
const path = require('path');

// Simple script to import foods via API
async function importFoods() {
  try {
    // Read the JSON file
    const jsonPath = path.join(__dirname, 'Data/comprehensive_egyptian_foods.json');
    const foodsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`📊 Found ${foodsData.length} foods in JSON file`);
    
    // You'll need to replace this with actual admin credentials
    const adminCredentials = {
      email: 'admin@example.com', // Replace with actual admin email
      password: 'admin123' // Replace with actual admin password
    };
    
    console.log('🔐 Please use the following curl command to import foods:');
    console.log('');
    console.log('1. First, login as admin to get token:');
    console.log(`curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"${adminCredentials.email}","password":"${adminCredentials.password}"}'`);
    
    console.log('');
    console.log('2. Then use the token to import foods:');
    console.log(`curl -X POST http://localhost:5000/api/admin/bulk-import-foods \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -d '{"foods":${JSON.stringify(foodsData)},"clearExisting":true}'`);
    
    console.log('');
    console.log('Or save this payload to a file and use:');
    
    // Save payload to file for easier importing
    const payload = {
      foods: foodsData,
      clearExisting: true
    };
    
    fs.writeFileSync('foods-import-payload.json', JSON.stringify(payload, null, 2));
    console.log('✅ Saved import payload to foods-import-payload.json');
    
    console.log('');
    console.log('Use this command with the payload file:');
    console.log(`curl -X POST http://localhost:5000/api/admin/bulk-import-foods \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -d @foods-import-payload.json`);
    
    // Show sample foods that will be imported
    console.log('');
    console.log('🍎 Sample foods to be imported:');
    const egyptianBread = foodsData.filter(f => f.nameAr && f.nameAr.includes('عيش'));
    console.log(`🍞 Egyptian bread items (${egyptianBread.length}):`);
    egyptianBread.forEach(food => {
      console.log(`  - ${food.nameAr} (${food.name}) - ${food.servingSize.amount} ${food.servingSize.unit}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

importFoods();
