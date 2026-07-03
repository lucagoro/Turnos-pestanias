// src/app.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Esto carga el .env al inicio
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from './config/db.js';
import { verifyToken } from './middlewares/auth.js';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { sendWhatsappMessage } from '../bot.js';
import QRCode from 'qrcode';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Para que React pueda consultar desde otro puerto
app.use(express.json()); // Para que Express entienda cuando le mandamos JSON

const mercadopagoClient = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN_MP
});

const STATUS = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED'
};

const PAYMENT_METHOD = {
  MP: 'MP',
  TRANSFERENCIA: 'TRANSFERENCIA',
  EFECTIVO: 'EFECTIVO'
};

const parseLocalDate = (date) => {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const parseLocalDateTime = (date, time) => {
  if (!date || !time) return null;
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) return null;
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

const formatLocalTime = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' });
};

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

// RUTA PUBLICA: Obtener todos los combos activos
app.get('/api/combos', async (req, res) => {
  try {
    const combos = await prisma.combo.findMany({
      where: { active: true },
      include: {
        services: true // Incluir los servicios que componen el combo
      }
    });
    res.json(combos);
  } catch (error) {
    console.error('Error en DB:', error);
    res.status(500).json({ error: 'No se pudieron obtener los combos' });
  }
});

// RUTA PUBLICA: Obtener combo por ID
app.get('/api/combos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const combo = await prisma.combo.findUnique({
      where: { id: Number(id) },
      include: { services: true }
    });
    if (!combo) return res.status(404).json({ error: 'Combo no encontrado' });
    res.json(combo);
  } catch (error) {
    console.error('Error en DB:', error);
    res.status(500).json({ error: 'No se pudo obtener el combo' });
  }
});

// Crear nuevo servicio
app.post('/api/admin/services', verifyToken, async (req, res) => {
  const { name, description, price, durationMinutes } = req.body;
  try {
    const newService = await prisma.service.create({
      data: { name, description, price: parseFloat(price), durationMinutes: Number(durationMinutes) }
    });
    res.json(newService);
  } catch (error) {
    res.status(500).json({ error: "Error al crear servicio" });
  }
});

