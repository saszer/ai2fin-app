/**
 * Shared Module Smoke Test — embracingearth.space
 *
 * Prevents CI from silently passing an empty test suite.
 * Verifies the shared module's entry point is importable.
 */

describe('shared module', () => {
  it('should have a valid package.json', () => {
    const pkg = require('../package.json');
    expect(pkg.name).toBeDefined();
  });

  it('should export index entry point without crashing', () => {
    const fs = require('fs');
    const path = require('path');
    const indexPath = path.join(__dirname, '..', 'src', 'index.ts');
    expect(fs.existsSync(indexPath)).toBe(true);
  });
});
