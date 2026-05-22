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
        name: "Perfilado de cejas",
        description: "Consiste en diseñar y dar forma a tus cejas respetando su forma natural, utilizando pincita, perfilador y tijera para un acabado prolijo y delicado.",
        price: 16000,
        durationMinutes: 30
      },
      {
        name: "Laminado de cejas",
        description: "Ordena y fija el vello para lograr cejas más definidas, peinadas y con efecto de mayor volumen. Ideal para cejas rebeldes, despobladas o con pelitos difíciles de acomodar.",
        price: 20000,
        durationMinutes: 30
      },
      {
        name: "Tinte de cejas",
        description: "Logra un aspecto más poblado, uniforme y natural sin necesidad de maquillaje diario.",
        price: 16000,
        durationMinutes: 20
      },
      {
        name: "Lifting de pestañas con tinte y nutrición",
        description: "Eleva, curva, aplica un tinte oscuro para dar efecto de rímel y finaliza con una hidratación profunda que fortalece y da brillo.",
        price: 34000,
        durationMinutes: 85
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

  // Crear combos de ejemplo
  console.log("Creando combos...");
  await prisma.combo.createMany({
    data: [
      {
        name: "Combo Styling de Cejas",
        description: "Perfilado + Tinte de cejas",
        price: 27000, // Precio especial para combo
        active: true
      },
      {
        name: "Combo Visage",
        description: "Perfilado + Laminado",
        price: 34000, // Precio especial
        active: true
      },
      {
        name: "Combo Styling Completo",
        description: "Lifting de pestañas con tinte y nutrición + Perfilado de cejas",
        price: 45000, // Precio especial
        active: true
      },
      {
        name: "Combo Full Eyes",
        description: "Lifting de pestañas con tinte y nutrición + Perfilado de cejas + Laminado de cejas",
        price: 59500, // Precio especial
        active: true
      }
    ]
  });

  // Conectar servicios a combos
  const perfilado = await prisma.service.findFirst({ where: { name: "Perfilado de cejas" } });
  const laminado = await prisma.service.findFirst({ where: { name: "Laminado de cejas" } });
  const tinte = await prisma.service.findFirst({ where: { name: "Tinte de cejas" } });
  const lifting = await prisma.service.findFirst({ where: { name: "Lifting de pestañas con tinte y nutrición" } });

  const comboStylingDeCejas = await prisma.combo.findFirst({ where: { name: "Combo Styling de Cejas" } });
  const comboVisage = await prisma.combo.findFirst({ where: { name: "Combo Visage" } });
  const comboStylingCompleto = await prisma.combo.findFirst({ where: { name: "Combo Styling Completo" } });
  const comboFullEyes = await prisma.combo.findFirst({ where: { name: "Combo Full Eyes" } });

  // Conectar servicios al combo básico
  await prisma.combo.update({
    where: { id: comboStylingDeCejas.id },
    data: {
      services: {
        connect: [
          { id: perfilado.id },
          { id: tinte.id }
        ]
      }
    }
  });

  // Conectar servicios al combo premium
  await prisma.combo.update({
    where: { id: comboVisage.id },
    data: {
      services: {
        connect: [
          { id: perfilado.id },
          { id: laminado.id }
        ]
      }
    }
  });

  // Conectar servicios al combo lifting
  await prisma.combo.update({
    where: { id: comboStylingCompleto.id },
    data: {
      services: {
        connect: [
          { id: lifting.id },
          { id: perfilado.id }
        ]
      }
    }
  });

  await prisma.combo.update({
    where: { id: comboFullEyes.id },
    data: {
      services: {
        connect: [
          { id: lifting.id },
          { id: perfilado.id },
          { id: laminado.id }
        ]
      }
    }
  });

  console.log("✅ Servicios y combos cargados correctamente");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });