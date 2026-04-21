import { prisma } from './config/db.js';
import bcrypt from 'bcrypt';
import 'dotenv/config';

async function createAdmin() {
  const email = "admin@estudio.com"; 
  const password = "password123";    

  console.log("--- Iniciando creación de Admin ---");
  
  // Verificamos si la URL de la base de datos existe
  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: No se encontró DATABASE_URL en el entorno.");
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log("Intentando conectar a Neon...");
    
    const admin = await prisma.admin.create({
      data: {
        email: email,
        password: hashedPassword
      }
    });

    console.log("✅ Admin creado con éxito:", admin.email);
  } catch (error) {
    console.error("❌ ERROR DETALLADO:");
    if (error.code) console.error("Código de error Prisma:", error.code);
    console.error(error); // Esto va a imprimir todo el objeto de error
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();