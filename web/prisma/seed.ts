import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@eduapp.com" },
    update: {},
    create: {
      id: "demo-user",
      email: "demo@eduapp.com",
      name: "Demo Parent",
      state: "MI",
    },
  });

  // Create children
  const emma = await prisma.child.upsert({
    where: { id: "child-emma" },
    update: {},
    create: {
      id: "child-emma",
      userId: user.id,
      name: "Emma",
      dateOfBirth: new Date("2019-05-15"),
      gradeLevel: "2",
      standardsOptIn: true,
    },
  });

  const jack = await prisma.child.upsert({
    where: { id: "child-jack" },
    update: {},
    create: {
      id: "child-jack",
      userId: user.id,
      name: "Jack",
      dateOfBirth: new Date("2017-01-22"),
      gradeLevel: "4",
      standardsOptIn: true,
    },
  });

  console.log(`Seeded: user=${user.id}, children=[${emma.name}, ${jack.name}]`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
