// graficos.mjs: genera los gráficos del perfil (stack y actividad) en SVG propio.
// Uso:  node scripts/graficos.mjs      (necesita `gh` con sesión iniciada para la actividad)
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const salida = join(raiz, "assets");
mkdirSync(salida, { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const TEMAS = {
  dark: { fondo: "#0d0b16", borde: "#3b2f63", texto: "#e7e3f7", suave: "#8b86a8", chip: "#1a1530", vacio: "#191529" },
  light: { fondo: "#faf8ff", borde: "#d9d0f5", texto: "#2a2440", suave: "#6b6588", chip: "#efe9ff", vacio: "#ebe6f7" },
};

// ---------- 1. STACK: solo lo que se usa de verdad ----------
const GRUPOS = [
  ["Aplicaciones web", "#a855f7", ["Next.js", "React", "TypeScript", "JavaScript", "Node.js", "Tailwind CSS", "HTML", "CSS"]],
  ["Datos", "#38bdf8", ["PostgreSQL", "Prisma", "Supabase"]],
  ["Tiendas", "#95bf47", ["Shopify", "Liquid"]],
  ["Servidor y entrega", "#f59e0b", ["Linux", "Nginx", "PM2", "Vercel", "Git", "GitHub Actions"]],
  ["Automatización y bots", "#ec4899", ["n8n", "Google Apps Script", "WhatsApp", "Telegram"]],
  ["Cobros y facturación", "#22c55e", ["Culqi", "Yape", "SUNAT"]],
];
function stack(t) {
  const ancho = 900, izq = 200, alto = 44, margen = 26;
  let y = 44, cuerpo = "";
  for (const [nombre, color, items] of GRUPOS) {
    cuerpo += `<text x="24" y="${y + 5}" font-size="15" font-weight="600" fill="${t.texto}">${esc(nombre)}</text>`;
    let x = izq;
    let fila = 0;
    for (const it of items) {
      const tl = Math.round(it.length * 8.4); const w = tl + 46;
      if (x + w > ancho - margen) { x = izq; fila++; }
      const cy = y + fila * alto - 14;
      cuerpo += `<rect x="${x}" y="${cy}" width="${w}" height="30" rx="15" fill="${t.chip}" stroke="${color}" stroke-opacity=".7"/>` +
        `<circle cx="${x + 15}" cy="${cy + 15}" r="4.5" fill="${color}"/>` +
        `<text x="${x + 29}" y="${cy + 20}" font-size="14" fill="${t.texto}" textLength="${tl}" lengthAdjust="spacingAndGlyphs">${esc(it)}</text>`;
      x += w + 10;
    }
    y += (fila + 1) * alto + 12;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${y + 6}" viewBox="0 0 ${ancho} ${y + 6}" font-family="'Segoe UI',Arial,sans-serif" role="img" aria-label="Tecnologías que uso, por grupos">` +
    `<rect x=".5" y=".5" width="${ancho - 1}" height="${y + 5}" rx="12" fill="${t.fondo}" stroke="${t.borde}"/>${cuerpo}</svg>`;
}

// ---------- 2. ACTIVIDAD: calendario propio con las contribuciones del último año ----------
function actividad(t, dias, total) {
  const semanas = []; for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7));
  const c = 13, sep = 3, izq = 46, arriba = 58;
  const ancho = izq + semanas.length * (c + sep) + 24, alto = arriba + 7 * (c + sep) + 46;
  const max = Math.max(...dias.map((d) => d.n), 1);
  const paleta = t === TEMAS.dark ? ["#191529", "#4c1d95", "#6d28d9", "#a855f7", "#e9d5ff"] : ["#ebe6f7", "#ddd0ff", "#b794f6", "#7c3aed", "#4c1d95"];
  const nivel = (n) => (n === 0 ? 0 : Math.min(4, 1 + Math.floor((n / max) * 3.999)));
  let g = "", meses = "", mesPrev = -1, ultimoX = -99;
  semanas.forEach((sem, i) => {
    const m = new Date(sem[0].fecha + "T00:00:00").getMonth();
    if (m !== mesPrev) { if (izq + i * (c + sep) - ultimoX < 40) { meses = meses.slice(0, meses.lastIndexOf("<text")); } ultimoX = izq + i * (c + sep); meses += `<text x="${izq + i * (c + sep)}" y="${arriba - 10}" font-size="11" fill="${t.suave}">${["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"][m]}</text>`; mesPrev = m; }
    sem.forEach((d, j) => { g += `<rect x="${izq + i * (c + sep)}" y="${arriba + j * (c + sep)}" width="${c}" height="${c}" rx="3" fill="${paleta[nivel(d.n)]}"><title>${d.fecha}: ${d.n}</title></rect>`; });
  });
  const dow = ["lun", "mié", "vie"].map((n, k) => `<text x="14" y="${arriba + (k * 2 + 1) * (c + sep) + 10}" font-size="11" fill="${t.suave}">${n}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" font-family="'Segoe UI',Arial,sans-serif" role="img" aria-label="${total} contribuciones en el último año">` +
    `<rect x=".5" y=".5" width="${ancho - 1}" height="${alto - 1}" rx="12" fill="${t.fondo}" stroke="${t.borde}"/>` +
    `<text x="24" y="30" font-size="17" font-weight="600" fill="${t.texto}">${total.toLocaleString("es-PE")} contribuciones en el último año</text>` +
    `<text x="${ancho - 24}" y="30" font-size="12" fill="${t.suave}" text-anchor="end">incluye repositorios privados</text>${meses}${dow}${g}` +
    `<text x="${ancho - 24 - 5 * 17 - 34}" y="${alto - 16}" font-size="11" fill="${t.suave}" text-anchor="end">menos</text>` +
    paleta.map((p, k) => `<rect x="${ancho - 24 - (5 - k) * 17}" y="${alto - 27}" width="13" height="13" rx="3" fill="${p}"/>`).join("") +
    `<text x="${ancho - 20}" y="${alto - 16}" font-size="11" fill="${t.suave}">más</text></svg>`;
}

function calendario() {
  const q = "{ viewer { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } } } }";
  const j = JSON.parse(execFileSync("gh", ["api", "graphql", "-f", `query=${q}`], { encoding: "utf8" }));
  const cal = j.data.viewer.contributionsCollection.contributionCalendar;
  const dias = cal.weeks.flatMap((w) => w.contributionDays.map((d) => ({ fecha: d.date, n: d.contributionCount })));
  return { dias, total: cal.totalContributions };
}

for (const [nombre, t] of Object.entries(TEMAS)) writeFileSync(join(salida, `stack-${nombre}.svg`), stack(t));
console.log("Listo: stack");
