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
  console.log("Limpiando base de datos...");
  
  // 1. Borramos los turnos primero (Los hijos)
  await prisma.appointment.deleteMany();
  
  // 2. Ahora sí podemos borrar los servicios (Los padres)
  await prisma.service.deleteMany();
  
  // 3. Limpiamos horarios
  await prisma.businessHours.deleteMany();

  console.log("Creando servicios y horarios...");

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

  await prisma.businessHours.createMany({
    data: [
      { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00' },
      { dayOfWeek: 2, openTime: '09:00', closeTime: '18:00' },
      { dayOfWeek: 3, openTime: '09:00', closeTime: '18:00' },
      { dayOfWeek: 4, openTime: '09:00', closeTime: '18:00' },
      { dayOfWeek: 5, openTime: '09:00', closeTime: '18:00' },
      { dayOfWeek: 6, openTime: '09:00', closeTime: '13:00' },
    ]
  });

  console.log("✅ Servicios y demás datos cargados correctamente");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });