const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDB() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }
}

testDB();







