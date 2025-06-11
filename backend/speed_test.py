import requests
import time
from PIL import Image, ImageDraw, ImageFont

def create_test_image():
    """Create a simple test business card"""
    image = Image.new('RGB', (400, 250), color='white')
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    
    # Add business card content
    draw.text((20, 20), "Sarah Johnson", fill='black', font=font)
    draw.text((20, 50), "Marketing Director", fill='black', font=font)
    draw.text((20, 80), "InnovateTech Solutions", fill='black', font=font)
    draw.text((20, 110), "sarah.johnson@innovatetech.com", fill='black', font=font)
    draw.text((20, 140), "+1-555-987-6543", fill='black', font=font)
    draw.text((20, 170), "www.innovatetech.com", fill='black', font=font)
    draw.text((20, 200), "456 Innovation Ave, Tech City, CA 90210", fill='black', font=font)
    
    image.save('speed_test_card.png')
    return 'speed_test_card.png'

def test_speed():
    """Test the speed of the optimized OCR"""
    print("🚀 Speed Test - Optimized Gemini AI OCR")
    print("=" * 50)
    
    # Create test image
    image_path = create_test_image()
    print(f"✅ Test image created: {image_path}")
    
    url = "http://localhost:8000/api/business-cards/scan_card/"
    
    # Run multiple tests
    times = []
    successes = 0
    
    for i in range(3):
        print(f"\n🧪 Test {i+1}/3:")
        
        start_time = time.time()
        
        try:
            with open(image_path, 'rb') as f:
                files = {'image': f}
                response = requests.post(url, files=files)
            
            end_time = time.time()
            total_time = end_time - start_time
            times.append(total_time)
            
            if response.status_code == 201:
                result = response.json()
                processing_time = result.get('processing_time', 'N/A')
                
                print(f"   ✅ Success!")
                print(f"   ⏱️  Total Time: {total_time:.2f}s")
                print(f"   🤖 AI Processing: {processing_time}")
                print(f"   📊 Status: {response.status_code}")
                
                # Show extracted data
                bc = result.get('business_card', {})
                print(f"   📋 Extracted: {bc.get('name', 'N/A')} | {bc.get('company', 'N/A')}")
                
                successes += 1
            else:
                print(f"   ❌ Failed: {response.status_code}")
                print(f"   📄 Error: {response.text[:100]}...")
                
        except Exception as e:
            end_time = time.time()
            total_time = end_time - start_time
            times.append(total_time)
            print(f"   ❌ Exception: {e}")
    
    # Calculate statistics
    if times:
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        
        print(f"\n📊 Performance Summary:")
        print(f"   🎯 Success Rate: {successes}/3 ({(successes/3)*100:.1f}%)")
        print(f"   ⚡ Average Time: {avg_time:.2f}s")
        print(f"   🏃 Fastest Time: {min_time:.2f}s")
        print(f"   🐌 Slowest Time: {max_time:.2f}s")
        
        if avg_time < 5:
            print(f"   🎉 EXCELLENT! Under 5 seconds!")
        elif avg_time < 10:
            print(f"   ✅ GOOD! Under 10 seconds!")
        elif avg_time < 30:
            print(f"   ⚠️  ACCEPTABLE! Under 30 seconds!")
        else:
            print(f"   ❌ SLOW! Over 30 seconds - needs optimization!")
    
    # Cleanup
    import os
    if os.path.exists(image_path):
        os.remove(image_path)
        print(f"\n🧹 Cleaned up: {image_path}")

if __name__ == "__main__":
    test_speed() 