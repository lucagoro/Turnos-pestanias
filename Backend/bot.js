import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

import fs from 'fs';

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './sessions'
    }),
    puppeteer: {
        handleSIGINT: false,
        headless: 'new', // 🔥 Podés usar 'new' o true, 'new' es lo recomendado en versiones actuales
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
    }
});

let shuttingDown = false;
let isClientReady = false;

const shutdownWhatsappClient = async (reason) => {
    if (shuttingDown) return;
    shuttingDown = true;
    isClientReady = false;

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
    console.log('============= ¡NUEVO CÓDIGO QR GENERADO! =============');
    
    // Guardamos el código de texto puro en un archivo temporal
    fs.writeFileSync('./qr-code.txt', qr); 
    
    console.log('💾 QR guardado en el servidor. Podés escanearlo entrando a /ver-qr');
    console.log('======================================================');
});

client.on('ready', () => {
    isClientReady = true;
    console.log('✅ Bot de WhatsApp conectado y listo!');
});

client.on('disconnected', (reason) => {
    isClientReady = false;
    console.warn('WhatsApp client desconectado:', reason);
    if (!shuttingDown) {
        console.log('Reiniciando WhatsApp client después de desconexión...');
        client.initialize();
    }
});

registerShutdownHandlers();

const normalizeWhatsappNumber = (number) => {
    if (!number) throw new Error('Número de WhatsApp vacío');
    const raw = number.toString().trim();
    if (raw.includes('@c.us')) return raw;
    const digits = raw.replace(/\D/g, '');
    if (!digits) throw new Error('Número de WhatsApp inválido');
    return `${digits}@c.us`;
};

// 🔥 FUNCIÓN AUXILIAR: Esperar a que el cliente esté listo con timeout
const waitForClientReady = async (maxWaitTime = 30000) => {
    const startTime = Date.now();
    while (!isClientReady) {
        if (Date.now() - startTime > maxWaitTime) {
            throw new Error('WhatsApp client no está listo después de esperar 30 segundos');
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
};

export const sendWhatsappMessage = async (number, message, retries = 3) => {
    try {
        const chatId = normalizeWhatsappNumber(number);
        
        // ✅ CLAVE: Validar que el cliente esté listo antes de intentar enviar
        if (!isClientReady) {
            console.log(`⏳ Cliente de WhatsApp no está listo. Esperando...`);
            await waitForClientReady();
        }
        
        // 🔥 Dar un respiro al cliente por si está procesando algo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await client.sendMessage(chatId, message);
        console.log(`📩 Mensaje enviado con éxito a ${number}`);
    } catch (error) {
        const errorMsg = error.message || error.toString();
        console.error(`❌ Error enviando mensaje a ${number}:`, errorMsg);
        
        // 🚨 MANEJO ESPECÍFICO: Detached Frame indica que Puppeteer perdió la ventana
        if (errorMsg.includes('Attempted to use detached Frame') || errorMsg.includes('detached')) {
            console.warn('⚠️ DETACHED FRAME DETECTADO: Reiniciando cliente de WhatsApp...');
            isClientReady = false;
            try {
                await client.destroy();
                console.log('🧹 Cliente destruido tras detached frame. Reinicializando...');
            } catch (destroyError) {
                console.warn('⚠️ Error al destruir el cliente tras detached frame:', destroyError);
            }

            try {
                await client.initialize();
                console.log('🔄 Cliente reinicializado tras detached frame. Reintentando envío...');
                await new Promise(resolve => setTimeout(resolve, 20000));
            } catch (initError) {
                console.error('❌ Error al reinicializar el cliente tras detached frame:', initError);
                throw initError;
            }

            if (retries > 0) {
                return sendWhatsappMessage(number, message, retries - 1);
            }
        }
        
        // Si todavía nos quedan intentos, reintentamos
        if (retries > 0) {
            console.log(`🔄 Reintentando envío... (${retries} intentos restantes)`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return sendWhatsappMessage(number, message, retries - 1);
        } else {
            console.error(`💥 Se agotaron los reintentos. Mensaje a ${number} no se pudo enviar.`);
            throw error;
        }
    }
};

//client.initialize();