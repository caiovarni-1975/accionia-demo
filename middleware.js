import { next } from '@vercel/edge';

/**
 * Gate de auth REAL para la demo raiz (Zona Sport).
 * Solo corre en "/" y "/index.html" — el matcher NO incluye /accionia,
 * /lovelylei ni /api, asi que esas rutas quedan intactas.
 *
 * Sin cookie valida, el HTML real nunca sale en la respuesta: se sirve
 * una pagina de login server-side. Con la contraseña correcta se setea
 * la cookie y se redirige a "/".
 */
export const config = {
  matcher: ['/', '/index.html'],
};

const PASS = 'demo';
const TOKEN = 'zs-a91f7c3e42d8b6'; // valor fijo, no adivinable
const MAXAGE = 60 * 60 * 24 * 7; // 7 dias

function loginPage(error) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AccionIA — Demo</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0f;color:#e8e8f0;font-family:Inter,system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.box{width:100%;max-width:340px;text-align:center}
.logo{font-size:20px;font-weight:800;letter-spacing:-.02em;margin-bottom:6px}
.logo span{color:#6366f1}
.sub{font-size:12px;color:#6b6b80;margin-bottom:28px;text-transform:uppercase;letter-spacing:.12em}
input{width:100%;background:#13131a;border:1px solid #2a2a38;border-radius:9px;padding:12px 14px;color:#e8e8f0;font-size:15px;font-family:inherit;text-align:center;outline:none}
input:focus{border-color:#6366f1}
button{width:100%;margin-top:12px;background:#6366f1;color:#fff;border:none;border-radius:9px;padding:12px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer}
button:hover{background:#4f46e5}
.err{color:#fca5a5;font-size:12px;margin-top:12px;min-height:16px}
</style></head><body>
<form class="box" method="POST" action="/">
  <div class="logo">Accion<span>IA</span></div>
  <div class="sub">Demo privada</div>
  <input type="password" name="p" placeholder="Contraseña" autofocus autocomplete="off">
  <button type="submit">Entrar</button>
  <div class="err">${error ? 'Contraseña incorrecta.' : ''}</div>
</form>
</body></html>`;
}

export default async function middleware(request) {
  const cookie = request.headers.get('cookie') || '';
  const authed = cookie.split(/;\s*/).includes(`zs_auth=${TOKEN}`);

  if (request.method === 'POST') {
    let p = '';
    try {
      const form = await request.formData();
      p = (form.get('p') || '').toString();
    } catch {
      /* ignore */
    }
    if (p === PASS) {
      const h = new Headers({ Location: '/' });
      h.append('Set-Cookie', `zs_auth=${TOKEN}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAXAGE}`);
      h.append('Set-Cookie', `zs_ok=1; Path=/; Secure; SameSite=Lax; Max-Age=${MAXAGE}`);
      h.append('Set-Cookie', `zs_fresh=1; Path=/; Secure; SameSite=Lax; Max-Age=20`);
      return new Response(null, { status: 302, headers: h });
    }
    return new Response(loginPage(true), {
      status: 401,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  if (authed) return next();

  return new Response(loginPage(false), {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}
