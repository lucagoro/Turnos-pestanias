import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Borramos servicios viejos para no duplicar
  await prisma.service.deleteMany();

  await prisma.service.createMany({
    data: [
      {
        name: "Extensiones Clásicas",
        description: "Efecto natural, una extensión por cada pestaña real.",
        price: 2500,
        durationMinutes: 90
      },
      {
        name: "Volumen Ruso",
        description: "Máximo volumen y espesor para una mirada impactante.",
        price: 4500,
        durationMinutes: 120
      },
      {
        name: "Lifting + Tinte",
        description: "Curvatura natural de tus pestañas con coloración.",
        price: 3000,
        durationMinutes: 60
      }
    ]
  });

  console.log("✅ Servicios cargados correctamente");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });