import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

// Cargamos la URL del .env
const connectionString = process.env.DATABASE_URL;

// IMPORTANTE: Agregamos esto para ver si la URL llega
if (!connectionString) {
  console.error("CRÍTICO: No hay DATABASE_URL en db.js");
}

// Creamos el "pool" de conexiones de Postgres
const pool = new pg.Pool({ 
  connectionString,
  ssl: true // Obligatorio para Neon
});
const adapter = new PrismaPg(pool);

// Exportamos la instancia de Prisma lista para usar
export const prisma = new PrismaClient({ adapter });