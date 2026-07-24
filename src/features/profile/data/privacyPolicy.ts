export type PrivacyPolicySection = {
  heading: string;
  body: string;
};

export const PRIVACY_POLICY_UPDATED_AT = '24 de julio de 2026';

export const PRIVACY_POLICY_CONTACT_EMAIL = 'soporte.cerquita@outlook.com';

/**
 * Solo prácticas reales de la app hoy — nada de Cloudinary/fotos (no existe
 * para el customer) ni de analytics/tracking (no hay, por eso ATT no
 * aplica). Cambios acá deben reflejar cambios reales en qué datos toca la
 * app, no al revés.
 */
export const PRIVACY_POLICY_SECTIONS: PrivacyPolicySection[] = [
  {
    heading: 'Qué datos usamos y para qué',
    body: 'Tu cuenta la maneja Clerk, nuestro proveedor de autenticación: ahí vive tu nombre, tu email y tu contraseña — nosotros nunca la guardamos. Para avisarte cuando tu pedido cambia de estado, registramos un token de notificaciones push de tu dispositivo. Cuando creás o editás una dirección de entrega, usamos tu ubicación solo en ese momento (nunca en segundo plano) para ubicarte en el mapa y calcular el envío. Y guardamos tu historial de pedidos, que es lo que te permite volver a pedir y calificar un negocio.',
  },
  {
    heading: 'Con quién compartimos tus datos',
    body: 'El negocio al que le hacés un pedido ve tu dirección de entrega y el detalle de ese pedido — es lo que necesita para prepararlo y mandarlo. Usamos Clerk (autenticación) y Firebase (notificaciones push) como proveedores de infraestructura. No vendemos tus datos ni los usamos para publicidad de terceros.',
  },
  {
    heading: 'Qué pasa si eliminás tu cuenta',
    body: 'Eliminar tu cuenta borra tu acceso y tus direcciones guardadas. Tu historial de pedidos se conserva, pero desvinculado de tu identidad de acceso — lo necesitamos por razones contables y legales del negocio. Podés volver a registrarte con el mismo email cuando quieras.',
  },
  {
    heading: 'Tus derechos',
    body: 'Podés eliminar tu cuenta en cualquier momento desde Perfil. Los permisos de ubicación y notificaciones los administrás desde los ajustes de tu sistema operativo, y podés revocarlos cuando quieras sin que se rompa el resto de la app.',
  },
  {
    heading: 'Contacto',
    body: `¿Preguntas sobre tus datos o esta política? Escribinos a ${PRIVACY_POLICY_CONTACT_EMAIL}.`,
  },
];
