// Postinstall script - Generate Prisma client if schema exists
// embracingearth.space - Safe for production builds

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');

if (fs.existsSync(schemaPath)) {
  try {
    console.log('Generating Prisma client...');
    execSync('prisma generate --schema=./prisma/schema.prisma', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    console.log('✅ Prisma client generated');
  } catch (error) {
    console.warn('⚠️ Prisma generate failed (may be expected in production):', error.message);
    // Don't fail the build if Prisma isn't available (production deps)
    process.exit(0);
  }
} else {
  console.log('ℹ️ Prisma schema not found, skipping client generation');
}


