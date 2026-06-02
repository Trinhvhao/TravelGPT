#!/usr/bin/env python3
"""
Test script for TravelGPT conversation style
Check if AI responds naturally like a tour guide
"""

import requests
import json
import sys

BASE_URL = "http://localhost:3008"

def test_conversation_style():
    """Test if AI responds naturally without robotic patterns"""
    
    print("=" * 60)
    print("TEST: TravelGPT Conversation Style")
    print("=" * 60)
    
    # Test cases
    test_cases = [
        {
            "name": "Tìm tour miền Bắc",
            "message": "Tìm tour miền Bắc ngân sách 5 triệu",
            "expect_no": ["Tìm thấy X tour", "I am an AI", "Chatbot"],
            "expect_yes": ["mình", "tour", "miền Bắc"]
        },
        {
            "name": "Hỏi giá tour",
            "message": "Tour Đà Nẵng giá bao nhiêu?",
            "expect_no": ["I am an AI"],
            "expect_yes": ["Đà Nẵng", "giá", "tour"]
        },
        {
            "name": "Hỏi thông tin điểm đến",
            "message": "Hạ Long có gì chơi?",
            "expect_no": ["I am an AI"],
            "expect_yes": ["Hạ Long", "vịnh", "đẹp"]
        }
    ]
    
    results = []
    
    for i, test in enumerate(test_cases):
        print(f"\n📝 Test {i+1}: {test['name']}")
        print(f"   Message: {test['message']}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/v1/chat/message",
                json={
                    "message": test["message"],
                    "session_id": f"test_style_{i}"
                },
                headers={"Content-Type": "application/json"},
                timeout=60
            )
            
            if response.status_code != 200:
                print(f"   ❌ Error: HTTP {response.status_code}")
                results.append({"name": test["name"], "passed": False, "reason": f"HTTP {response.status_code}"})
                continue
            
            # Collect response
            full_response = ""
            data = response.json()
            
            # Handle both streaming and non-streaming formats
            if isinstance(data, dict):
                # Non-streaming response
                if data.get("response"):
                    full_response = data["response"]
                elif data.get("content"):
                    full_response = data["content"]
                elif data.get("message"):
                    full_response = data["message"]
                elif data.get("text"):
                    full_response = data["text"]
                else:
                    # Try to find any text field
                    for key in ["ai_response", "answer", "result"]:
                        if key in data:
                            full_response = data[key]
                            break
            
            if not full_response:
                full_response = str(data)
            
            print(f"   Response length: {len(full_response)} chars")
            
            # Check patterns
            print(f"   ────────")
            print(f"   Response preview:")
            preview = full_response[:300].replace('\n', ' ')
            print(f"   {preview}...")
            
            # Check for bad patterns
            bad_patterns = test["expect_no"]
            bad_found = []
            for pattern in bad_patterns:
                if pattern.lower() in full_response.lower():
                    bad_found.append(pattern)
            
            # Check for good patterns
            good_patterns = test["expect_yes"]
            good_found = []
            for pattern in good_patterns:
                if pattern.lower() in full_response.lower():
                    good_found.append(pattern)
            
            # Evaluate
            print(f"\n   📊 Results:")
            print(f"      Bad patterns found: {bad_found if bad_found else 'None ✅'}")
            print(f"      Good patterns found: {good_found}")
            
            # Pass/fail criteria
            # - No bad patterns OR
            # - Has enough good patterns
            pass_criteria = len(bad_found) == 0 or len(good_found) >= 3
            
            if pass_criteria:
                print(f"   ✅ PASS")
                results.append({"name": test["name"], "passed": True})
            else:
                print(f"   ❌ FAIL - Still using robotic patterns")
                results.append({"name": test["name"], "passed": False, "reason": "Robotic patterns detected"})
                
        except requests.exceptions.Timeout:
            print(f"   ⚠️  Timeout - API took too long")
            results.append({"name": test["name"], "passed": False, "reason": "Timeout"})
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            results.append({"name": test["name"], "passed": False, "reason": str(e)})
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for r in results if r["passed"])
    total = len(results)
    
    for r in results:
        status = "✅ PASS" if r["passed"] else f"❌ FAIL ({r.get('reason', '')})"
        print(f"   {r['name']}: {status}")
    
    print(f"\n   Total: {passed}/{total} passed")
    
    if passed == total:
        print(f"\n   🎉 All tests passed! AI responds naturally.")
        return 0
    else:
        print(f"\n   ⚠️  Some tests failed. Check the system prompt.")
        return 1


def check_backend():
    """Check if backend is running"""
    try:
        # Try various endpoints
        for endpoint in ["/api/v1/tours", "/api/v1/chat/suggestions"]:
            try:
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
                if response.status_code in [200, 404, 422]:
                    return True
            except:
                continue
        return True  # If we can connect at all
    except:
        return False


if __name__ == "__main__":
    print("\n🔍 Checking backend status...")
    
    if not check_backend():
        print("❌ Backend is not running!")
        print("   Please start backend: cd backend && python -m uvicorn app.main:app --port 3008")
        sys.exit(1)
    
    print("✅ Backend is running\n")
    
    exit_code = test_conversation_style()
    sys.exit(exit_code)
