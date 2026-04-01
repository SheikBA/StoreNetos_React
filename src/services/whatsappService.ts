import type { Order, Client } from './storeService';

// ⚠️ REEMPLAZA ESTE VALOR CON TU NÚMERO DE WHATSAPP
// Incluye el código de país + el dígito '1' (si es celular) + tu número a 10 dígitos.
// ¡IMPORTANTE! No incluyas el símbolo '+' ni espacios.
const ADMIN_WHATSAPP_NUMBER = "5219981076822";

/**
 * Crea una URL de "Click-to-Chat" de WhatsApp con un mensaje pre-llenado.
 * @returns La URL completa o null si el número no está configurado.
 */
export const createWhatsAppNotificationUrl = (order: Order, client: Client): string | null => {
  if (!ADMIN_WHATSAPP_NUMBER) {
    console.warn("Número de WhatsApp del admin no configurado. No se generará URL.");
    return null;
  }

  // 1. Crear el mensaje
  const message = `🔔 *Nueva Venta en Store Netos* 🔔
-----------------------------------
*Cliente:* ${client.name}
*Tipo de Pago:* ${order.paymentType === 'credito' ? '💳 Crédito' : '💵 Efectivo'}
*Total:* $${order.total.toFixed(2)}`;

  // 2. Codificar el mensaje para la URL
  const encodedMessage = encodeURIComponent(message);

  // 3. Construir y devolver la URL
  // Se limpia el número de cualquier caracter no numérico por seguridad.
  const cleanNumber = ADMIN_WHATSAPP_NUMBER.replace(/\D/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
};