// Editar servicio (Cambiar precio, nombre o desactivarlo)
app.patch('/api/admin/services/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, price, durationMinutes, active } = req.body;
  try {
    const updated = await prisma.service.update({
      where: { id: Number(id) },
      data: { 
        name, 
        price: price ? parseFloat(price) : undefined, 
        durationMinutes, 
        active 
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar servicio" });
  }
});

// ACTUALIZAR PRECIO DE UN COMBO
app.patch('/api/admin/combos/:id', async (req, res) => {
  const { id } = req.params;
  const { price } = req.body;

  if (price === undefined || price <= 0) {
    return res.status(400).json({ error: 'El precio debe ser un número positivo válido' });
  }

  try {
    const updatedCombo = await prisma.combo.update({
      where: { id: Number(id) },
      data: { price: parseFloat(price) }
    });
    
    res.json(updatedCombo);
  } catch (error) {
    console.error("Error al actualizar el precio del combo:", error);
    res.status(500).json({ error: 'Error interno al actualizar el combo' });
  }
});

// RUTA PUBLICA: Crear un turno (reserva)
// Espera: startTime en formato ISO (YYYY-MM-DDTHH:mm:ssZ) en UTC
app.post('/api/appointments', async (req, res) => {
  const { clientName, clientWhatsApp, serviceId, comboId, startTime, paymentMethod } = req.body;
  // paymentMethod puede ser: "MP", "TRANSFERENCIA" o "EFECTIVO"

  if (!clientName || !clientWhatsApp || !startTime || !paymentMethod) {
    return res.status(400).json({ error: "Faltan datos requeridos para crear el turno" });
  }

  if (!serviceId && !comboId) {
    return res.status(400).json({ error: "Debe seleccionar un servicio o un combo" });
  }

  if (serviceId && comboId) {
    return res.status(400).json({ error: "No puede seleccionar servicio y combo al mismo tiempo" });
  }

  if (!Object.values(PAYMENT_METHOD).includes(paymentMethod)) {
    return res.status(400).json({ error: "Método de pago inválido" });
  }

  try {
    let item, totalAmount, durationMinutes;

    if (serviceId) {
      // Buscamos el servicio
      item = await prisma.service.findUnique({
        where: { id: Number(serviceId) }
      });
      if (!item) {
        return res.status(404).json({ error: "El servicio seleccionado no existe." });
      }
      totalAmount = Number(item.price);
      durationMinutes = item.durationMinutes;
    } else {
      // Buscamos el combo
      item = await prisma.combo.findUnique({
        where: { id: Number(comboId) },
        include: { services: true }
      });
      if (!item) {
        return res.status(404).json({ error: "El combo seleccionado no existe." });
      }
      totalAmount = Number(item.price);
      durationMinutes = item.services.reduce((sum, service) => sum + service.durationMinutes, 0);
    }

    // Parsear la fecha en UTC (espera formato ISO: 2026-05-20T14:30:00Z)
    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ error: "Fecha de inicio inválida. Usa formato ISO UTC: YYYY-MM-DDTHH:mm:ssZ" });
    }

    //  Calculamos cuándo debería terminar y la seña
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const depositRequired = Number((totalAmount * 0.3).toFixed(2));

    // Usar horario local para validar día y franjas horarias
    const day = start.getDay(); // 0=Dom, 1=Lun...
    const timeString = formatLocalTime(start);
    const endTimeString = formatLocalTime(end);

    const businessHour = await prisma.businessHours.findFirst({
      where: { dayOfWeek: day, enabled: true }
    });

    if (!businessHour) {
      return res.status(400).json({ error: "El salón está cerrado este día" });
    }

    if (timeString < businessHour.openTime || endTimeString > businessHour.closeTime) {
      return res.status(400).json({ 
        error: `Fuera de horario. Atendemos de ${businessHour.openTime} a ${businessHour.closeTime}` 
      });
    }

    const conflict = await prisma.appointment.findFirst({
      where: {
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } },
          { status: { not: STATUS.CANCELLED } }
        ]
      }
    });

    if (conflict) {
      return res.status(400).json({ error: "Este horario ya está reservado" });
    }

    const initialStatus = (paymentMethod === PAYMENT_METHOD.MP)
      ? STATUS.PENDING_PAYMENT
      : STATUS.PENDING_REVIEW;

    const newAppointment = await prisma.appointment.create({
      data: {
        clientName,
        clientWhatsApp,
        startTime: start,
        endTime: end,
        ...(serviceId ? { service: { connect: { id: Number(serviceId) } } } : {}),
        ...(comboId ? { combo: { connect: { id: Number(comboId) } } } : {}),
        depositAmount: depositRequired,
        status: initialStatus,
        paymentMethod
      },
      include: { service: true, combo: { include: { services: true } } }
    });

    // CASO A: MERCADO PAGO (Conexión Directa y Segura vía Fetch)
