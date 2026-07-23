import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Intercept and log network failures
  page.on('response', async (response) => {
    if (!response.ok() && response.request().resourceType() === 'fetch') {
      console.log(`[NETWORK FAIL] Status: ${response.status()} | URL: ${response.url()}`);
      try {
        const text = await response.text();
        console.log(`[NETWORK FAIL BODY] ${text}`);
      } catch (e) {}
    }
  });

  // Intercept and log console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  page.on('requestfailed', request => {
    if (request.resourceType() === 'fetch') {
        console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure().errorText}`);
    }
  });

  console.log("Navigating to Login...");
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });

  // Login
  await page.type('input[placeholder="Enter your Login ID"]', 'HC_10218_2011');
  await page.type('input[type="password"]', 'ksp_1709');
  await page.click('button[type="submit"]');

  console.log("Waiting for Dashboard to load...");
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000)); // wait for polling to settle

  console.log("\n--- Navigating to Spatial Analysis Map ---");
  await page.click('a[href="/map"]'); // Assuming there's a link to /map
  await new Promise(r => setTimeout(r, 2000));

  console.log("\n--- Navigating to Case Similarity Match ---");
  await page.goto('http://localhost:5173/case-similarity', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  console.log("\nDone gathering data.");
  await browser.close();
})();
