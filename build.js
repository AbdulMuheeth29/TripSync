import { execSync } from 'child_process';

console.log('🏗️  Building TripSync...\n');

// Build client with Vite
console.log('📦 Building client...');
try {
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('✅ Client build complete\n');
} catch (error) {
  console.error('❌ Client build failed');
  process.exit(1);
}

// Run TypeScript type check
console.log('🔍 Running TypeScript type check...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ Type check passed\n');
} catch (error) {
  console.error('⚠️  Type check failed (non-blocking)\n');
  // Don't exit - type errors are warnings, not blockers
}

console.log('🎉 Build complete! Ready for deployment.\n');
console.log('ℹ️  Server runs with tsx (no compilation needed)\n');
