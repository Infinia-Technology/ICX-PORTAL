const prisma = require('../config/prisma');

async function main() {
  try {
    console.log('🔍 Finding users without organizations...');

    const usersWithoutOrg = await prisma.user.findMany({
      where: { organization_id: null }
    });

    console.log(`Found ${usersWithoutOrg.length} users without organizations\n`);

    for (const user of usersWithoutOrg) {
      try {
        // Determine org type based on role
        let orgType = 'SUPPLIER';
        if (user.role === 'broker') orgType = 'BROKER';
        if (user.role === 'customer') orgType = 'CUSTOMER';

        // Create organization
        const org = await prisma.organization.create({
          data: {
            type: orgType,
            status: 'SUBMITTED',
            contact_email: user.email,
            company_name: `${user.email}'s Organization`,
          }
        });

        // Link user to organization
        await prisma.user.update({
          where: { id: user.id },
          data: { organization_id: org.id }
        });

        console.log(`✅ Fixed ${user.email} (${user.role}) - Organization ID: ${org.id}`);
      } catch (err) {
        console.error(`❌ Error fixing ${user.email}:`, err.message);
      }
    }

    console.log('\n✨ Migration complete!');
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
