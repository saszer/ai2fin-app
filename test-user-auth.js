/**
 * Test script to verify user authentication
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function testUserAuth() {
  console.log('🧪 Testing User Authentication...\n');

  try {
    const prisma = new PrismaClient();

    // Test 1: Check if we can connect to the database
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Test 2: Check for test users
    console.log('2. Checking for test users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        businessType: true,
        isActive: true
      }
    });
    
    console.log(`✅ Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.firstName} ${user.lastName})`);
      console.log(`     Business Type: ${user.businessType || 'N/A'}`);
      console.log(`     Active: ${user.isActive}`);
      console.log(`     Password Hash: ${user.password ? 'SET' : 'NOT SET'}`);
      console.log();
    });

    // Test 3: Test password for test@example.com
    console.log('3. Testing password for test@example.com...');
    const testUser = users.find(u => u.email === 'test@example.com');
    
    if (testUser) {
      console.log('✅ Found test@example.com user');
      
      // Test password 'password123'
      const isValidPassword = await bcrypt.compare('password123', testUser.password);
      console.log(`✅ Password 'password123' is ${isValidPassword ? 'VALID' : 'INVALID'}`);
      
      if (!isValidPassword) {
        console.log('❌ Password is incorrect. Let me check what passwords might work...');
        
        // Try some common test passwords
        const testPasswords = ['password', '123456', 'test123', 'admin', 'password123', 'test', '123'];
        for (const testPass of testPasswords) {
          const isValid = await bcrypt.compare(testPass, testUser.password);
          if (isValid) {
            console.log(`✅ Found working password: '${testPass}'`);
            break;
          }
        }
        
        // If no password works, let's reset it
        console.log('\n🔄 Resetting password to "password123"...');
        const newHashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.update({
          where: { email: 'test@example.com' },
          data: { password: newHashedPassword }
        });
        console.log('✅ Password reset to "password123"');
      }
    } else {
      console.log('❌ test@example.com user not found');
    }

    // Test 4: Create a test user if needed
    console.log('\n4. Creating test user if needed...');
    const existingTestUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (!existingTestUser) {
      console.log('Creating test user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const newUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          businessName: 'Test Business',
          businessType: 'SOLE_TRADER',
          countryCode: 'AU',
          isActive: true
        }
      });
      
      console.log('✅ Created test user:', newUser.email);
    } else {
      console.log('✅ Test user already exists');
    }

    await prisma.$disconnect();
    console.log('\n🎉 User authentication test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUserAuth(); 