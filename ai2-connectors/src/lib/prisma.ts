// --- 📦 PRISMA CLIENT INITIALIZATION ---
// embracingearth.space - Singleton Prisma client for ai2-connectors
// Use connectors' own generated client so monorepo root @prisma/client (core-app) is not used.

import path from 'path';
import fs from 'fs';

const clientPath = path.join(__dirname, '../../node_modules/.prisma/client-connectors');
if (!fs.existsSync(path.join(clientPath, 'index.js'))) {
  throw new Error(
    'Connectors Prisma client not generated. From ai2-connectors run: npm run build or npx prisma generate'
  );
}
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require(clientPath);

declare global {
  // eslint-disable-next-line no-var
  var __prisma: InstanceType<typeof PrismaClient> | undefined;
}

// Create singleton instance (prevents multiple clients in dev with hot reload)
const prisma = global.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['error', 'warn']
    : ['error'],
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };
export default prisma;











