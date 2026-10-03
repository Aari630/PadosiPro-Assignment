import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const catalogue = [
  {
    category: 'Home & Maintenance',
    slug: 'home-maintenance',
    tasks: [
      { name: 'Appliance Servicing', description: 'Schedule AC, refrigerator, or washing machine deep maintenance.' },
      { name: 'Plumbing Repairs', description: 'Fix leaking taps, pipelines, or pressure valve adjustments.' },
      { name: 'Deep Home Cleaning', description: 'Comprehensive sanitization and cleaning for all rooms.' },
      { name: 'Electrician On-Demand', description: 'Wiring inspections, socket installs, and fuse maintenance.' },
      { name: 'Carpentry Adjustments', description: 'Door hinge fixes, furniture assembling, and wood polishing.' },
    ],
  },
  {
    category: 'Errands & Logistics',
    slug: 'errands-logistics',
    tasks: [
      { name: 'Document Pickup & Courier', description: 'Secure parcel pickup and dispatch via express courier.' },
      { name: 'Grocery & Market Runs', description: 'Personal shopping from local specialty and organic markets.' },
      { name: 'Pharmacy Purchases', description: 'Prescription drop-off and medicine delivery.' },
      { name: 'Dry Cleaning Concierge', description: 'Pickup, professional dry clean handling, and timely drop-off.' },
      { name: 'Vehicle Servicing Drop', description: 'Drive your car or two-wheeler to authorized service centers.' },
    ],
  },
  {
    category: 'Personal & Lifestyle',
    slug: 'personal-lifestyle',
    tasks: [
      { name: 'Pet Care & Walking', description: 'Daily dog walking and vet visit accompaniment.' },
      { name: 'Plant & Garden Upkeep', description: 'Pruning, organic fertilizing, and scheduled watering.' },
      { name: 'Event & Party Support', description: 'Arranging catering staff, setup, and cleanup logistics.' },
      { name: 'Elderly Assistance', description: 'Friendly accompaniment for regular walks, banking, or doctor visits.' },
      { name: 'Fitness Trainer Scheduling', description: 'Curating certified yoga and fitness trainers for home sessions.' },
    ],
  },
  {
    category: 'Admin & Household Management',
    slug: 'admin-household',
    tasks: [
      { name: 'Utility Bill Automation', description: 'Auditing and consolidating electricity, water, and broadband dues.' },
      { name: 'Domestic Staff Sourcing', description: 'Background checks and sourcing for maids, cooks, and drivers.' },
      { name: 'Key & Access Management', description: 'Secure coordination of keys for guest or technician entry.' },
      { name: 'Inventory Replenishment', description: 'Restocking household pantry staples on a set bi-weekly schedule.' },
      { name: 'Society & Municipal Liaison', description: 'Follow-ups with RWA society offices or municipal paperwork.' },
    ],
  },
];

async function main() {
  console.log('Seeding task catalogue...');

  for (const group of catalogue) {
    const category = await prisma.category.upsert({
      where: { slug: group.slug },
      update: { name: group.category },
      create: { name: group.category, slug: group.slug },
    });

    for (const task of group.tasks) {
      const existingTask = await prisma.task.findFirst({
        where: { name: task.name, categoryId: category.id },
      });

      if (!existingTask) {
        await prisma.task.create({
          data: {
            name: task.name,
            description: task.description,
            categoryId: category.id,
          },
        });
      }
    }
  }

  console.log('Task catalogue seeded successfully: 20 tasks across 4 categories.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });