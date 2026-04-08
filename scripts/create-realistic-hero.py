#!/usr/bin/env python3
"""
Creates a realistic hero background using existing product images.
Combines multiple product images into a professional collage.
"""

from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageOps
import os
import random

def load_product_images():
    """Load available product images"""
    product_dir = '/Users/rejanerodrigues/MASTER/3d-print-tfm/public/images/products'
    images = []
    
    # Get all jpg images (main images)
    for root, dirs, files in os.walk(product_dir):
        for file in files:
            if file.endswith('-1.jpg'):
                path = os.path.join(root, file)
                try:
                    img = Image.open(path)
                    if img.width >= 400 and img.height >= 400:
                        images.append(img.copy())
                except:
                    pass
    
    return images

def create_realistic_hero():
    # Canvas size (wide format)
    WIDTH = 1920
    HEIGHT = 700
    
    # Create dark base
    base = Image.new('RGB', (WIDTH, HEIGHT), '#1a1a2e')
    draw = ImageDraw.Draw(base)
    
    # Load product images
    products = load_product_images()
    print(f"Loaded {len(products)} product images")
    
    if len(products) < 3:
        print("Not enough product images, creating abstract design")
        # Fallback to abstract design
        draw.rectangle([0, 0, WIDTH, HEIGHT], fill='#0f0f1a')
        # Add some geometric shapes
        for i in range(20):
            x = random.randint(0, WIDTH)
            y = random.randint(0, HEIGHT)
            size = random.randint(50, 200)
            opacity = random.randint(20, 60)
            color = (random.randint(40, 80), random.randint(40, 80), random.randint(80, 120))
            draw.ellipse([x, y, x+size, y+size], fill=color)
        base.save('/Users/rejanerodrigues/MASTER/3d-print-tfm/public/images/hero/hero-bg.jpg', 'JPEG', quality=95)
        return
    
    # Shuffle and select images
    random.shuffle(products)
    
    # Create a collage layout
    positions = [
        # (x, y, width, height, blur_amount)
        (0, -100, 600, 600, 2),      # Left large
        (400, 50, 500, 500, 1),      # Center-left
        (800, -50, 550, 550, 2),     # Center
        (1200, 0, 500, 500, 1),      # Center-right
        (1550, -100, 500, 500, 3),   # Right
    ]
    
    # Place images with blending
    for i, (img, (x, y, w, h, blur)) in enumerate(zip(products[:5], positions)):
        # Resize image
        img_resized = img.resize((w, h), Image.Resampling.LANCZOS)
        
        # Apply blur for depth effect (background images blurrier)
        if blur > 0:
            img_resized = img_resized.filter(ImageFilter.GaussianBlur(radius=blur))
        
        # Darken images
        enhancer = ImageEnhance.Brightness(img_resized)
        img_resized = enhancer.enhance(0.4)
        
        # Convert to RGB if necessary
        if img_resized.mode != 'RGB':
            img_resized = img_resized.convert('RGB')
        
        # Create mask for smooth edges
        mask = Image.new('L', (w, h), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle([0, 0, w, h], radius=20, fill=180)
        
        # Paste with transparency
        try:
            base.paste(img_resized, (x, y), mask)
        except:
            base.paste(img_resized, (x, y))
    
    # Add gradient overlay for text readability
    overlay = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    
    # Left side darker for text
    for x in range(WIDTH//2 + 200):
        alpha = int(180 - (x / (WIDTH//2 + 200)) * 120)
        overlay_draw.line([(x, 0), (x, HEIGHT)], fill=(26, 26, 46, alpha))
    
    # Blend overlay
    base = Image.alpha_composite(base.convert('RGBA'), overlay).convert('RGB')
    
    # Add subtle noise texture
    noise = Image.effect_noise((WIDTH, HEIGHT), 10).convert('RGB')
    noise = ImageEnhance.Brightness(noise).enhance(0.05)
    base = Image.blend(base, noise, 0.03)
    
    # Final touches
    enhancer = ImageEnhance.Contrast(base)
    base = enhancer.enhance(1.1)
    
    # Save
    output_path = '/Users/rejanerodrigues/MASTER/3d-print-tfm/public/images/hero/hero-bg.jpg'
    base.save(output_path, 'JPEG', quality=95)
    print(f"✅ Realistic hero background created: {output_path}")
    print(f"   Dimensions: {WIDTH}x{HEIGHT}")
    print(f"   Used {min(len(products), 5)} product images")

if __name__ == '__main__':
    create_realistic_hero()
