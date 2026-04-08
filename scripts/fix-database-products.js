const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Product data from CSV (English names and correct slugs)
const correctProductData = [
  {
    slug: 'floral-decorative-vase',
    name: 'Floral Decorative Vase',
    description: 'Vase with floral design for home decoration. Perfect for artificial flowers or as a standalone decorative piece. Printed in high resolution for smooth finish.',
    shortDescription: 'Elegant floral vase for home decor'
  },
  {
    slug: 'hexagonal-desk-organizer',
    name: 'Hexagonal Desk Organizer',
    description: 'Modular hexagonal organizer for office supplies. Each module can be combined to create custom configurations. Includes 3 interconnected pieces.',
    shortDescription: 'Modular 3-piece desk organizer'
  },
  {
    slug: 'minimalist-geometric-planter',
    name: 'Minimalist Geometric Planter',
    description: 'Geometric design planter for small plants. Features drainage hole and modern angular aesthetic. Ideal for succulents and cacti.',
    shortDescription: 'Modern geometric planter with drainage'
  },
  {
    slug: 'adjustable-phone-stand',
    name: 'Adjustable Phone Stand',
    description: 'Smartphone stand with adjustable angle. Compatible with all phone sizes up to 7 inches. Features cable management slot.',
    shortDescription: 'Universal adjustable phone holder'
  },
  {
    slug: 'articulated-dinosaur-rex-figure',
    name: 'Articulated Dinosaur Rex Figure',
    description: 'Articulated dinosaur figure for collection. 15 movable joints for realistic poses. Printed in one piece with no assembly required.',
    shortDescription: 'Poseable T-Rex with 15 joints'
  },
  {
    slug: 'house-miniature',
    name: 'House Miniature',
    description: 'Detailed house miniature for decoration. Victorian style with removable roof. Perfect for dioramas or display shelves.',
    shortDescription: 'Victorian miniature house display'
  },
  {
    slug: 'dragon-pencil-brush-holder',
    name: 'Dragon Pencil/Brush Holder',
    description: 'Stylized dragon-shaped pencil/brush holder. Features textured scales and detailed wings. Fits standard pencils and brushes.',
    shortDescription: 'Dragon-shaped desk organizer'
  },
  {
    slug: 'articulated-classic-car',
    name: 'Articulated Classic Car',
    description: 'Articulated classic car with moving wheels. 1950s vintage design with opening doors. Detailed interior and chrome-effect details.',
    shortDescription: 'Vintage car with moving parts'
  },
  {
    slug: '3d-moon-lamp',
    name: '3D Moon Lamp',
    description: 'LED night lamp with realistic moon shape. Includes USB rechargeable base with touch dimmer. Realistic lunar surface texture.',
    shortDescription: 'LED moon lamp with touch dimmer'
  },
  {
    slug: 'medieval-secret-box',
    name: 'Medieval Secret Box',
    description: 'Secret box with medieval castle design. Hidden compartment with puzzle mechanism. Great for storing small valuables or as a gift.',
    shortDescription: 'Puzzle box with hidden compartment'
  }
];

async function fixProducts() {
  try {
    console.log('=== Fixing Database Products ===\n');
    
    // Get current products
    const products = await prisma.product.findMany({
      select: { id: true, slug: true, name: true }
    });
    
    console.log('Current products in DB:');
    products.forEach(p => {
      console.log(`  ${p.slug}: ${p.name}`);
    });
    console.log('');
    
    // Create a map of correct data by slug
    const correctDataMap = new Map(correctProductData.map(p => [p.slug, p]));
    
    // Update each product
    for (const product of products) {
      // Find matching correct data by slug (exact match first)
      let correctData = correctDataMap.get(product.slug);
      
      // If not found, try to find by matching partial slug
      if (!correctData) {
        // Handle slugs with broken accented characters
        for (const [correctSlug, data] of correctDataMap) {
          // Remove accents from both for comparison
          const normalizedProductSlug = product.slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const normalizedCorrectSlug = correctSlug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          
          if (normalizedProductSlug === normalizedCorrectSlug ||
              normalizedProductSlug.includes(normalizedCorrectSlug) ||
              normalizedCorrectSlug.includes(normalizedProductSlug)) {
            correctData = data;
            break;
          }
        }
      }
      
      if (correctData) {
        console.log(`Updating: ${product.slug}`);
        console.log(`  Name: "${product.name}" → "${correctData.name}"`);
        
        await prisma.product.update({
          where: { id: product.id },
          data: {
            name: correctData.name,
            description: correctData.description,
            shortDescription: correctData.shortDescription,
            slug: correctData.slug // Update slug to correct format
          }
        });
        console.log('  ✓ Updated\n');
      } else {
        console.log(`⚠ No matching data found for: ${product.slug}\n`);
      }
    }
    
    console.log('=== Fix Complete ===');
    
    // Verify
    const updatedProducts = await prisma.product.findMany({
      select: { id: true, slug: true, name: true },
      orderBy: { slug: 'asc' }
    });
    
    console.log('\n=== Updated Products ===');
    updatedProducts.forEach(p => {
      console.log(`${p.slug}: ${p.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixProducts();
