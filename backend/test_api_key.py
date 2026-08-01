# TEST API KEY CONFIGURATION
# Run this to verify your Google API key is loaded correctly

import os
from app.config import settings

print("=" * 80)
print("GOOGLE API KEY CONFIGURATION TEST")
print("=" * 80)

# Check if .env file exists
env_file = ".env"
if os.path.exists(env_file):
    print(f"✅ .env file exists at: {os.path.abspath(env_file)}")
    print("\n📄 .env file contents:")
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                # Hide the actual key value for security
                if '=' in line:
                    key, value = line.split('=', 1)
                    if 'KEY' in key or 'SECRET' in key:
                        print(f"   {key}={'*' * 20}...{value[-4:] if len(value) > 4 else '****'}")
                    else:
                        print(f"   {line}")
else:
    print(f"❌ .env file NOT FOUND at: {os.path.abspath(env_file)}")

print("\n" + "=" * 80)
print("LOADED CONFIGURATION VALUES")
print("=" * 80)

# Check settings
print(f"\n1. GOOGLE_API_KEY:")
if settings.GOOGLE_API_KEY:
    key = settings.GOOGLE_API_KEY
    print(f"   ✅ Loaded: {key[:20]}...{key[-4:]}")
    print(f"   Length: {len(key)} characters")
    print(f"   Starts with 'AIza': {key.startswith('AIza')}")
else:
    print("   ❌ NOT LOADED (None)")

print(f"\n2. GEMINI_API_KEY:")
if settings.GEMINI_API_KEY:
    key = settings.GEMINI_API_KEY
    print(f"   ✅ Loaded: {key[:20]}...{key[-4:]}")
    print(f"   Length: {len(key)} characters")
    print(f"   Starts with 'AIza': {key.startswith('AIza')}")
else:
    print("   ❌ NOT LOADED (None)")

print(f"\n3. Are they the same?")
if settings.GOOGLE_API_KEY and settings.GEMINI_API_KEY:
    if settings.GOOGLE_API_KEY == settings.GEMINI_API_KEY:
        print("   ✅ Yes, both keys are identical")
    else:
        print("   ⚠️ No, keys are different!")
else:
    print("   ❌ Cannot compare - one or both keys missing")

print("\n" + "=" * 80)
print("TESTING API KEY WITH GOOGLE")
print("=" * 80)

try:
    import google.generativeai as genai
    
    if settings.GOOGLE_API_KEY:
        print("\n🧪 Testing Google API key...")
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        
        # Try to list models
        models = genai.list_models()
        print("✅ API KEY IS VALID!")
        print(f"   Can access {len(list(models))} models")
    else:
        print("❌ Cannot test - no API key loaded")
        
except Exception as e:
    print(f"❌ API KEY TEST FAILED!")
    print(f"   Error: {str(e)}")
    print(f"   Type: {type(e).__name__}")

print("\n" + "=" * 80)
print("RECOMMENDATIONS")
print("=" * 80)

if not settings.GOOGLE_API_KEY:
    print("""
❌ GOOGLE_API_KEY is not loaded!

FIX:
1. Create/edit .env file in backend folder
2. Add this line:
   GOOGLE_API_KEY=your-key-here
3. Restart the backend server
""")
elif settings.GOOGLE_API_KEY and not settings.GOOGLE_API_KEY.startswith('AIza'):
    print("""
⚠️ API key doesn't start with 'AIza'

FIX:
1. Check you copied the FULL key from Google AI Studio
2. Key should look like: AIzaSyC...
3. Make sure no extra spaces or quotes
""")
else:
    print("""
✅ Configuration looks good!

If still getting errors:
1. The key might be restricted to specific APIs
2. Try generating a NEW key at:
   https://makersuite.google.com/app/apikey
3. Make sure to enable "Generative Language API"
""")

print("=" * 80)
