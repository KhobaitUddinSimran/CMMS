import asyncio
import json
import httpx
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

async def test_email_service():
    """Test email service by requesting password reset"""
    print("\n" + "="*60)
    print("📧 TEST 1: EMAIL SERVICE (OTP Delivery)")
    print("="*60)
    
    async with httpx.AsyncClient() as client:
        # Test 1: Request password reset (should send OTP email)
        email = "uddinsimran@graduate.utm.my"
        print(f"\n🔹 Requesting password reset for: {email}")
        try:
            response = await client.post(
                f"{BASE_URL}/auth/password-reset",
                params={"email": email},
                timeout=10.0
            )
            if response.status_code == 200:
                print(f"✅ Password reset requested successfully")
                print(f"   Response: {response.json()}")
                print(f"\n📨 Check your email at: {email}")
                print(f"   You should receive an OTP within 1-2 seconds")
                return True
            else:
                print(f"❌ Failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return False

async def test_rate_limiting():
    """Test rate limiting with rapid login attempts"""
    print("\n" + "="*60)
    print("🔐 TEST 2: RATE LIMITING (5/15 minutes)")
    print("="*60)
    
    email = "uddinsimran@graduate.utm.my"
    password = "password@cmms"
    
    async with httpx.AsyncClient() as client:
        for attempt in range(6):
            print(f"\n🔹 Login attempt #{attempt + 1}...", end="")
            try:
                response = await client.post(
                    f"{BASE_URL}/auth/login",
                    json={"email": email, "password": password},
                    timeout=5.0
                )
                if response.status_code == 200:
                    data = response.json()
                    print(f" ✅ SUCCESS")
                    print(f"   Token: {data.get('access_token', '')[:20]}...")
                elif response.status_code == 429:
                    print(f" ⛔ RATE LIMITED")
                    print(f"   {response.text}")
                    print(f"\n✅ Rate limiting is working correctly!")
                    print(f"   Max 5 attempts per 15 minutes enforced")
                    return True
                else:
                    print(f" ❌ ERROR {response.status_code}")
                    print(f"   {response.text}")
            except Exception as e:
                print(f" ❌ Exception: {str(e)}")
        
        print("\n⚠️  Expected rate limit error on attempt 6, but didn't get it")
        return False

async def main():
    print("\n🚀 SPRINT 1 VALIDATION TESTS")
    print(f"⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    # Test email
    email_ok = await test_email_service()
    
    # Test rate limiting
    rate_limit_ok = await test_rate_limiting()
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    print(f"✅ Email Service:   {'PASS' if email_ok else 'FAIL'}")
    print(f"✅ Rate Limiting:   {'PASS' if rate_limit_ok else 'FAIL'}")
    print(f"\n🎉 Sprint 1 Status: {'COMPLETE ✅' if (email_ok and rate_limit_ok) else 'NEEDS ATTENTION ⚠️'}")
    print("="*60 + "\n")

if __name__ == "__main__":
    asyncio.run(main())
