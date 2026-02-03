import { PrismaClient, Category } from '.prisma/client-product';

const prisma = new PrismaClient();

// Using local bike images
const bicycles = [
  {
    name: 'Trek Marlin 7',
    description:
      'A versatile hardtail mountain bike perfect for trail riding and everyday adventures.',
    price: 1099.99,
    category: Category.mountain,
    brand: 'Trek',
    images: ['/images/trek-marlin-7.jpg'],
    stock: 15,
    featured: true,
    specifications: {
      frameSize: 'M',
      wheelSize: '29"',
      weight: 13.5,
      material: 'Aluminum',
      gears: 18,
      color: 'Matte Black',
    },
  },
  {
    name: 'Specialized Allez',
    description: 'Entry-level road bike with race-inspired geometry for speed and efficiency.',
    price: 1299.99,
    category: Category.road,
    brand: 'Specialized',
    images: ['/images/specialized-allez.jpg'],
    stock: 8,
    featured: true,
    specifications: {
      frameSize: 'L',
      wheelSize: '700c',
      weight: 9.2,
      material: 'Aluminum',
      gears: 16,
      color: 'Gloss Red',
    },
  },
  {
    name: 'Giant Escape 3',
    description: 'Comfortable hybrid bike for fitness riding and urban commuting.',
    price: 549.99,
    category: Category.hybrid,
    brand: 'Giant',
    images: ['/images/giant-escape-3.jpg'],
    stock: 25,
    featured: false,
    specifications: {
      frameSize: 'M',
      wheelSize: '700c',
      weight: 11.8,
      material: 'Aluminum',
      gears: 21,
      color: 'Charcoal',
    },
  },
  {
    name: 'Cannondale Moterra Neo',
    description: 'Full-suspension electric mountain bike with powerful Bosch motor.',
    price: 5499.99,
    category: Category.electric,
    brand: 'Cannondale',
    images: ['/images/cannondale-moterra.jpg'],
    stock: 5,
    featured: true,
    specifications: {
      frameSize: 'L',
      wheelSize: '29"',
      weight: 23.5,
      material: 'Carbon',
      gears: 12,
      color: 'Stealth Grey',
    },
  },
  {
    name: 'Scott Scale 20 Junior',
    description: 'Lightweight kids mountain bike designed for young riders aged 8-12.',
    price: 699.99,
    category: Category.kids,
    brand: 'Scott',
    images: ['/images/scott-scale-junior.jpg'],
    stock: 12,
    featured: false,
    specifications: {
      frameSize: '20"',
      wheelSize: '20"',
      weight: 9.8,
      material: 'Aluminum',
      gears: 9,
      color: 'Blue/Yellow',
    },
  },
  {
    name: 'Trek Domane SL 5',
    description: 'Endurance road bike with IsoSpeed technology for long-distance comfort.',
    price: 3299.99,
    category: Category.road,
    brand: 'Trek',
    images: ['/images/trek-domane.jpg'],
    stock: 6,
    featured: true,
    specifications: {
      frameSize: 'M',
      wheelSize: '700c',
      weight: 9.0,
      material: 'Carbon',
      gears: 22,
      color: 'Crystal White',
    },
  },
  {
    name: 'Specialized Rockhopper',
    description: 'Reliable hardtail mountain bike for beginners and intermediate riders.',
    price: 749.99,
    category: Category.mountain,
    brand: 'Specialized',
    images: ['/images/specialized-rockhopper.jpg'],
    stock: 20,
    featured: false,
    specifications: {
      frameSize: 'L',
      wheelSize: '29"',
      weight: 14.2,
      material: 'Aluminum',
      gears: 18,
      color: 'Gloss Black',
    },
  },
  {
    name: 'Giant Revolt 2',
    description: 'Adventure-ready gravel bike for mixed terrain exploration.',
    price: 1599.99,
    category: Category.hybrid,
    brand: 'Giant',
    images: ['/images/giant-revolt.jpg'],
    stock: 10,
    featured: false,
    specifications: {
      frameSize: 'M',
      wheelSize: '700c',
      weight: 10.5,
      material: 'Aluminum',
      gears: 20,
      color: 'Moss Green',
    },
  },
  {
    name: 'Trek Rail 9.7',
    description: 'Premium full-suspension e-MTB for aggressive trail riding.',
    price: 7499.99,
    category: Category.electric,
    brand: 'Trek',
    images: ['/images/trek-rail.jpg'],
    stock: 3,
    featured: true,
    specifications: {
      frameSize: 'L',
      wheelSize: '29"',
      weight: 22.8,
      material: 'Carbon',
      gears: 12,
      color: 'Matte Black/Green',
    },
  },
  {
    name: 'Specialized Jett 16',
    description: 'Perfect first pedal bike for kids aged 4-6.',
    price: 349.99,
    category: Category.kids,
    brand: 'Specialized',
    images: ['/images/specialized-jett.jpg'],
    stock: 18,
    featured: false,
    specifications: {
      frameSize: '16"',
      wheelSize: '16"',
      weight: 7.5,
      material: 'Aluminum',
      gears: 1,
      color: 'Neon Pink',
    },
  },
];

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.productSpecification.deleteMany();
  await prisma.product.deleteMany();

  for (const bike of bicycles) {
    const { specifications, ...productData } = bike;

    await prisma.product.create({
      data: {
        ...productData,
        specifications: {
          create: specifications,
        },
      },
    });
  }

  console.log(`Seeded ${bicycles.length} products`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
