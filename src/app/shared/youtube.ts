export function idDeYoutube(url: string | undefined): string | null {
  if (!url) return null;
  const patrones = [/youtu\.be\/([\w-]{11})/, /[?&]v=([\w-]{11})/, /embed\/([\w-]{11})/];
  for (const patron of patrones) {
    const coincidencia = url.match(patron);
    if (coincidencia) return coincidencia[1];
  }
  return null;
}
