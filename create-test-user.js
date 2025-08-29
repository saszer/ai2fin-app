/**
 * Create Test User for Localhost Testing
 * Creates a minimal test user to avoid authentication issues
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUser() {
  console.log('👤 Creating test user for localhost testing...');
  
  const testUser = {
    email: 'test@example.com',
    password: 'testpass123',
    firstName: 'Test',
    lastName: 'User'
  };
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testUser.email }
    });
    
    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.email);
      return existingUser;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    
    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: testUser.email,
        passwordHash: hashedPassword,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        emailVerified: true, // Skip email verification for testing
        businessType: 'individual',
        countryCode: 'US'
      }
    });
    
    console.log('✅ Test user created successfully:', newUser.email);
    console.log('   User ID:', newUser.id);
    
    return newUser;
    
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser().catch(console.error);
