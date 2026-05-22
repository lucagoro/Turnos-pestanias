// bot.js
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './sessions'
    }),
    puppeteer: {
        handleSIGINT: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // Ayuda a que consuma la mitad de RAM en el servidor
            '--disable-gpu'
        ],
    }
});

let shuttingDown = false;

const shutdownWhatsappClient = async (reason) => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`Cerrando WhatsApp client (${reason})...`);
  try {
    await client.destroy();
    console.log('WhatsApp client cerrado correctamente.');
  } catch (error) {
    console.error('Error cerrando WhatsApp client:', error);
  } finally {
    process.exit(0);
  }
};

const registerShutdownHandlers = () => {
  process.on('SIGINT', () => shutdownWhatsappClient('SIGINT'));
  process.on('SIGTERM', () => shutdownWhatsappClient('SIGTERM'));
  process.on('beforeExit', () => shutdownWhatsappClient('beforeExit'));
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception en proceso:', error);
    shutdownWhatsappClient('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection en proceso:', reason);
    shutdownWhatsappClient('unhandledRejection');
  });
};

client.on('qr', (qr) => {
    console.log('ESCANEA ESTE QR CON TU WHATSAPP:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot de WhatsApp conectado y listo!');
});

client.on('disconnected', (reason) => {
  console.warn('WhatsApp client desconectado:', reason);
  if (!shuttingDown) {
    console.log('Reiniciando WhatsApp client después de desconexión...');
    client.initialize();
  }
});

registerShutdownHandlers();

// Exportamos la función usando sintaxis ESM
const normalizeWhatsappNumber = (number) => {
    if (!number) throw new Error('Número de WhatsApp vacío');
    const raw = number.toString().trim();
    if (raw.includes('@c.us')) return raw;
    const digits = raw.replace(/\D/g, '');
    if (!digits) throw new Error('Número de WhatsApp inválido');
    return `${digits}@c.us`;
};

export const sendWhatsappMessage = async (number, message) => {
    try {
        const chatId = normalizeWhatsappNumber(number);
        await client.sendMessage(chatId, message);
        console.log(`📩 Mensaje enviado a ${number}`);
    } catch (error) {
        console.error('❌ Error enviando mensaje:', error);
    }
};

client.initialize();