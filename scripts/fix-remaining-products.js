const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Map of broken slugs to correct slugs
const slugMapping = {
  // Broken slug (with accents converted to hyphens) → Correct slug
  'figura-articulada-de-dinosaurio-rex': 'articulated-dinosaur-rex-figure',
  'soporte-ajustable-para-tel-fono': 'adjustable-phone-stand',
  'coche-cl-sico-articulado': 'articulated-classic-car',
  'l-mpara-lunar-3d': '3d-moon-lamp',
  'organizador-de-escritorio-hexagonal': 'hexagonal-desk-organizer'
};

// Correct English data
const correctProductData = {
  'articulated-dinosaur-rex-figure': {
    name: 'Articulated Dinosaur Rex Figure',
    description: 'Articulated dinosaur figure for collection. 15 movable joints for realistic poses. Printed in one piece with no assembly required.',
    shortDescription: 'Poseable T-Rex with 15 joints'
  },
  'adjustable-phone-stand': {
    name: 'Adjustable Phone Stand',
    description: 'Smartphone stand with adjustable angle. Compatible with all phone sizes up to 7 inches. Features cable management slot.',
    shortDescription: 'Universal adjustable phone holder'
  },
  'articulated-classic-car': {
    name: 'Articulated Classic Car',
    description: 'Articulated classic car with moving wheels. 1950s vintage design with opening doors. Detailed interior and chrome-effect details.',
    shortDescription: 'Vintage car with moving parts'
  },
  '3d-moon-lamp': {
    name: '3D Moon Lamp',
    description: 'LED night lamp with realistic moon shape. Includes USB rechargeable base with touch dimmer. Realistic lunar surface texture.',
    shortDescription: 'LED moon lamp with touch dimmer'
  },
  'hexagonal-desk-organizer': {
    name: 'Hexagonal Desk Organizer',
    description: 'Modular hexagonal organizer for office supplies. Each module can be combined to create custom configurations. Includes 3 interconnected pieces.',
    shortDescription: 'Modular 3-piece desk organizer'
  }
};

async function fixRemainingProducts() {
  try {
    console.log('=== Fixing Remaining Products ===\n');
    
    // Fix each remaining product
    for (const [brokenSlug, correctSlug] of Object.entries(slugMapping)) {
      const product = await prisma.product.findUnique({
        where: { slug: brokenSlug },
        select: { id: true, slug: true, name: true }
      });
      
      if (product && correctProductData[correctSlug]) {
        const data = correctProductData[correctSlug];
        console.log(`Fixing: ${brokenSlug} → ${correctSlug}`);
        console.log(`  Name: "${product.name}" → "${data.name}"`);
        
        await prisma.product.update({
          where: { id: product.id },
          data: {
            name: data.name,
            description: data.description,
            shortDescription: data.shortDescription,
            slug: correctSlug
          }
        });
        console.log('  ✓ Fixed\n');
      } else if (product) {
        console.log(`⚠ No data for slug: ${brokenSlug}\n`);
      }
    }
    
    console.log('=== Fix Complete ===');
    
    // Verify
    const updatedProducts = await prisma.product.findMany({
      select: { id: true, slug: true, name: true },
      orderBy: { slug: 'asc' }
    });
    
    console.log('\n=== Final Products in Database ===');
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

fixRemainingProducts();