if (paymentMethod === PAYMENT_METHOD.MP) {
  console.log("¡¡¡ENTRANDO A LA RUTA ACTUALIZADA DE MERCADO PAGO CON FETCH!!!");
  
  // 🌐 Definimos las URLs base usando las variables de entorno
  // Si no existen (estamos en local), usan por defecto las tuyos de prueba
  const frontendUrl = process.env.FRONTEND_URL || "http://127.0.0.1:5173";
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000"; // Cambialo por tu puerto si usás otro

  const preferenceData = {
    items: [{
      id: newAppointment.id.toString(),
      title: `Seña: ${item.name} - Visage`,
      quantity: 1,
      unit_price: Number(newAppointment.depositAmount),
      currency_id: 'ARS'
    }],
    external_reference: newAppointment.id.toString(),
    
    // 🔀 Redirección dinámica según el entorno (Local o Vercel)
    back_urls: {
      success: `${frontendUrl}/success`,
      failure: `${frontendUrl}/failure`
    },
    
    // 🚨 REQUISITO EN PRODUCCIÓN: Avisa a MP a dónde enviar la confirmación del pago
    // En local no funciona porque MP no puede ver tu computadora, pero en Railway es vital.
    notification_url: `${backendUrl}/api/webhook/mercadopago`,
    
    // ✨ Activamos el auto_return para producción; mejora la experiencia de la clienta
    auto_return: "approved", 
    
    payment_methods: {
      excluded_payment_types: [
        { id: "ticket" }, 
        { id: "atm" }     
      ],
      installments: 1 
    }
  };

  try {
    const preference = new Preference(mercadopagoClient);
    const result = await preference.create({ body: preferenceData });

    await prisma.appointment.update({
      where: { id: newAppointment.id },
      data: { mpPreferenceId: result.id }
    });

    return res.json({ appointment: newAppointment, init_point: result.init_point });
  } catch (error) {
    console.error("❌ ERROR DE MERCADO PAGO:", error.message);
    throw new Error("Mercado Pago rechazó la creación de la preferencia");
  }
}

    // CASO B: EFECTIVO / TRANSFERENCIA
    // Aquí el bot envía un mensaje avisando que el turno está "A confirmar"
    const dateFormatted = new Date(start).toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });

    let msgAdmin;
    if (paymentMethod === PAYMENT_METHOD.TRANSFERENCIA) {
      msgAdmin = `¡Hola ${clientName}! 
Mi nombre es Yas💖

Tu solicitud de turno para *${item.name}* (${dateFormatted}hs) fue recibida ✨
Como elegiste *Transferencia*, el turno queda pendiente hasta que envíes el comprobante de pago por este chat al alias: "${process.env.BANK_ALIAS}" y confirmemos la seña.

Me encuentro en Falucho 370, dpto 1📍`;
    } else if (paymentMethod === PAYMENT_METHOD.EFECTIVO) {
      msgAdmin = `¡Hola ${clientName}! Recibimos tu pedido de turno para *${item.name}* (${dateFormatted}hs).\n\nComo elegiste *Efectivo*, el turno queda pendiente hasta que confirmemos el pago de la seña en el local.`;
    } else {
      msgAdmin = `¡Hola ${clientName}! Recibimos tu pedido de turno para *${item.name}* (${dateFormatted}hs).\n\nEl turno queda pendiente hasta que confirmemos el pago de la seña.`;
    }
    
    await sendWhatsappMessage(clientWhatsApp, msgAdmin);

    res.json({ appointment: newAppointment });

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
          'Authorization': `Bearer ${process.env.ACCESS_TOKEN_MP}`
        }
      });

        if (response.ok) {
        const data = await response.json();

        if (data.status === 'approved') {
          const appointmentId = Number(data.external_reference);
          if (!Number.isNaN(appointmentId)) {
            const updated = await prisma.appointment.update({
              where: { id: appointmentId },
              data: { status: STATUS.CONFIRMED },
              include: { service: true, combo: { include: { services: true } } }
            });

            // ENVIAR MENSAJE DE ÉXITO POR BOT
            const dateStr = new Date(updated.startTime).toLocaleString('es-AR', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            });

            const successMsg = `¡Hola ${updated.clientName}!\n\nMi nombre es Yas💖\n\n✅ ¡Tu turno para *${updated.service?.name || updated.combo?.name}* (${dateStr}hs) fue confirmado!✨\n\nMe encuentro en Falucho 370, dpto 1📍`;
            
            await sendWhatsappMessage(updated.clientWhatsApp, successMsg);
            
            console.log(`✅ Turno #${appointmentId} confirmado y WhatsApp enviado`);
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("Error en Webhook:", error);
    res.sendStatus(500);
  }
});

