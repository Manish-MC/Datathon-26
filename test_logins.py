import asyncio
from playwright.async_api import async_playwright

async def run():
    logins = [
        ("PC_10452_2015", "ksp_1709"),
        ("PI_0007_2003", "ksp_1709"),
        ("DGP_0001_1983", "ksp_1709")
    ]
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        errors = []
        page.on("pageerror", lambda err: errors.append(err.message))
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        
        success_count = 0
        
        for login_id, pwd in logins:
            print(f"Testing {login_id}...")
            errors.clear()
            await page.goto("http://localhost:5173/")
            
            # Wait for form
            await page.wait_for_selector("input[type='text']")
            
            await page.fill("input[type='text']", login_id)
            await page.fill("input[type='password']", pwd)
            await page.click("button:has-text('Sign In')")
            
            # Wait for dashboard to load or errors
            try:
                await page.wait_for_selector("text=Decision-Support", timeout=5000)
                await page.wait_for_timeout(500)
                
                content = await page.content()
                if "Decision-Support" in content and len(errors) == 0:
                    print(f"  [OK] {login_id} logged in successfully and dashboard loaded.")
                    success_count += 1
                else:
                    print(f"  [ERROR] {login_id} loaded but had errors. Errors: {errors}")
            except Exception as e:
                print(f"  [FAIL] {login_id} failed to load dashboard: {e}")
                print(f"         Errors caught: {errors}")
                
            try:
                # Wait for logout button (or click user menu and logout)
                await page.click("button:has-text('Sign Out')")
            except:
                await page.evaluate("localStorage.clear(); sessionStorage.clear();")
                await page.goto("http://localhost:5173/")
                
        await browser.close()
        print(f"\nCompleted: {success_count}/{len(logins)} passed.")

asyncio.run(run())
