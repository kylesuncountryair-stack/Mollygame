import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

function startOfTodayUTC() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function startOfThisWeekUTC() {
  const d = startOfTodayUTC();
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminName = process.env.ADMIN_NAME || "Game Admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const { hash, salt } = hashPassword(adminPassword);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        passwordHash: hash,
        passwordSalt: salt,
        role: "ADMIN",
      },
    });
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  const questionCount = await prisma.question.count();
  if (questionCount === 0) {
    await prisma.question.create({
      data: {
        type: "DAILY",
        prompt: "What does a 'Log' represent in Bonfire?",
        options: ["A point earned for a correct answer", "A type of firewood", "A player's rank", "A penalty"],
        correctIndex: 0,
        logsReward: 2,
        activeDate: startOfTodayUTC(),
      },
    });
    await prisma.question.create({
      data: {
        type: "WEEKLY",
        prompt: "How often does the Bonfire leaderboard reset?",
        options: ["Every day", "Every month", "Every year", "Never"],
        correctIndex: 1,
        logsReward: 5,
        activeDate: startOfThisWeekUTC(),
      },
    });
    console.log("Created sample daily and weekly questions.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
