const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

async function testPage() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  
  // Collect console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      // Ignore some common non-critical errors
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('404')) {
        errors.push(`Console error: ${text}`);
      }
    }
  });
  
  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });
  
  try {
    // Start Next.js development server
    console.log('Starting Next.js server...');
    const nextProcess = spawn('npx', ['next', 'dev', '-p', '3001'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    // Wait for server to start
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 30000);
      
      nextProcess.stdout.on('data', (data) => {
        console.log(`Server: ${data}`);
        if (data.toString().includes('Ready in') || data.toString().includes('compiled')) {
          clearTimeout(timeout);
          resolve(true);
        }
      });
      
      nextProcess.stderr.on('data', (data) => {
        console.log(`Server stderr: ${data}`);
      });
      
      nextProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
    
    console.log('Server started, navigating to page...');
    
    // Navigate to the page
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Page loaded successfully');
    
    // Wait for the page to be fully rendered (client-side hydration)
    await page.waitForSelector('h1', { timeout: 15000 });
    console.log('Title element found');
    
    // Get the title text
    const title = await page.locator('h1').first().textContent();
    console.log(`Page title: ${title}`);
    
    // Check for hidden items (buttons with SVG icons)
    const hiddenItems = await page.locator('button[class*="hiddenItem"]').count();
    console.log(`Hidden items found: ${hiddenItems}`);
    
    // Check for counter
    const counter = await page.locator('[class*="counter"]').count();
    console.log(`Counter found: ${counter > 0}`);
    
    // Check for mute button
    const muteButton = await page.locator('[class*="muteButton"]').count();
    console.log(`Mute button found: ${muteButton > 0}`);
    
    // Check for background SVG
    const backgroundSvg = await page.locator('svg[class*="background"]').count();
    console.log(`Background SVG found: ${backgroundSvg > 0}`);
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000);
    
    // Stop the server
    nextProcess.kill();
    
    // Report errors
    if (errors.length > 0) {
      console.log('\n=== ERRORS FOUND ===');
      errors.forEach(err => console.log(err));
      process.exit(1);
    } else {
      console.log('\n=== NO ERRORS - TEST PASSED ===');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testPage();
