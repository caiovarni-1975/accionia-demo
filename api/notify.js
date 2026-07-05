import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { demo, referrer } = req.body || {};

  const fecha = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  try {
    await resend.emails.send({
      from: 'CaiSyng Analytics <noreply@caisyng.com.ar>',
      to: 'hola@caisyng.com.ar',
      subject: `Alguien ingresó a la demo ${demo} — ${fecha}`,
      html: `
        <h2 style="margin:0 0 16px">Login en demo AccionIA</h2>
        <p><strong>Demo:</strong> ${demo}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Llegó desde:</strong> ${referrer || '(acceso directo)'}</p>
      `,
    });
  } catch (e) {
    console.error('notify error:', e);
  }

  return res.status(200).json({ ok: true });
}
