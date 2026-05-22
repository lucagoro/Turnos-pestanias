import { prisma } from './config/db.js';
import bcrypt from 'bcrypt';
import 'dotenv/config';

async function createAdmin() {
  // Jalamos el email y la contraseña desde las variables de entorno (.env)
  // Si no existen en el .env, usamos los tuyos de siempre como "respaldo" por las dudas
  const email = process.env.ADMIN_INITIAL_EMAIL;
  const password = process.env.ADMIN_INITIAL_PASSWORD;

  console.log("--- Iniciando creación/actualización de Admin ---");
  
  // Verificamos si la URL de la base de datos existe
  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: No se encontró DATABASE_URL en el entorno.");
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log("Intentando conectar a Neon...");
    
    // Cambiado a upsert para que si el admin ya existe, solo actualice la contraseña
    // y evite el error de "llave duplicada" si volvés a correr el script en la nube.
    const admin = await prisma.admin.upsert({
      where: { email: email },
      update: {
        password: hashedPassword
      },
      create: {
        email: email,
        password: hashedPassword
      }
    });

    console.log("✅ Admin configurado con éxito:", admin.email);
  } catch (error) {
    console.error("❌ ERROR DETALLADO:");
    if (error.code) console.error("Código de error Prisma:", error.code);
    console.error(error); 
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();