// RUTA PUBLICA: Obtener horarios disponibles para un día y servicio o combo específico
// Espera: date en formato YYYY-MM-DD (ej: 2026-05-20)
app.get('/api/availability', async (req, res) => {
  const { date, serviceId, comboId } = req.query; // Ejemplo: ?date=2026-05-20&serviceId=1

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Parámetro 'date' requerido en formato YYYY-MM-DD" });
  }

  if ((!serviceId && !comboId) || (serviceId && comboId)) {
    return res.status(400).json({ error: "Debes enviar serviceId o comboId, pero no ambos" });
  }

  try {
    let name = '';
    let duration = 0;

    if (serviceId) {
      const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } });
      if (!service) return res.status(400).json({ error: "Servicio no encontrado" });
      name = service.name;
      duration = service.durationMinutes;
    } else {
      const combo = await prisma.combo.findUnique({
        where: { id: Number(comboId) },
        include: { services: true }
      });
      if (!combo) return res.status(400).json({ error: "Combo no encontrado" });
      const totalDuration = combo.services.reduce((sum, service) => sum + service.durationMinutes, 0);
      if (totalDuration <= 0) {
        return res.status(400).json({ error: "El combo no tiene servicios válidos" });
      }
      name = combo.name;
      duration = totalDuration;
    }

    const dayStart = parseLocalDate(date);
    const dayEnd = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), 23, 59, 59, 999);

    // 2. VERIFICACIÓN DE BLOQUEOS TOTALES (Vacaciones, Feriados)
    const totalBlock = await prisma.scheduleBlock.findFirst({
      where: {
        date: { gte: dayStart, lte: dayEnd },
        allDay: true
      }
    });

    if (totalBlock) {
      return res.json({ 
        date, 
        service: name, 
        availableSlots: [], 
        message: `Día bloqueado: ${totalBlock.reason || "No disponible"}` 
      });
    }

    // 3. Buscamos qué día de la semana es y el horario de atención
    const dayOfWeek = dayStart.getDay();
    const businessHours = await prisma.businessHours.findMany({
      where: { dayOfWeek, enabled: true }
    });

    // 4. Traemos turnos existentes Y bloqueos parciales
    const existingApps = await prisma.appointment.findMany({
      where: {
        startTime: { gte: dayStart },
        endTime: { lte: dayEnd },
        status: { not: STATUS.CANCELLED }
      }
    });

    const partialBlocks = await prisma.scheduleBlock.findMany({
      where: {
        date: { gte: dayStart, lte: dayEnd },
        allDay: false
      }
    });

    const availableSlots = [];

    // 5. Generamos slots cada 30 minutos
    businessHours.forEach(bh => {
      let current = parseLocalDateTime(date, bh.openTime);
      const endLimit = parseLocalDateTime(date, bh.closeTime);

      while (current.getTime() + duration * 60000 <= endLimit.getTime()) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + duration * 60000);

        // Chequeo contra turnos ocupados
        const isOccupied = existingApps.some(app => {
          return (slotStart < app.endTime && slotEnd > app.startTime);
        });

        // Chequeo contra bloqueos parciales (ej: médico)
        const isBlocked = partialBlocks.some(block => {
          return (slotStart < block.endTime && slotEnd > block.startTime);
        });

        if (!isOccupied && !isBlocked) {
          availableSlots.push(formatLocalTime(slotStart));
        }

        // Avanzamos 30 minutos
        current.setMinutes(current.getMinutes() + 30);
      }
    });

    res.json({ date, service: name, availableSlots });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al calcular disponibilidad" });
  }
});

// RUTA PROTEGIDA: Obtener todos los turnos (solo para admins logueados)
app.get('/api/admin/appointments', verifyToken, async (req, res) => {
  const { date } = req.query; // Opcional: para filtrar por un día específico

  try {
    let whereClause = {};

    if (date) {
      const dayStart = parseLocalDate(date);
      const dayEnd = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), 23, 59, 59, 999);
      whereClause = {
        startTime: { gte: dayStart, lte: dayEnd }
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        service: true,
        combo: { include: { services: true } }
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
  const { status } = req.body; // Esperamos STATUS.CONFIRMED o STATUS.CANCELLED

  if (![STATUS.CONFIRMED, STATUS.CANCELLED].includes(status)) {
    return res.status(400).json({ error: "Estado de turno inválido" });
  }

  try {
    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data: { status }
    });

    res.json({ message: "Turno actualizado", updated });
  } catch (error) {
    res.status(500).json({ error: "No se pudo actualizar el turno" });
  }
});

