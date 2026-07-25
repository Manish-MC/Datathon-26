const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Catch console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request =>
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText)
  );

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  // Wait for login form
  await page.waitForSelector('input[type="text"]');
  
  // Login as SP
  await page.type('input[type="text"]', 'SP_0042_1995');
  await page.type('input[type="password"]', 'ksp_1709');
  
  // Click login button (first button on page)
  await page.click('button');
  
  // Wait a bit to let dashboard load and crash if it's going to
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
})();
