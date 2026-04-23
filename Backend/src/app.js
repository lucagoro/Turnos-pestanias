// src/app.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Esto carga el .env al inicio
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from './config/db.js';
import { verifyToken } from './middlewares/auth.js';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Para que React pueda consultar desde otro puerto
app.use(express.json()); // Para que Express entienda cuando le mandamos JSON

const client = new MercadoPagoConfig({ 
  accessToken: 'APP_USR-8031842975015628-042306-0cc4f70f5d6a1800d5c78f5b20b48284-3355415632' // Cambiarlo por tu token real de Mercado Pago (de preferencia, guardarlo en .env)
});

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

// RUTA PUBLICA: Obtener un servicio por ID
app.get('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({
      where: {
        id: Number(id) // Convertimos de String a Number porque el ID es numérico en la base de datos
      }
    });
    if (!service) return res.status(404).json({ error: "Servicio no encontrado" });
    res.json(service);
  } catch (error) {
    console.error('Error en DB:', error);
    res.status(500).json({ error: 'No se pudo obtener el servicio' });
  }
})

// RUTA PUBLICA: Crear un turno (reserva)
app.post('/api/appointments', async (req, res) => {
  const { clientName, clientWhatsApp, serviceId, startTime, paymentMethod } = req.body;
  // paymentMethod puede ser: "MP", "TRANSFERENCIA" o "EFECTIVO"

  try {
    //  Buscamos el servicio para saber cuánto dura, precio, etc.
    const service = await prisma.service.findUnique({
       where: { id: Number(serviceId) }
       });
    
    if (!service) {
      return res.status(404).json({ error: "El servicio seleccionado no existe." });
    }

    //  Calculamos cuándo debería terminar y la seña
    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.durationMinutes * 60000);
    // Usamos parseFloat porque los Decimal de Prisma vienen como objetos/strings
    const totalAmount = parseFloat(service.price);
    const depositRequired = totalAmount * 0.3;

    const day = start.getUTCDay(); // Obtenemos el día (0=Dom, 1=Lun...)
    const timeString = start.toISOString().substring(11, 16); // "HH:mm"
    const endTimeString = end.toISOString().substring(11, 16);

    const businessHour = await prisma.businessHours.findFirst({
      where: { dayOfWeek: day, enabled: true }
    });

    if (!businessHour) {
      return res.status(400).json({ error: "El salón está cerrado este día" });
    }

    // Comparamos strings de hora (ej: "10:00" < "09:00")
    if (timeString < businessHour.openTime || endTimeString > businessHour.closeTime) {
      return res.status(400).json({ 
        error: `Fuera de horario. Atendemos de ${businessHour.openTime} a ${businessHour.closeTime}` 
      });
    }

    //  Verificamos si hay conflicto con otro turno
    const conflict = await prisma.appointment.findFirst({
      where: {
        AND: [
          { startTime: { lt: end } }, // Empieza antes de que el nuevo termine
          { endTime: { gt: start } }  // Termina después de que el nuevo empiece
        ]
      }
    });

    if (conflict) {
      return res.status(400).json({ error: "Este horario ya está reservado" });
    }

    // Determinamos el estado inicial
    // Si es MP, esperamos el pago. Si es otro, esperamos que la dueña confirme.
    const initialStatus = (paymentMethod === "MP") ? "PENDING_PAYMENT" : "PENDING_REVIEW";

    //  Si no hay conflicto, creamos el turno
    const newAppointment = await prisma.appointment.create({
      data: {
        clientName,
        clientWhatsApp,
        startTime: start, // El "start" procesado con Date
        endTime: end,     // El "end" calculado con la duración
        service: { connect: { id: Number(serviceId) } },
        depositAmount: depositRequired, // Tu cálculo del 30%
        status: initialStatus,
        paymentMethod: paymentMethod
      },
      include: { service: true } // Traemos el nombre del servicio para MP
    });

    //  Si eligió Mercado Pago, creamos la Preferencia
    if (paymentMethod === "MP") {
      const preference = new Preference(client);

      const result = await preference.create({
        body: {
          items: [
            {
              id: newAppointment.id.toString(),
              title: `Seña: ${newAppointment.service.name}`,
              quantity: 1,
              unit_price: Number(newAppointment.depositAmount),
              currency_id: 'ARS'
            }
          ],
          // URL a la que vuelve la clienta después de pagar
          back_urls: {
            success: "https://tudominio.com/pago-exitoso",
            failure: "https://tudominio.com/pago-fallido",        // Cambiar estas urls
            pending: "https://tudominio.com/pago-pendiente"
          },
          auto_return: "approved",
          // El 'external_reference' es CLAVE: acá guardamos el ID de nuestro turno
          external_reference: newAppointment.id.toString(),
          notification_url: "https://drone-payee-exporter.ngrok-free.dev/api/webhook/mercadopago" // Cambiar en un futuro Donde Mercado Pago envía las notificaciones de pago
        }
      });

      // Devolvemos el link de pago (init_point)
      return res.json({ 
        appointment: newAppointment, 
        init_point: result.init_point 
      });
    }

    // Preparamos el mensaje de WhatsApp para el Frontend
    let whatsappMessage = "";
    if (paymentMethod !== "MP") {
      whatsappMessage = `Hola! Reservé un turno para ${clientName}. Servicio: ${newAppointment.serviceId}. Horario: ${startTime}. Pago vía: ${paymentMethod}. Espero confirmación!`;
    }

    res.json({ 
      appointment: newAppointment,
      whatsappMessage: whatsappMessage // React usará esto para abrir WhatsApp
    });

  } catch (error) {
    console.error("DETALLE DEL ERROR:", error); 
    res.status(500).json({ error: "Error al crear la reserva" });
  }
});

