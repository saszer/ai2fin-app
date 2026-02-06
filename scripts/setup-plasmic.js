/**
 * Plasmic Setup Script
 * 
 * This script sets up Plasmic for visual editing of your React components.
 * 
 * Usage: node scripts/setup-plasmic.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLIENT_DIR = path.join(__dirname, '../ai2-core-app/client');
const SRC_DIR = path.join(CLIENT_DIR, 'src');
const PAGES_DIR = path.join(SRC_DIR, 'pages');

console.log('🎨 Setting up Plasmic for visual React editing...\n');

// Check if we're in the right directory
if (!fs.existsSync(CLIENT_DIR)) {
  console.error('❌ Error: ai2-core-app/client directory not found');
  console.error('   Please run this script from the project root');
  process.exit(1);
}

// Step 1: Install Plasmic packages
console.log('📦 Step 1: Installing Plasmic packages...');
try {
  process.chdir(CLIENT_DIR);
  execSync('npm install @plasmicapp/react-web @plasmicapp/loader-nextjs', { stdio: 'inherit' });
  console.log('✅ Plasmic packages installed\n');
} catch (error) {
  console.error('❌ Error installing packages:', error.message);
  process.exit(1);
}

// Step 2: Create plasmic-init.ts
console.log('📝 Step 2: Creating plasmic-init.ts...');
const plasmicInitContent = `/**
 * Plasmic Component Registration
 * 
 * Register your React components here to use them in Plasmic's visual editor.
 * Components registered here will appear in the Plasmic Studio.
 * 
 * Setup: embracingearth.space
 */

import { PLASMIC } from '@plasmicapp/react-web';

// Material-UI Core Components
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  Paper,
  Container,
  Stack,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  CircularProgress,
  Skeleton,
} from '@mui/material';

// Register Material-UI Components
PLASMIC.registerComponent(Card, {
  name: 'MUICard',
  displayName: 'Card',
  description: 'Material-UI Card component',
  props: {
    children: {
      type: 'slot',
      defaultValue: 'Card content',
    },
    elevation: {
      type: 'number',
      defaultValue: 1,
      description: 'Shadow elevation (0-24)',
    },
    sx: {
      type: 'object',
      description: 'Custom styles object',
    },
  },
});

PLASMIC.registerComponent(CardContent, {
  name: 'MUICardContent',
  displayName: 'Card Content',
  props: {
    children: 'slot',
    sx: 'object',
  },
});

PLASMIC.registerComponent(Typography, {
  name: 'MUITypography',
  displayName: 'Typography',
  props: {
    children: {
      type: 'string',
      defaultValue: 'Text content',
    },
    variant: {
      type: 'choice',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body1', 'body2', 'caption', 'overline'],
      defaultValue: 'body1',
    },
    color: {
      type: 'choice',
      options: ['primary', 'secondary', 'textPrimary', 'textSecondary', 'error', 'warning', 'info', 'success'],
      defaultValue: 'textPrimary',
    },
    align: {
      type: 'choice',
      options: ['left', 'center', 'right', 'justify'],
      defaultValue: 'left',
    },
    sx: 'object',
  },
});

PLASMIC.registerComponent(Box, {
  name: 'MUIBox',
  displayName: 'Box',
  description: 'Material-UI Box container',
  props: {
    children: 'slot',
    sx: {
      type: 'object',
      description: 'Custom styles (spacing, colors, etc.)',
    },
  },
});

PLASMIC.registerComponent(Grid, {
  name: 'MUIGrid',
  displayName: 'Grid',
  description: 'Material-UI Grid system',
  props: {
    children: 'slot',
    container: {
      type: 'boolean',
      defaultValue: false,
      description: 'If true, acts as a container',
    },
    item: {
      type: 'boolean',
      defaultValue: false,
      description: 'If true, acts as a grid item',
    },
    xs: {
      type: 'number',
      description: 'Extra small breakpoint (1-12)',
    },
    sm: {
      type: 'number',
      description: 'Small breakpoint (1-12)',
    },
    md: {
      type: 'number',
      description: 'Medium breakpoint (1-12)',
    },
    lg: {
      type: 'number',
      description: 'Large breakpoint (1-12)',
    },
    spacing: {
      type: 'number',
      defaultValue: 2,
      description: 'Spacing between grid items',
    },
  },
});

PLASMIC.registerComponent(Button, {
  name: 'MUIButton',
  displayName: 'Button',
  props: {
    children: {
      type: 'string',
      defaultValue: 'Button',
    },
    variant: {
      type: 'choice',
      options: ['contained', 'outlined', 'text'],
      defaultValue: 'contained',
    },
    color: {
      type: 'choice',
      options: ['primary', 'secondary', 'error', 'warning', 'info', 'success'],
      defaultValue: 'primary',
    },
    size: {
      type: 'choice',
      options: ['small', 'medium', 'large'],
      defaultValue: 'medium',
    },
    disabled: 'boolean',
    fullWidth: 'boolean',
    sx: 'object',
  },
});

PLASMIC.registerComponent(TextField, {
  name: 'MUITextField',
  displayName: 'Text Field',
  props: {
    label: {
      type: 'string',
      defaultValue: 'Label',
    },
    placeholder: 'string',
    value: 'string',
    variant: {
      type: 'choice',
      options: ['outlined', 'filled', 'standard'],
      defaultValue: 'outlined',
    },
    fullWidth: 'boolean',
    disabled: 'boolean',
    required: 'boolean',
    sx: 'object',
  },
});

