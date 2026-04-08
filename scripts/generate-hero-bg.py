#!/usr/bin/env python3
"""
Generates a professional 3D printing workshop background image for the hero section.
Creates a modern, industrial atmosphere with 3D printers, filament spools, and products.
"""

from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import math
import random

# High resolution for hero background (wide format)
WIDTH = 1920
HEIGHT = 700

# Color palette - modern industrial
COLORS = {
    'bg_dark': '#1a1a2e',
    'bg_mid': '#16213e',
    'accent_orange': '#ff6b35',
    'accent_blue': '#4361ee',
    'accent_purple': '#7209b7',
    'light_gray': '#e5e5e5',
    'dark_gray': '#2d2d2d',
}

def create_gradient_background(width, height):
    """Create a subtle gradient background"""
    img = Image.new('RGB', (width, height), COLORS['bg_dark'])
    draw = ImageDraw.Draw(img)
    
    # Diagonal gradient
    for y in range(height):
        for x in range(width):
            # Create diagonal gradient from dark to slightly lighter
            ratio = (x + y) / (width + height)
            r = int(26 + ratio * 15)
            g = int(26 + ratio * 15)
            b = int(46 + ratio * 20)
            draw.point((x, y), fill=(r, g, b))
    
    return img

def draw_3d_printer(draw, x, y, scale=1.0):
    """Draw a stylized 3D printer"""
    w, h = int(140 * scale), int(160 * scale)
    
    # Printer body (dark gray)
    body_color = COLORS['dark_gray']
    draw.rounded_rectangle([x, y, x+w, y+h], radius=8, fill=body_color, outline='#444444', width=2)
    
    # Print bed
    bed_y = y + int(110 * scale)
    bed_height = int(30 * scale)
    draw.rounded_rectangle([x+10, bed_y, x+w-10, bed_y+bed_height], 
                          radius=3, fill='#2a2a2a', outline='#555555', width=1)
    
    # Bed surface (heated bed - orange glow)
    draw.rounded_rectangle([x+15, bed_y+5, x+w-15, bed_y+bed_height-5], 
                          radius=2, fill=COLORS['accent_orange'])
    
    # Vertical frame (Z-axis)
    frame_x = x + int(110 * scale)
    draw.rectangle([frame_x, y+10, frame_x+int(15*scale), y+int(100*scale)], 
                   fill='#333333')
    
    # Print head
    head_y = y + int(50 * scale)
    draw.rounded_rectangle([frame_x-int(10*scale), head_y, frame_x+int(25*scale), head_y+int(25*scale)], 
                          radius=4, fill='#555555')
    # Nozzle
    draw.polygon([(frame_x+int(7*scale), head_y+int(25*scale)),
                  (frame_x+int(18*scale), head_y+int(25*scale)),
                  (frame_x+int(12*scale), head_y+int(35*scale))], 
                 fill='#777777')
    
    # Filament spool on top
    spool_y = y - int(25 * scale)
    spool_w, spool_h = int(50 * scale), int(40 * scale)
    # Spool body
    draw.rounded_rectangle([x+int(45*scale), spool_y, x+int(45*scale)+spool_w, spool_y+spool_h], 
                          radius=5, fill=COLORS['accent_blue'])
    # Spool center
    draw.ellipse([x+int(65*scale), spool_y+int(10*scale), 
                  x+int(75*scale), spool_y+int(30*scale)], 
                 fill=COLORS['bg_dark'])
    
    # Filament line
    draw.line([(x+int(70*scale), spool_y+spool_h), 
               (frame_x+int(12*scale), head_y+int(12*scale))], 
              fill=COLORS['accent_blue'], width=2)

def draw_filament_spools(draw, x, y, count=3):
    """Draw a stack of filament spools"""
    spool_width, spool_height = 60, 70
    colors = [COLORS['accent_orange'], COLORS['accent_blue'], COLORS['accent_purple']]
    
    for i in range(count):
        spool_x = x + (i * (spool_width + 10))
        # Spool body
        draw.rounded_rectangle([spool_x, y, spool_x+spool_width, y+spool_height], 
                              radius=5, fill=colors[i % len(colors)])
        # Label area
        draw.rounded_rectangle([spool_x+5, y+15, spool_x+spool_width-5, y+spool_height-15], 
                              radius=3, fill='#ffffff')
        # Center hole
        draw.ellipse([spool_x+20, y+25, spool_x+40, y+45], fill=COLORS['bg_dark'])

