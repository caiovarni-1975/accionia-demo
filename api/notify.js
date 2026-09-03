import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const BOT_UA = /bot|crawler|spider|scraper|curl|python|java(?!script)|go-http|axios|wget|libwww|okhttp|headless|phantom|selenium|puppeteer/i;

function parseUA(ua = '') {
  const isBot = BOT_UA.test(ua);

  let device = 'Desktop';
  if (/mobile/i.test(ua) && !/tablet|ipad/i.test(ua)) device = 'Mobile';
  else if (/tablet|ipad/i.test(ua)) device = 'Tablet';

  let browser = 'Otro';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua)) browser = 'Safari';

  let os = 'Otro';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac os/i.test(ua)) os = 'Mac';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return { isBot, device, browser, os };
}

function row(label, value) {
  return `
    <tr>
      <td style="padding:6px 12px 6px 0;color:#888;font-size:13px;white-space:nowrap;vertical-align:top">${label}</td>
      <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111">${value}</td>
    </tr>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { demo, referrer, url, language, screen } = req.body || {};
  const demoName = demo || 'AccionIA';

  const ua = req.headers['user-agent'] || '';
  const { isBot, device, browser, os } = parseUA(ua);

  if (isBot) return res.status(200).json({ ok: true, bot: true });

  // ─── Geo + red desde headers de Vercel ───
  const dec = (v) => { try { return v ? decodeURIComponent(v) : ''; } catch { return v || ''; } };
  const geoCity = dec(req.headers['x-vercel-ip-city']);
  const geoRegion = dec(req.headers['x-vercel-ip-country-region']);
  const geoCountry = (req.headers['x-vercel-ip-country'] || '').toUpperCase();
  const ubicacion = [geoCity, geoRegion, geoCountry].filter(Boolean).join(', ') || 'n/d';

  const ip =
    (req.headers['x-real-ip'] ||
      (req.headers['x-forwarded-for'] || '').split(',')[0] ||
      '').trim() || 'n/d';

  const idiomaHeader = (req.headers['accept-language'] || '').split(',')[0].trim();
  const idioma = idiomaHeader || language || 'n/d';

  const fecha = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const origen = referrer
    ? (() => {
        try { return new URL(referrer).hostname.replace('www.', ''); } catch { return referrer; }
      })()
    : 'Acceso directo';

  const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const pantalla = screen ? esc(screen) : '';

  try {
    await resend.emails.send({
      from: 'CaiSyng Analytics <noreply@caisyng.com.ar>',
      to: 'hola@caisyng.com.ar',
      subject: `Login en demo ${demoName} — ${fecha} · ${device}${ubicacion !== 'n/d' ? ' · ' + ubicacion : ''}`,
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto">
          <div style="background:#1A2E44;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
            <p style="margin:0;font-size:11px;letter-spacing:.1em;color:#7C9E87">CAISYNG · LOGIN EN DEMO</p>
            <p style="margin:6px 0 0;font-size:20px;font-weight:700">Alguien ingresó a la demo ${esc(demoName)}</p>
          </div>
          <div style="background:#fff;border:1px solid #e5e5e5;border-top:none;padding:20px 24px;border-radius:0 0 8px 8px">
            <table style="border-collapse:collapse;width:100%">
              ${row('Demo', esc(demoName))}
              ${row('Fecha y hora', fecha)}
              ${row('Ubicación', ubicacion)}
              ${row('Red / IP', ip)}
              ${row('Dispositivo', `${device} · ${browser} · ${os}${pantalla ? ' · ' + pantalla : ''}`)}
              ${row('Idioma', idioma)}
              ${row('Llegó desde', origen)}
              ${row('URL', esc(url || '/'))}
            </table>
          </div>
        </div>
      `,
    });
  } catch (e) {
    console.error('notify error:', e);
  }

  return res.status(200).json({ ok: true });
}
