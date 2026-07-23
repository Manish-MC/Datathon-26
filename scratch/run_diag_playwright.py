from playwright.sync_api import sync_playwright
import time
import sys

def p(msg):
    print(msg)
    sys.stdout.flush()

def run():
    with sync_playwright() as pw:
        p("Launching browser...")
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        def on_console(msg):
            if msg.type == 'error':
                p(f"[CONSOLE ERROR] {msg.text}")
                
        def on_response(response):
            if not response.ok and response.request.resource_type == 'fetch':
                p(f"[NETWORK FAIL] Status: {response.status} | URL: {response.url}")
                try:
                    p(f"[NETWORK FAIL BODY] {response.text()}")
                except Exception as e:
                    pass

        def on_request_failed(request):
            if request.resource_type == 'fetch':
                p(f"[REQUEST FAILED] {request.url} - {request.failure}")

        page.on("console", on_console)
        page.on("response", on_response)
        page.on("requestfailed", on_request_failed)

        p("Navigating to Login...")
        page.goto('http://localhost:5173/login')
        
        page.fill('input[placeholder="Officer Login ID"]', 'HC_10218_2011')
        page.fill('input[type="password"]', 'ksp_1709')
        page.click('button[type="submit"]')

        p("Waiting for Dashboard to load...")
        page.wait_for_url('http://localhost:5173/')
        time.sleep(3)

        p("\n--- Navigating to Spatial Analysis Map ---")
        page.goto('http://localhost:5173/map')
        time.sleep(3)
        
        p("\n--- Navigating to Case Similarity Match ---")
        page.goto('http://localhost:5173/similarity')
        time.sleep(3)

        p("\nDone gathering data.")
        browser.close()

if __name__ == '__main__':
    run()