// POST: Crear un bloqueo (Día libre, médico, vacaciones)
// Espera: date en formato YYYY-MM-DD, startTime/endTime en ISO UTC (opcional)
app.post('/api/admin/blocks', verifyToken, async (req, res) => {
  const { date, allDay, startTime, endTime, reason } = req.body;
  
  // Validar que date tenga formato YYYY-MM-DD
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Parámetro 'date' requerido en formato YYYY-MM-DD" });
  }

  try {
    // Si es bloqueo de todo el día, usar inicio y fin del día en horario local
    let blockDate = parseLocalDate(date);
    let blockStartTime = null;
    let blockEndTime = null;
    
    if (!allDay) {
      // Validar que haya horarios definidos para bloqueos parciales
      if (!startTime || !endTime) {
        return res.status(400).json({ error: "startTime y endTime requeridos para bloqueos parciales" });
      }
      blockStartTime = new Date(startTime);
      blockEndTime = new Date(endTime);
      
      if (Number.isNaN(blockStartTime.getTime()) || Number.isNaN(blockEndTime.getTime())) {
        return res.status(400).json({ error: "startTime/endTime inválidos. Usa formato ISO UTC" });
      }
      if (blockStartTime >= blockEndTime) {
        return res.status(400).json({ error: "startTime debe ser anterior a endTime" });
      }
    }

    const newBlock = await prisma.scheduleBlock.create({
      data: {
        date: blockDate,
        allDay: allDay || false,
        startTime: blockStartTime,
        endTime: blockEndTime,
        reason
      }
    });
    res.json(newBlock);
  } catch (error) {
    console.error("Error al crear bloqueo:", error);
    res.status(500).json({ error: "Error al crear el bloqueo de agenda" });
  }
});


// GET: Ver todos los bloqueos (para que la dueña vea su lista de días libres)
app.get('/api/admin/blocks', verifyToken, async (req, res) => {
  try {
    const blocks = await prisma.scheduleBlock.findMany({
      orderBy: { date: 'asc' }
    });
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener bloqueos" });
  }
});

// DELETE: Quitar un bloqueo (ej: al final no se toma el día libre)
app.delete('/api/admin/blocks/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.scheduleBlock.delete({ where: { id: Number(id) } });
    res.json({ message: "Bloqueo eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el bloqueo" });
  }
});

// Actualizar horario de atención (Ej: Deshabilitar un Lunes)
app.patch('/api/admin/business-hours/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { enabled, openTime, closeTime } = req.body;
  try {
    const updated = await prisma.businessHours.update({
      where: { id: Number(id) },
      data: { enabled, openTime, closeTime }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar horario" });
  }
});

app.get('/ver-qr', async (req, res) => {
    const pathTxt = './qr-code.txt';
    
    if (!fs.existsSync(pathTxt)) {
        return res.send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1>El bot ya está conectado, o todavía está cargando.</h1>
                <p>Esperá 5 segundos y dale a refrescar (F5).</p>
            </div>
        `);
    }
    
    try {
        // Leemos el texto del QR
        const qrTexto = fs.readFileSync(pathTxt, 'utf-8');
        
        // La librería genera la imagen directamente y la manda al navegador
        res.type('png');
        await QRCode.toFileStream(res, qrTexto, {
            width: 400, // Tamaño perfecto para el celu
            margin: 2   // Margen limpio
        });
    } catch (err) {
        console.error('Error al generar la imagen del QR:', err);
        res.status(500).send('Error al generar el QR');
    }
});


app.listen(PORT, () => {
  console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
});