PLASMIC.registerComponent(Paper, {
  name: 'MUIPaper',
  displayName: 'Paper',
  props: {
    children: 'slot',
    elevation: {
      type: 'number',
      defaultValue: 1,
    },
    sx: 'object',
  },
});

PLASMIC.registerComponent(Container, {
  name: 'MUIContainer',
  displayName: 'Container',
  props: {
    children: 'slot',
    maxWidth: {
      type: 'choice',
      options: ['xs', 'sm', 'md', 'lg', 'xl', false],
      defaultValue: 'lg',
    },
    sx: 'object',
  },
});

PLASMIC.registerComponent(Stack, {
  name: 'MUIStack',
  displayName: 'Stack',
  props: {
    children: 'slot',
    direction: {
      type: 'choice',
      options: ['row', 'column'],
      defaultValue: 'column',
    },
    spacing: {
      type: 'number',
      defaultValue: 2,
    },
    sx: 'object',
  },
});

PLASMIC.registerComponent(Chip, {
  name: 'MUIChip',
  displayName: 'Chip',
  props: {
    label: {
      type: 'string',
      defaultValue: 'Chip',
    },
    color: {
      type: 'choice',
      options: ['default', 'primary', 'secondary', 'error', 'warning', 'info', 'success'],
      defaultValue: 'default',
    },
    variant: {
      type: 'choice',
      options: ['filled', 'outlined'],
      defaultValue: 'filled',
    },
    size: {
      type: 'choice',
      options: ['small', 'medium'],
      defaultValue: 'medium',
    },
  },
});

PLASMIC.registerComponent(Alert, {
  name: 'MUIAlert',
  displayName: 'Alert',
  props: {
    children: {
      type: 'string',
      defaultValue: 'Alert message',
    },
    severity: {
      type: 'choice',
      options: ['error', 'warning', 'info', 'success'],
      defaultValue: 'info',
    },
    variant: {
      type: 'choice',
      options: ['filled', 'outlined', 'standard'],
      defaultValue: 'standard',
    },
  },
});

// 🔒 SECURITY: Only Material-UI components are registered
// Business pages (Dashboard, Transactions, etc.) are NOT registered
// to protect sensitive component structure and business logic
// 
// If you need to register custom components later, do so carefully:
// - Only register non-sensitive UI components
// - Avoid registering pages with business logic
// - Review what data might be exposed

console.log('✅ Plasmic component registration complete (Material-UI only - secure mode)');
console.log('💡 Next steps:');
console.log('   1. Sign up at https://plasmic.app');
console.log('   2. Create a new project');
console.log('   3. Add your project token to .env');
console.log('   4. Visit /plasmic-host in your app');
console.log('   5. Start editing visually!');
`;

const plasmicInitPath = path.join(SRC_DIR, 'plasmic-init.ts');
fs.writeFileSync(plasmicInitPath, plasmicInitContent);
console.log('✅ Created plasmic-init.ts\n');

// Step 3: Create plasmic-host page
console.log('📄 Step 3: Creating plasmic-host page...');
const plasmicHostContent = `/**
 * Plasmic Canvas Host
 * 
 * This page hosts Plasmic Studio for visual editing.
 * Access it at: /plasmic-host
 * 
 * Setup: embracingearth.space
 */

import React from 'react';
import { PlasmicCanvasHost } from '@plasmicapp/react-web';
import '../plasmic-init'; // Import to register components

export default function PlasmicHost() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <PlasmicCanvasHost />
    </div>
  );
}
`;

const plasmicHostPath = path.join(PAGES_DIR, 'PlasmicHost.tsx');
fs.writeFileSync(plasmicHostPath, plasmicHostContent);
console.log('✅ Created PlasmicHost.tsx\n');

// Step 4: Create .env.example entry
console.log('⚙️  Step 4: Creating environment variable template...');
const envExample = `
# Plasmic Configuration
# Get your project token from: https://studio.plasmic.app
PLASMIC_PROJECT_ID=your-project-id-here
PLASMIC_PROJECT_API_TOKEN=your-api-token-here
`;

const envExamplePath = path.join(CLIENT_DIR, '.env.example');
if (fs.existsSync(envExamplePath)) {
  const existing = fs.readFileSync(envExamplePath, 'utf-8');
  if (!existing.includes('PLASMIC')) {
    fs.appendFileSync(envExamplePath, envExample);
    console.log('✅ Added Plasmic config to .env.example\n');
  } else {
    console.log('ℹ️  Plasmic config already in .env.example\n');
  }
} else {
  fs.writeFileSync(envExamplePath, envExample);
  console.log('✅ Created .env.example with Plasmic config\n');
}

// Step 5: Update App.tsx or routing (if needed)
console.log('📋 Step 5: Setup complete!\n');

console.log('🎉 Plasmic setup complete!\n');
console.log('📝 Next steps:');
console.log('   1. Sign up at https://plasmic.app (free tier available)');
console.log('   2. Create a new project');
console.log('   3. Get your project ID and API token');
console.log('   4. Add to .env file:');
console.log('      PLASMIC_PROJECT_ID=your-id');
console.log('      PLASMIC_PROJECT_API_TOKEN=your-token');
console.log('   5. Import plasmic-init in your App.tsx:');
console.log('      import "./plasmic-init";');
console.log('   6. Add route for /plasmic-host');
console.log('   7. Start your dev server and visit /plasmic-host');
console.log('   8. Start editing your components visually! 🎨\n');
console.log('📚 See VISUAL_REACT_EDITOR_GUIDE.md for detailed instructions\n');
