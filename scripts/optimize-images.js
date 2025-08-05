#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simple image optimization without external dependencies
// In a real project, you'd use imagemin or similar tools

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = path.join(__dirname, '../src/assets');
const MAX_IMAGE_SIZE = 50 * 1024; // 50KB

function analyzeImages() {
  console.log('🖼️  Analyzing images...\n');
  
  const files = fs.readdirSync(ASSETS_DIR, { recursive: true });
  const imageFiles = files.filter(file => 
    typeof file === 'string' && /\.(png|jpg|jpeg|gif|svg)$/i.test(file)
  );
  
  let totalSize = 0;
  const largeImages = [];
  
  imageFiles.forEach(file => {
    const filePath = path.join(ASSETS_DIR, file);
    const stats = fs.statSync(filePath);
    const sizeKB = stats.size / 1024;
    
    totalSize += sizeKB;
    
    console.log(`📄 ${file}: ${sizeKB.toFixed(2)} KB`);
    
    if (stats.size > MAX_IMAGE_SIZE) {
      largeImages.push({
        file,
        size: sizeKB,
        path: filePath
      });
    }
  });
  
  console.log(`\n📊 Total images size: ${totalSize.toFixed(2)} KB`);
  
  if (largeImages.length > 0) {
    console.log('\n⚠️  Large images found (>50KB):');
    largeImages.forEach(img => {
      console.log(`   - ${img.file}: ${img.size.toFixed(2)} KB`);
    });
    
    console.log('\n💡 Recommendations:');
    console.log('   - Compress images using tools like tinypng.com');
    console.log('   - Convert large PNGs to WebP format');
    console.log('   - Use responsive images with srcset');
    console.log('   - Consider lazy loading for non-critical images');
  } else {
    console.log('\n✅ All images are optimized (<50KB each)');
  }
  
  return {
    totalFiles: imageFiles.length,
    totalSize,
    largeImages
  };
}

// Recommendations for optimization
function generateOptimizationSuggestions() {
  console.log('\n🚀 Additional optimization suggestions:');
  console.log('   1. Add image preloading for critical images');
  console.log('   2. Implement WebP format with fallbacks');
  console.log('   3. Use CSS sprites for small icons');
  console.log('   4. Consider using icon fonts or SVG sprites');
  console.log('   5. Add proper image dimensions to prevent layout shift');
}

// Main execution
console.log('🎯 Image Optimization Analysis\n');

if (!fs.existsSync(ASSETS_DIR)) {
  console.error('❌ Assets directory not found');
  process.exit(1);
}

const results = analyzeImages();
generateOptimizationSuggestions();

console.log('\n✨ Analysis complete!');