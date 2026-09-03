/**
 * Build de deploy — SOLO transforma el index.html raiz (demo Zona Sport).
 * NO toca accionia/, lovelylei/ ni api/.
 *
 * En git el index.html queda legible. Vercel corre esto en su contenedor
 * efimero antes de publicar, asi que el archivo servido queda:
 *   - sin comentarios HTML
 *   - con el/los <script> inline minificados + mangle de variables locales
 *
 * toplevel:false a proposito: los dos <script> comparten globals
 * (sidebarNav, allData, money, ...). Manglear top-level los rompe.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { minify } from 'terser';

const FILE = new URL('./index.html', import.meta.url);
let html = readFileSync(FILE, 'utf8');

// 1) sacar comentarios HTML (deja intactos los condicionales <!--[if ...]>)
html = html.replace(/<!--(?!\[if )[\s\S]*?-->/g, '');

// 2) minificar cada bloque <script> inline (sin src)
const scriptRe = /<script>([\s\S]*?)<\/script>/g;
const jobs = [];
html.replace(scriptRe, (m, code, idx) => {
  jobs.push({ m, code, idx });
  return m;
});

let out = html;
for (const { m, code } of jobs) {
  const res = await minify(code, {
    compress: { toplevel: false, drop_console: false },
    mangle: { toplevel: false },
    format: { comments: false },
  });
  if (res.code == null) throw new Error('terser devolvio vacio');
  out = out.replace(m, `<script>${res.code}</script>`);
}

// 3) colapsar solo lineas en blanco multiples (seguro: no toca whitespace inline)
out = out.replace(/\n[ \t]*\n+/g, '\n');

writeFileSync(FILE, out, 'utf8');
console.log(`build ok — index.html ${html.length} -> ${out.length} bytes`);
