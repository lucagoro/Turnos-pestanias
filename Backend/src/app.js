// src/app.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Esto carga el .env al inicio
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from './config/db.js';
import { verifyToken } from './middlewares/auth.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Para que React pueda consultar desde otro puerto
app.use(express.json()); // Para que Express entienda cuando le mandamos JSON

// --- RUTA DE LOGIN ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscamos al admin por email
    const admin = await prisma.admin.findUnique({ where: { email } });
    
    if (!admin) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 2. Comparamos la contraseña con la encriptada
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Generamos el Token
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // El token vence en un día
    );

    res.json({ message: 'Login exitoso', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// RUTA PUBLICA: Obtener todos los servicios
app.get('/api/services', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { active: true } // Solo los que la dueña no haya desactivado
    });
    res.json(services);
  } catch (error) {
    console.error('Error en DB:', error);
    res.status(500).json({ error: 'No se pudieron obtener los servicios' });
  }
});

// RUTA PROTEGIDA: Obtener todos los turnos (solo para admins logueados)
app.get('/api/admin/appointments', verifyToken, async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: { service: true }
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener turnos' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
});