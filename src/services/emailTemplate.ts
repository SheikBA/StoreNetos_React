import { Order, Client } from './storeService';

export const generateOrderConfirmationEmailHtml = (
  order: Order,
  client: Client,
  previousBalance: number,
  newBalance: number
): string => {
  const formattedDate = new Date(order.date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemsHtml = order.items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 10px;">${item.name}</td>
      <td style="padding: 10px; text-align: center;">${item.qty}</td>
      <td style="padding: 10px; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 10px; text-align: right;">$${(item.qty * item.price).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Orden - Store Netos</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; color: #333;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee;">
          <h1 style="color: #6b3fb5; margin: 0;">Store Netos</h1>
          <p style="margin: 5px 0 0; font-size: 18px;">Confirmación de Orden de Compra</p>
        </div>

        <div style="padding: 20px 0;">
          <p>Hola <strong>${client.name}</strong>,</p>
          <p>Gracias por tu compra. Aquí está el resumen de tu orden realizada el <strong>${formattedDate}</strong>.</p>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #6b3fb5;">Detalles del Cliente</h3>
            <p style="margin: 5px 0;"><strong>Cliente:</strong> ${client.name}</p>
            <p style="margin: 5px 0;"><strong>ID de Cliente:</strong> ${client.uniqueId}</p>
            <p style="margin: 5px 0;"><strong>Departamento:</strong> ${client.department}</p>
          </div>

          <h3 style="margin-top: 30px; color: #6b3fb5; border-bottom: 2px solid #6b3fb5; padding-bottom: 5px;">Resumen de la Orden #${order.id.substring(0, 8).toUpperCase()}</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead style="background-color: #f2f2f2;">
              <tr>
                <th style="padding: 10px; text-align: left;">Producto</th>
                <th style="padding: 10px; text-align: center;">Cantidad</th>
                <th style="padding: 10px; text-align: right;">Precio Unit.</th>
                <th style="padding: 10px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: right; margin-top: 20px;">
            <p style="font-size: 18px; margin: 0;"><strong>Total de la Orden: <span style="color: #6b3fb5;">$${order.total.toFixed(2)}</span></strong></p>
          </div>

          ${
            order.paymentType === 'credito'
              ? `
          <div style="margin-top: 30px; padding: 15px; background-color: #fef9e7; border-left: 4px solid #f1c40f; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #b7950b;">Resumen de Crédito</h3>
            <p style="margin: 5px 0;"><strong>Saldo Anterior:</strong> $${previousBalance.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Monto de esta compra:</strong> +$${order.total.toFixed(2)}</p>
            <p style="margin: 5px 0; font-size: 16px;"><strong>Nuevo Saldo:</strong> <strong style="color: #c0392b;">$${newBalance.toFixed(2)}</strong></p>
          </div>
          `
              : `
          <div style="margin-top: 30px; padding: 15px; background-color: #eafaf1; border-left: 4px solid #27ae60; border-radius: 5px;">
            <p style="margin: 0; font-size: 16px;"><strong>Pago realizado en efectivo.</strong></p>
          </div>
          `
          }
        </div>

        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
          <p>Este es un correo generado automáticamente. Por favor, no respondas a este mensaje.</p>
          <p>&copy; ${new Date().getFullYear()} Store Netos. Todos los derechos reservados.</p>
        </div>

      </div>
    </body>
    </html>
  `;
};