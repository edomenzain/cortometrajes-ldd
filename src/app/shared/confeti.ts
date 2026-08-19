const COLORES = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotacion: number;
  velocidadRotacion: number;
  ancho: number;
  alto: number;
  color: string;
}

function crearParticula(canvas: HTMLCanvasElement): Particula {
  return {
    x: Math.random() * canvas.width,
    y: -20,
    vx: (Math.random() - 0.5) * 3,
    vy: 1 + Math.random() * 2,
    rotacion: Math.random() * 360,
    velocidadRotacion: (Math.random() - 0.5) * 10,
    ancho: 6 + Math.random() * 6,
    alto: 8 + Math.random() * 8,
    color: COLORES[Math.floor(Math.random() * COLORES.length)],
  };
}

/**
 * Lanza confeti sobre `canvas`: emite piezas nuevas durante `emisionMs` y luego deja
 * caer las que quedan hasta que salen de la pantalla (sin corte abrupto). Devuelve una
 * función para detenerla antes de tiempo.
 */
export function lanzarConfeti(canvas: HTMLCanvasElement, emisionMs = 6000): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {};
  }

  const ajustarTamano = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  ajustarTamano();
  window.addEventListener('resize', ajustarTamano);

  let particulas: Particula[] = Array.from({ length: 140 }, () => crearParticula(canvas));

  const t0 = performance.now();
  let idAnimacion = 0;
  let activo = true;

  const dibujar = (t: number) => {
    if (!activo) return;
    const emitiendo = t - t0 < emisionMs;
    if (emitiendo && Math.random() < 0.6) {
      particulas.push(crearParticula(canvas));
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particulas) {
      p.vy += 0.02;
      p.x += p.vx;
      p.y += p.vy;
      p.rotacion += p.velocidadRotacion;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotacion * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.ancho / 2, -p.alto / 2, p.ancho, p.alto);
      ctx.restore();
    }
    particulas = particulas.filter((p) => p.y < canvas.height + 20);

    if (emitiendo || particulas.length > 0) {
      idAnimacion = requestAnimationFrame(dibujar);
    } else {
      activo = false;
    }
  };
  idAnimacion = requestAnimationFrame(dibujar);

  return () => {
    activo = false;
    cancelAnimationFrame(idAnimacion);
    window.removeEventListener('resize', ajustarTamano);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}