app.post('/api/webhook/mercadopago', async (req, res) => {
  const { query } = req;
  
  // // MP envía notificaciones de muchos tipos. Solo nos importa 'payment'
  const topic = query.topic || query.type;

   try {
     if (topic === 'payment') {
       const paymentId = query.id || query['data.id'];
      
       // Consultamos a Mercado Pago por el estado de ese pago
       const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
         headers: {
           'Authorization': `Bearer APP_USR-8031842975015628-042306-0cc4f70f5d6a1800d5c78f5b20b48284-3355415632`
         }
       });

      if (response.ok) {
        const data = await response.json();

        // Si el pago fue aprobado...
        if (data.status === 'approved') {
         const appointmentId = data.external_reference; // El ID que guardamos antes

         // Actualizamos el turno a CONFIRMED
         await prisma.appointment.update({
           where: { id: Number(appointmentId) },
           data: { status: 'CONFIRMED' }
         });

         console.log(`✅ Turno #${appointmentId} confirmado por Mercado Pago`);
      }
    }
  }
  // Siempre respondemos 200 a MP para que no siga reintentando
    res.sendStatus(200);
  } catch (error) {
    console.error("Error en Webhook:", error);
    res.sendStatus(500);
  }
});

// RUTA PUBLICA: Obtener horarios disponibles para un día y servicio específico
app.get('/api/availability', async (req, res) => {
  const { date, serviceId } = req.query; // Ejemplo: ?date=2026-05-20&serviceId=1

  try {
    // 1. Buscamos el servicio para saber cuánto dura
    const service = await prisma.service.findUnique({ 
      where: { id: Number(serviceId) } 
    });
    if (!service) return res.status(400).json({ error: "Servicio no encontrado" });
    const duration = service.durationMinutes;

    // 2. Buscamos qué día de la semana es y qué horario de atención tiene
    const dayOfWeek = new Date(date).getUTCDay();
    const businessHours = await prisma.businessHours.findMany({
      where: { dayOfWeek, enabled: true }
    });

    // 3. Traemos TODOS los turnos que ya existen ese día (incluidos los pendientes)
    const dayStart = new Date(date + "T00:00:00Z");
    const dayEnd = new Date(date + "T23:59:59Z");
    const existingApps = await prisma.appointment.findMany({
      where: {
        startTime: { gte: dayStart },
        endTime: { lte: dayEnd },
        status: { not: "CANCELLED" } // Solo ignoramos los cancelados
      }
    });

    const availableSlots = [];

    // 4. Generamos slots cada 30 minutos
    businessHours.forEach(bh => {
      let current = new Date(date + "T" + bh.openTime + ":00Z");
      const endLimit = new Date(date + "T" + bh.closeTime + ":00Z");

      // Mientras el slot + la duración del servicio no se pasen del cierre...
      while (current.getTime() + duration * 60000 <= endLimit.getTime()) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + duration * 60000);

        // Verificamos si este bloque de tiempo choca con algún turno ocupado
        const isOccupied = existingApps.some(app => {
          // Lógica de choque: (InicioA < FinB) Y (FinA > InicioB)
          return (slotStart < app.endTime && slotEnd > app.startTime);
        });

        if (!isOccupied) {
          availableSlots.push(slotStart.toISOString().substring(11, 16));
        }

        // Avanzamos 30 minutos para el siguiente slot
        current.setMinutes(current.getMinutes() + 30);
      }
    });

    res.json({ date, service: service.name, availableSlots });
  } catch (error) {
    res.status(500).json({ error: "Error al calcular disponibilidad" });
  }
});

// RUTA PROTEGIDA: Obtener todos los turnos (solo para admins logueados)
app.get('/api/admin/appointments', verifyToken, async (req, res) => {
  const { date } = req.query; // Opcional: para filtrar por un día específico

  try {
    let whereClause = {};

    if (date) {
      const dayStart = new Date(date + "T00:00:00Z");
      const dayEnd = new Date(date + "T23:59:59Z");
      whereClause = {
        startTime: { gte: dayStart, lte: dayEnd }
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        service: true // Esto incluye los detalles del servicio (nombre, precio, etc.)
      },
      orderBy: {
        startTime: 'asc' // Ordenados por hora, del más temprano al más tarde
      }
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la agenda" });
  }
});

app.patch('/api/admin/appointments/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Esperamos "CONFIRMED" o "CANCELLED"

  try {
    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data: { status: status }
    });

    res.json({ message: "Turno actualizado", updated });
  } catch (error) {
    res.status(500).json({ error: "No se pudo actualizar el turno" });
  }
});



app.listen(PORT, () => {
  console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
});