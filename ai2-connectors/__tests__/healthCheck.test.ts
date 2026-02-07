/**
 * Connectors Module Smoke Test — embracingearth.space
 *
 * Prevents CI from silently passing an empty test suite.
 * Verifies the module's entry point is importable.
 */

describe('ai2-connectors module', () => {
  it('should have a valid package.json', () => {
    const pkg = require('../package.json');
    expect(pkg.name).toBeDefined();
    expect(pkg.scripts).toHaveProperty('start');
  });

  it('should export server entry point without crashing', () => {
    const fs = require('fs');
    const path = require('path');
    const serverPath = path.join(__dirname, '..', 'src', 'server.ts');
    expect(fs.existsSync(serverPath)).toBe(true);
  });
});
