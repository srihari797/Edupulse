import sys
import platform
import asyncio
import uvicorn

def custom_selector_loop(*args, **kwargs):
    return asyncio.SelectorEventLoop()

if platform.system() == "Windows":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, loop=custom_selector_loop, reload=False)
