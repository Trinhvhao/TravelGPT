"""
Weather Service — lấy thông tin thời tiết qua Playwright scraping.
Fallback sang hardcoded data nếu Playwright không khả dụng.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Vietnamese destinations → weather.com search terms
DESTINATION_WEATHER_CODES = {
    "đà nẵng": "Da-Nang-Vietnam",
    "da nang": "Da-Nang-Vietnam",
    "hà nội": "Hanoi-Vietnam",
    "hanoi": "Hanoi-Vietnam",
    "tp hcm": "Ho-Chi-Minh-City-Vietnam",
    "sài gòn": "Ho-Chi-Minh-City-Vietnam",
    "saigon": "Ho-Chi-Minh-City-Vietnam",
    "hồ chí minh": "Ho-Chi-Minh-City-Vietnam",
    "nha trang": "Nha-Trang-Vietnam",
    "nhatrang": "Nha-Trang-Vietnam",
    "phú quốc": "Phu-Quoc-Island-Vietnam",
    "phu quoc": "Phu-Quoc-Island-Vietnam",
    "hội an": "Hoi-An-Vietnam",
    "hoi an": "Hoi-An-Vietnam",
    "hạ long": "Ha-Long-Vietnam",
    "ha long": "Ha-Long-Vietnam",
    "sapa": "Sa-Pa-Vietnam",
    "đà lạt": "Da-Lat-Vietnam",
    "da lat": "Da-Lat-Vietnam",
    "huế": "Hue-Vietnam",
    "hue": "Hue-Vietnam",
    "quy nhơn": "Quy-Nhon-Vietnam",
    "quy nhon": "Quy-Nhon-Vietnam",
}

# Best time to visit recommendations
BEST_TIMES = {
    "đà nẵng": "Tháng 2 - Tháng 5 (mùa xuân, mát mẻ, ít mưa). Tránh Tháng 9 - 11 (mùa mưa bão).",
    "da nang": "Tháng 2 - Tháng 5 (mùa xuân, mát mẻ, ít mưa). Tránh Tháng 9 - 11 (mùa mưa bão).",
    "hà nội": "Tháng 10 - Tháng 11 (thu sang, mát mẻ). Tháng 3 - Tháng 4 (hoa ban nở ở Sapa gần đó).",
    "hanoi": "Tháng 10 - Tháng 11 (thu sang, mát mẻ). Tháng 3 - Tháng 4 (hoa ban nở ở Sapa gần đó).",
    "tp hcm": "Tháng 12 - Tháng 3 (mùa khô, mát). Tránh Tháng 5 - 10 (mùa mưa).",
    "sài gòn": "Tháng 12 - Tháng 3 (mùa khô, mát). Tránh Tháng 5 - 10 (mùa mưa).",
    "saigon": "Tháng 12 - Tháng 3 (mùa khô, mát). Tránh Tháng 5 - 10 (mùa mưa).",
    "nha trang": "Tháng 2 - Tháng 9 (nắng đẹp, biển trong xanh). Đặc biệt Tháng 4 - 8.",
    "nhatrang": "Tháng 2 - Tháng 9 (nắng đẹp, biển trong xanh). Đặc biệt Tháng 4 - 8.",
    "phú quốc": "Tháng 11 - Tháng 3 (mùa khô, nắng đẹp). Biển đẹp nhất Tháng 12 - 2.",
    "phu quoc": "Tháng 11 - Tháng 3 (mùa khô, nắng đẹp). Biển đẹp nhất Tháng 12 - 2.",
    "hội an": "Tháng 2 - Tháng 5 (thời tiết dễ chịu). Đặc biệt Tháng 3 - 5 (lễ hội lantern).",
    "hoi an": "Tháng 2 - Tháng 5 (thời tiết dễ chịu). Đặc biệt Tháng 3 - 5 (lễ hội lantern).",
    "hạ long": "Tháng 5 - Tháng 10 (nắng, biển đẹp). Mùa đông 12-2 lạnh nhưng có sương mù ma mị.",
    "ha long": "Tháng 5 - Tháng 10 (nắng, biển đẹp). Mùa đông 12-2 lạnh nhưng có sương mù ma mị.",
    "sapa": "Tháng 9 - Tháng 11 (lúa chín vàng). Tháng 12 - Tháng 2 (tuyết rơi hiếm).",
    "đà lạt": "Tháng 10 - Tháng 3 (mùa khô, hoa Anh Đào nở Tháng 1-3).",
    "da lat": "Tháng 10 - Tháng 3 (mùa khô, hoa Anh Đào nở Tháng 1-3).",
    "huế": "Tháng 1 - Tháng 4 (trời nắng, mát). Tránh Tháng 10 - 12 (mưa bão).",
    "hue": "Tháng 1 - Tháng 4 (trời nắng, mát). Tránh Tháng 10 - 12 (mưa bão).",
}

# Weather condition icons
WEATHER_ICONS = {
    "sunny": "☀️",
    "partly_cloudy": "⛅",
    "cloudy": "☁️",
    "rain": "🌧️",
    "heavy_rain": "⛈️",
    "storm": "⛈️",
    "hot": "🔥",
    "cold": "❄️",
}


def _get_fallback_weather(destination: str) -> dict:
    """Trả về thông tin thời tiết hardcoded khi Playwright fails."""
    dest_lower = destination.lower().strip()

    # Determine season (approximate)
    from datetime import datetime
    month = datetime.now().month

    if 3 <= month <= 5:
        season = "spring"
    elif 6 <= month <= 8:
        season = "summer"
    elif 9 <= month <= 11:
        season = "autumn"
    else:
        season = "winter"

    # Season-based temperature estimates for each destination
    base_temps = {
        "đà nẵng": {"spring": 26, "summer": 32, "autumn": 25, "winter": 22},
        "hà nội": {"spring": 24, "summer": 33, "autumn": 25, "winter": 18},
        "tp hcm": {"spring": 33, "summer": 32, "autumn": 31, "winter": 32},
        "nha trang": {"spring": 28, "summer": 30, "autumn": 27, "winter": 25},
        "phú quốc": {"spring": 30, "summer": 29, "autumn": 28, "winter": 29},
        "hội an": {"spring": 26, "summer": 32, "autumn": 25, "winter": 22},
        "hạ long": {"spring": 24, "summer": 30, "autumn": 25, "winter": 18},
        "sapa": {"spring": 18, "summer": 22, "autumn": 16, "winter": 10},
        "đà lạt": {"spring": 20, "summer": 22, "autumn": 18, "winter": 15},
        "huế": {"spring": 26, "summer": 33, "autumn": 25, "winter": 22},
    }

    temp = 28  # default
    for dest_key, temps in base_temps.items():
        if dest_key in dest_lower or dest_lower in dest_key:
            temp = temps.get(season, 28)
            break

    # Determine condition
    if season == "summer":
        condition = "Nắng nóng"
        icon = "sunny"
        humidity = 75
    elif season == "winter":
        condition = "Mát mẻ"
        icon = "cloudy"
        humidity = 70
    else:
        condition = "Nắng nhẹ"
        icon = "partly_cloudy"
        humidity = 72

    # Best time
    best_time = "Quanh năm đều đẹp"
    for dest_key, time in BEST_TIMES.items():
        if dest_key in dest_lower or dest_lower in dest_key:
            best_time = time
            break

    # Travel advice
    if season == "summer":
        advice = "☀️ Nắng nóng, nhớ mang kem chống nắng, nón, và uống đủ nước. Tránh ra ngoài trưa 11h-14h."
    elif season == "winter":
        if temp < 15:
            advice = "🧥 Trời lạnh, mang theo áo ấm, đặc biệt buổi sáng và tối. Có thể có sương mù."
        else:
            advice = "🌤️ Thời tiết mát mẻ dễ chịu. Mang theo áo khoác nhẹ cho buổi tối."
    else:
        advice = "🌿 Thời tiết lý tưởng cho du lịch. Nhớ mang theo kem chống nắng và nón khi ra ngoài trưa."

    return {
        "destination": destination,
        "current": {
            "temperature": temp,
            "condition": condition,
            "humidity": humidity,
            "wind": f"{temp + 5} km/h",
            "icon": icon,
            "icon_emoji": WEATHER_ICONS.get(icon, "☀️"),
        },
        "forecast": [],
        "best_time_to_visit": best_time,
        "travel_advice": advice,
        "source": "estimated",
    }


async def get_weather_async(destination: str, date: Optional[str] = None) -> dict:
    """
    Lấy thông tin thời tiết cho destination.
    Thử Playwright trước, fallback sang data ước lượng.
    """
    try:
        result = await _scrape_weather(destination)
        if result:
            result["source"] = "live"
            return result
    except Exception as e:
        logger.warning(f"Weather scrape failed for {destination}: {e}")

    return _get_fallback_weather(destination)


async def _scrape_weather(destination: str) -> Optional[dict]:
    """
    Scrape weather từ weather.com qua Playwright.
    Returns None nếu thất bại → caller sẽ dùng fallback.
    """
    try:
        from playwright.async_api import async_playwright

        # Normalize destination
        dest_lower = destination.lower().strip()
        weather_code = DESTINATION_WEATHER_CODES.get(dest_lower)

        if not weather_code:
            # Try partial match
            for key, code in DESTINATION_WEATHER_CODES.items():
                if key in dest_lower or dest_lower in key:
                    weather_code = code
                    break

        if not weather_code:
            return None

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            url = f"https://weather.com/vi-VN/weather/today/l/{weather_code}"
            await page.goto(url, wait_until="domcontentloaded", timeout=10000)

            # Extract temperature
            temp_elem = await page.query_selector(
                '//*[@data-testid="TemperatureValue"] | '
                '//div[contains(@class,"CurrentConditions")]//span[contains(@class,"temp")]'
            )
            temperature = None
            if temp_elem:
                temp_text = await temp_elem.inner_text()
                import re
                match = re.search(r'(\d+)', temp_text)
                if match:
                    temperature = int(match.group(1))

            # Extract condition
            cond_elem = await page.query_selector(
                '//*[@data-testid="CurrentConditionsPhrase"] | '
                '//div[contains(@class,"CurrentConditions")]//span[contains(@class,"phrase")]'
            )
            condition = "Nắng"
            if cond_elem:
                condition = (await cond_elem.inner_text()).strip()

            # Extract humidity
            hum_elem = await page.query_selector(
                '//*[@data-testid="HumidityValue"]'
            )
            humidity = 70
            if hum_elem:
                hum_text = await hum_elem.inner_text()
                match = re.search(r'(\d+)', hum_text)
                if match:
                    humidity = int(match.group(1))

            await browser.close()

            if temperature is None:
                return None

            # Map condition to icon
            cond_lower = condition.lower()
            if any(w in cond_lower for w in ["nắng", "sun", "clear"]):
                icon = "sunny"
            elif any(w in cond_lower for w in ["mây", "cloud", "overcast"]):
                icon = "cloudy"
            elif any(w in cond_lower for w in ["mưa", "rain", "shower"]):
                icon = "rain"
            elif any(w in cond_lower for w in ["bão", "storm", "thunder"]):
                icon = "storm"
            else:
                icon = "partly_cloudy"

            # Best time
            best_time = BEST_TIMES.get(dest_lower, "Quanh năm đẹp")
            for dest_key, time in BEST_TIMES.items():
                if dest_key in dest_lower or dest_lower in dest_key:
                    best_time = time
                    break

            # Travel advice
            if temperature > 32:
                advice = f"☀️ Nắng nóng {temperature}°C! Nhớ mang kem chống nắng, nón, nước uống. Tránh ra ngoài trưa 11h-14h."
            elif temperature < 20:
                advice = f"🧥 Trời mát {temperature}°C, mang theo áo khoác nhẹ. Buổi sáng/tối có thể lạnh hơn."
            else:
                advice = f"🌤️ Thời tiết {temperature}°C — dễ chịu cho du lịch. Nhớ mang kem chống nắng khi ra ngoài."

            return {
                "destination": destination,
                "current": {
                    "temperature": temperature,
                    "condition": condition,
                    "humidity": humidity,
                    "wind": "15 km/h",  # weather.com không dễ extract wind speed
                    "icon": icon,
                    "icon_emoji": WEATHER_ICONS.get(icon, "☀️"),
                },
                "forecast": [],
                "best_time_to_visit": best_time,
                "travel_advice": advice,
            }

    except ImportError:
        logger.warning("Playwright not installed, using fallback weather data")
        return None
    except Exception as e:
        logger.warning(f"Playwright weather scrape error: {e}")
        return None


def get_weather_service():
    """Factory — trả về module-level functions."""
    return {
        "get_weather": get_weather_async,
        "_fallback": _get_fallback_weather,
    }
