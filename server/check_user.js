const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findFirst({
    where: { email: 'aastharani07@gmail.com' }
  });
  console.log(JSON.stringify(user, null, 2));
}

checkUser().catch(console.error).finally(() => prisma.$disconnect());
