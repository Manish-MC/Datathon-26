import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        await page.goto("http://localhost:5173")
        
        await page.fill('input[type="text"]', 'DGP_0001_1983')
        await page.fill('input[type="password"]', 'ksp_1709')
        await page.click('button:has-text("Sign In")')
        
        await page.wait_for_timeout(5000)
        await browser.close()

asyncio.run(run())