def draw_3d_printed_object(draw, x, y, type='vase'):
    """Draw stylized 3D printed objects"""
    if type == 'vase':
        # Vase shape
        points = [
            (x+30, y+100),  # base
            (x+50, y+90),   # control
            (x+60, y+50),   # middle
            (x+50, y+20),   # neck
            (x+40, y+10),   # top
            (x+30, y+20),   # top inner
            (x+20, y+50),   # middle inner
            (x+10, y+90),   # control inner
        ]
        draw.polygon(points, fill=COLORS['accent_purple'], outline='#ffffff', width=2)
        
    elif type == 'geometric':
        # Geometric cube/sphere combo
        # Cube
        draw.rounded_rectangle([x, y+40, x+60, y+100], radius=5, 
                               fill=COLORS['accent_orange'], outline='#ffffff', width=2)
        # Floating sphere on top
        draw.ellipse([x+10, y, x+50, y+40], fill=COLORS['accent_blue'], outline='#ffffff', width=2)
        
    elif type == 'lattice':
        # Lattice structure
        for i in range(4):
            for j in range(4):
                cell_x = x + i * 18
                cell_y = y + j * 25
                draw.rounded_rectangle([cell_x, cell_y, cell_x+12, cell_y+20], 
                                      radius=2, fill=COLORS['accent_blue'])

def draw_led_lights(draw, width, height):
    """Add subtle LED lighting effects"""
    # LED strips effect
    for i in range(5):
        x = random.randint(100, width-100)
        y = random.randint(50, height-50)
        # Glow effect
        for radius in range(20, 0, -2):
            alpha = int(30 - radius)
            draw.ellipse([x-radius, y-radius, x+radius, y+radius], 
                        fill=(67, 97, 238, alpha))

def draw_grid_pattern(draw, width, height):
    """Add subtle technical grid lines"""
    grid_color = '#2a2a3e'
    
    # Vertical lines (fewer, subtle)
    for x in range(0, width, 120):
        draw.line([(x, 0), (x, height)], fill=grid_color, width=1)
    
    # Horizontal lines (perspective effect)
    for y in range(0, height, 80):
        draw.line([(0, y), (width, y)], fill=grid_color, width=1)

def main():
    # Create base image
    img = create_gradient_background(WIDTH, HEIGHT)
    draw = ImageDraw.Draw(img)
    
    # Add grid pattern
    draw_grid_pattern(draw, WIDTH, HEIGHT)
    
    # Draw scene elements
    
    # Background - multiple printers (smaller, blurred effect simulation via opacity)
    draw_3d_printer(draw, 150, 300, scale=0.8)
    draw_3d_printer(draw, 400, 350, scale=0.7)
    draw_3d_printer(draw, 1400, 320, scale=0.75)
    
    # Filament spools on shelves
    draw_filament_spools(draw, 50, 150, count=4)
    draw_filament_spools(draw, 1600, 180, count=3)
    draw_filament_spools(draw, 1550, 450, count=3)
    
    # 3D printed products
    draw_3d_printed_object(draw, 350, 180, 'vase')
    draw_3d_printed_object(draw, 520, 200, 'geometric')
    draw_3d_printed_object(draw, 1250, 220, 'lattice')
    draw_3d_printed_object(draw, 1450, 160, 'vase')
    draw_3d_printed_object(draw, 1150, 400, 'geometric')
    
    # Add a workbench/table surface at bottom
    table_y = HEIGHT - 100
    draw.rectangle([0, table_y, WIDTH, HEIGHT], fill='#1e1e2f')
    # Table edge highlight
    draw.line([(0, table_y), (WIDTH, table_y)], fill='#3a3a4e', width=3)
    
    # Add more printers on the table
    draw_3d_printer(draw, 600, table_y - 140, scale=0.9)
    draw_3d_printer(draw, 850, table_y - 120, scale=0.85)
    
    # Tools and accessories on table
    # Caliper
    draw.rectangle([300, table_y + 30, 420, table_y + 50], fill='#c0c0c0')
    # Ruler
    draw.rectangle([1300, table_y + 20, 1500, table_y + 35], fill='#ffd700')
    
    # Add LED lighting effects
    draw_led_lights(draw, WIDTH, HEIGHT)
    
    # Add subtle vignette effect (darken edges)
    vignette = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    vignette_draw = ImageDraw.Draw(vignette)
    for i in range(100):
        alpha = int(i * 0.3)
        vignette_draw.rectangle([i, i, WIDTH-i, HEIGHT-i], 
                               outline=(0, 0, 0, alpha))
    
    img = Image.alpha_composite(img.convert('RGBA'), vignette).convert('RGB')
    
    # Apply slight blur for depth
    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
    
    # Enhance contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.1)
    
    # Save image
    output_path = '/Users/rejanerodrigues/MASTER/3d-print-tfm/public/images/hero/hero-bg.jpg'
    img.save(output_path, 'JPEG', quality=95)
    print(f"✅ Hero background generated: {output_path}")
    print(f"   Dimensions: {WIDTH}x{HEIGHT}")

if __name__ == '__main__':
    main()
