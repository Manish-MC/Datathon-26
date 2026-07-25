import asyncio
from playwright.async_api import async_playwright

async def run():
    ranks = [
        "PC_10452_2015",
        "HC_10218_2011",
        "ASI_10084_2009",
        "SI_10021_2007",
        "PI_0007_2003",
        "DYSP_015_1999",
        "SP_0042_1995",
        "DIG_0028_1993",
        "IGP_0011_1991",
        "ADGP_0004_1987",
        "ADGP_0005_1987",
        "DGP_0001_1983",
        "ADMIN_001"
    ]
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        errors = []
        page.on("pageerror", lambda exc: errors.append(exc.message))
        
        for rank in ranks:
            print(f"Testing {rank}...")
            errors.clear()
            await page.goto("http://localhost:5173", wait_until="networkidle")
            
            # Use appropriate password
            pwd = "ksp_admin_1709" if rank == "ADMIN_001" else "ksp_1709"
            
            try:
                await page.fill('input[type="text"]', rank)
                await page.fill('input[type="password"]', pwd)
                await page.click('button:has-text("Sign In")')
                
                await page.wait_for_timeout(3000)
                
                if errors:
                    print(f"[FAIL] {rank} encountered errors: {errors}")
                else:
                    print(f"[OK] {rank} loaded successfully.")
                    
                # Logout
                logout_btn = page.locator('button:has-text("Logout")')
                if await logout_btn.count() > 0:
                    await logout_btn.click()
                    await page.wait_for_timeout(1000)
                else:
                    print(f"[WARN] {rank} could not find logout button. Re-navigating to clear session.")
                    # Fallback to clear storage manually
                    await page.evaluate("sessionStorage.clear(); localStorage.clear();")
                    await page.goto("http://localhost:5173", wait_until="networkidle")
            except Exception as e:
                print(f"[ERROR] {rank} failed during test script: {str(e)}")

        await browser.close()

asyncio.run(run())
