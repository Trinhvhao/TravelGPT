#!/usr/bin/env python3
"""
Check all image URLs referenced in seed.py IMG dict and find working replacements.
Run: python backend/prisma/check_images.py
"""
import asyncio
import aiohttp
import re
import sys

def extract_img_from_seed() -> dict[str, list[str]]:
    """Parse IMG dict from seed.py source."""
    with open("prisma/seed.py", encoding="utf-8") as f:
        src = f.read()

    # Find IMG dict content between IMG = { and the closing }
    match = re.search(r'IMG\s*=\s*\{(.*?)\n    \}', src, re.DOTALL)
    if not match:
        print("ERROR: Could not find IMG dict in seed.py")
        sys.exit(1)

    img_text = match.group(1)
    result = {}

    # Parse each key-value pair: "key": ["url1", "url2", ...]
    # The pattern: "key": [ "url1", ... ]
    entries = re.findall(r'"(\w+)":\s*\[(.*?)\]', img_text, re.DOTALL)
    for key, urls_text in entries:
        urls = re.findall(r'"(https?://[^"]+)"', urls_text)
        result[key] = urls

    return result


async def check_url(session: aiohttp.ClientSession, url: str) -> tuple[str, int, bool]:
    """Check if a URL returns 200. Returns (url, status_code, ok)."""
    try:
        async with session.head(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            return (url, resp.status, 200 <= resp.status < 400)
    except Exception:
        return (url, 0, False)


async def check_all():
    """Check all URLs concurrently."""
    ALL_URLS = extract_img_from_seed()

    all_urls = []
    url_to_key = {}
    for key, urls in ALL_URLS.items():
        for url in urls:
            all_urls.append(url)
            url_to_key[url] = key

    results: dict[str, list[tuple]] = {}
    broken_by_key: dict[str, list[str]] = {}

    connector = aiohttp.TCPConnector(limit=20)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [check_url(session, url) for url in all_urls]
        for coro in asyncio.as_completed(tasks):
            url, status, ok = await coro
            key = url_to_key[url]
            if key not in results:
                results[key] = []
            results[key].append((url, status, ok))
            if not ok:
                broken_by_key.setdefault(key, []).append(url)

    # Print report
    print("\n" + "="*70)
    print("IMAGE URL CHECK REPORT (from seed.py)")
    print("="*70)

    all_ok = True
    for key, checks in sorted(results.items()):
        ok_count = sum(1 for _, _, ok in checks if ok)
        total = len(checks)
        status_emoji = "✅" if ok_count == total else "❌"
        print(f"\n{status_emoji} {key.upper()} ({ok_count}/{total} OK)")

        for url, status_code, ok in checks:
            short_url = url.replace("https://images.unsplash.com/", "").replace("?w=800", "")
            if ok:
                print(f"   ✅ {short_url}")
            else:
                print(f"   ❌ [{status_code}] {short_url}")
                all_ok = False

    print("\n" + "="*70)
    if all_ok:
        print("✅ ALL IMAGES OK!")
    else:
        print("❌ SOME IMAGES BROKEN - Need replacement")
        print("\nBroken destinations:")
        for key, urls in sorted(broken_by_key.items()):
            print(f"  • {key}: {len(urls)} broken")
            for u in urls:
                short = u.replace("https://images.unsplash.com/", "").replace("?w=800", "")
                print(f"      - {short}")

    return broken_by_key


if __name__ == "__main__":
    asyncio.run(check_all())
