/**
 * Pencil Design Spec Generator
 * 
 * This script extracts component structure from React pages
 * and generates design specs that can be used as reference
 * when creating designs in Pencil.
 * 
 * Usage: node scripts/generate-pencil-specs.js
 */

const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '../ai2-core-app/client/src/pages');
const OUTPUT_DIR = path.join(__dirname, '../pencil-specs');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Extract component structure from a React file
function extractComponentStructure(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.tsx');
    
    // Extract imports to understand dependencies
    const imports = content.match(/import\s+.*?from\s+['"](.*?)['"]/g) || [];
    
    // Extract component name
    const componentMatch = content.match(/(?:export\s+default\s+)?(?:const|function)\s+(\w+)/);
    const componentName = componentMatch ? componentMatch[1] : fileName;
    
    // Extract MUI components used
    const muiComponents = [];
    const muiMatches = content.match(/from\s+['"]@mui\/material['"]/);
    if (muiMatches) {
      const importLine = content.split('\n').find(line => line.includes('@mui/material'));
      if (importLine) {
        const components = importLine.match(/\{([^}]+)\}/)?.[1]?.split(',').map(c => c.trim()) || [];
        muiComponents.push(...components);
      }
    }
    
    // Extract Card, Box, Grid usage patterns
    const hasCards = content.includes('<Card') || content.includes('Card>');
    const hasGrid = content.includes('<Grid') || content.includes('Grid>');
    const hasBox = content.includes('<Box');
    const hasTypography = content.includes('<Typography');
    
    return {
      fileName,
      componentName,
      imports: imports.slice(0, 10), // First 10 imports
      muiComponents: [...new Set(muiComponents)],
      structure: {
        hasCards,
        hasGrid,
        hasBox,
        hasTypography,
      },
      filePath: path.relative(process.cwd(), filePath)
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return null;
  }
}

// Generate Pencil design spec
function generatePencilSpec(structure) {
  if (!structure) return null;
  
  const spec = {
    name: structure.componentName,
    description: `Design spec for ${structure.fileName}`,
    components: structure.muiComponents,
    layout: {
      type: structure.structure.hasGrid ? 'Grid Layout' : 'Flex Layout',
      usesCards: structure.structure.hasCards,
      usesBox: structure.structure.hasBox,
      usesTypography: structure.structure.hasTypography,
    },
    recommendations: [
      'Create a Frame with dimensions matching your viewport',
      structure.structure.hasGrid ? 'Use Grid system for layout' : 'Use Flex/Box for layout',
      structure.structure.hasCards ? 'Add Card components for content sections' : 'Use Box/Paper for sections',
      'Match Material-UI spacing (8px grid)',
      'Use theme colors from your app',
    ],
    filePath: structure.filePath,
  };
  
  return spec;
}

// Main execution
function main() {
  console.log('🎨 Generating Pencil Design Specs...\n');
  
  const pages = fs.readdirSync(PAGES_DIR)
    .filter(file => file.endsWith('.tsx') && !file.includes('.test.'))
    .map(file => path.join(PAGES_DIR, file));
  
  const specs = [];
  
  pages.forEach(pagePath => {
    const structure = extractComponentStructure(pagePath);
    if (structure) {
      const spec = generatePencilSpec(structure);
      if (spec) {
        specs.push(spec);
        
        // Write individual spec file
        const outputFile = path.join(OUTPUT_DIR, `${structure.fileName}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(spec, null, 2));
        console.log(`✅ Generated spec: ${structure.fileName}.json`);
      }
    }
  });
  
  // Generate master index
  const index = {
    generated: new Date().toISOString(),
    totalPages: specs.length,
    specs: specs.map(s => ({
      name: s.name,
      fileName: path.basename(s.filePath, '.tsx'),
      components: s.components.length,
      layout: s.layout.type,
    })),
  };
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'index.json'),
    JSON.stringify(index, null, 2)
  );
  
  console.log(`\n📊 Generated ${specs.length} design specs in ${OUTPUT_DIR}`);
  console.log(`📋 Master index: ${path.join(OUTPUT_DIR, 'index.json')}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Open Pencil in Cursor');
  console.log('   2. Create new .pen files for each page');
  console.log('   3. Use the generated specs as reference');
  console.log('   4. Match the component structure in your designs');
}

main();
