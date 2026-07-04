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

export const sendWhatsappMessage = async (number, message, maxRetries = 2) => {
    const chatId = normalizeWhatsappNumber(number);
    let attempts = 0;
    let sentSuccessfully = false;

    // Usamos un bucle clásico. Si falla, pasa al siguiente intento de forma lineal
    while (attempts <= maxRetries && !sentSuccessfully) {
        try {
            attempts++;
            
            // Validar semáforo
            if (!isClientReady) {
                console.log(`⏳ [Intento ${attempts}] WhatsApp no está listo. Esperando 15s...`);
                // Esperamos un máximo de 15 segundos en este intento
                const startTime = Date.now();
                while (!isClientReady && Date.now() - startTime < 15000) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // Si pasó el tiempo y sigue sin estar listo, forzamos error para ir al catch
            if (!isClientReady) {
                throw new Error("El cliente no se recuperó a tiempo.");
            }

            // Enviar mensaje real
            await client.sendMessage(chatId, message);
            console.log(`📩 Mensaje enviado con éxito a ${number} (Intento ${attempts})`);
            sentSuccessfully = true; // 🔥 CORTA EL BUCLE ACÁ. No manda nunca más nada.

        } catch (error) {
            const errorMsg = error.message || error.toString();
            console.error(`❌ Error en intento ${attempts} para ${number}:`, errorMsg);

            if (errorMsg.includes('detached') || errorMsg.includes('Frame')) {
                console.warn('⚠️ Detached Frame detectado. Reiniciando Puppeteer en caliente...');
                isClientReady = false;
                try { await client.destroy(); } catch(e){}
                try { await client.initialize(); } catch(e){}
                
                // Colchón de tiempo lineal para que no sature
                console.log('⏳ Esperando 20 segundos a que levante el nuevo navegador...');
                await new Promise(resolve => setTimeout(resolve, 20000));
            } else {
                // Si es otro error común, espera 5 segundos antes de probar el siguiente intento
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    if (!sentSuccessfully) {
        console.error(`💥 Se agotaron los ${maxRetries} intentos de forma lineal. Mensaje cancelado para evitar spam.`);
    }
};

client.initialize();