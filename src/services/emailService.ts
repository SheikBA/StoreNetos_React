import emailjs from '@emailjs/browser';
import { generateOrderConfirmationEmailHtml } from './emailTemplate';
import type { Order, Client } from './storeService'; // Solo importamos Tipos (no genera ciclo)

// ⚠️ REEMPLAZA ESTOS VALORES CON LOS DE TU CUENTA DE EMAILJS
const SERVICE_ID = "service_318kdd8"; // ✅ ¡CORRECTO! Este parece un Service ID válido.
const TEMPLATE_ID = "template_nm8k1nr"; // ❌ ¡ERROR! Este valor debe ser diferente. Ve a "Email Templates" en EmailJS y copia el "Template ID" correcto aquí.
const PUBLIC_KEY = "8t8aqHHuL72gGBWhj"; // ✅ Tu Public Key Agregada

export const sendOrderEmail = async (
  order: Order,
  client: Client,
  previousBalance: number,
  newBalance: number,
  adminEmails: string[] // <--- Nuevo argumento: Recibimos los emails aquí
) => {
  // 1. Usamos la lista de correos que nos pasaron
  
  // Construir la lista de destinatarios.
  // Si no hay admins en la DB, el array inicia vacío, pero el proceso continúa para el cliente.
  const recipients = [...adminEmails];

  // 2. Añadir el email del cliente solo si existe.
  if (client && client.email) {
    recipients.push(client.email);
  }

  // Generamos el HTML usando tu plantilla existente
  const htmlContent = generateOrderConfirmationEmailHtml(order, client, previousBalance, newBalance);

  const templateParams = {
    // 3. Unimos los destinatarios en un solo string separado por comas.
    to_email: recipients.join(','),
    to_name: client.name, // El nombre del cliente se mantiene para personalizar el saludo "Hola, [nombre]"
    subject: `Confirmación de orden #${order.id.substring(0, 8).toUpperCase()}`,
    message_html: htmlContent, // Esta variable debe coincidir con la de tu plantilla en EmailJS ({{{message_html}}})
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log("✅ Correo enviado exitosamente con EmailJS");
  } catch (error) {
    console.error("❌ Error al enviar correo con EmailJS:", error);
    // No lanzamos el error para no interrumpir el flujo de venta si falla el correo
  }
};