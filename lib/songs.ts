import fs from 'fs';
import path from 'path';

export interface Song {
  title: string;
  file: string;
}

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg'];

/**
 * Escanea public/audio/<teacherId>/<groupId>/<choreoId>/ y devuelve
 * una canción por cada archivo de audio encontrado, usando el nombre
 * del archivo (sin extensión) como título.
 *
 * Así, el profe solo tiene que arrastrar el mp3 a la carpeta correcta
 * con el nombre que quiera — no hace falta tocar código.
 *
 * Si la carpeta no existe o está vacía, devuelve [] (no rompe nada).
 */
export function getSongsForChoreo(
  teacherId: string,
  groupId: string,
  choreoId: string
): Song[] {
  // groupId viene como "cami-mega-crew"; la carpeta real es solo "mega-crew"
  // (sin el prefijo del profe, que ya es la carpeta padre). Igual soportamos
  // ambos formatos por si se sube la carpeta con el id completo.
  const groupFolder = groupId.startsWith(`${teacherId}-`)
    ? groupId.slice(teacherId.length + 1)
    : groupId;

  const candidatePaths = [
    path.join(process.cwd(), 'public', 'audio', teacherId, groupFolder, choreoId),
    path.join(process.cwd(), 'public', 'audio', teacherId, groupId, choreoId),
  ];

  for (const dirPath of candidatePaths) {
    try {
      if (!fs.existsSync(dirPath)) continue;

      const files = fs
        .readdirSync(dirPath)
        .filter((f) => AUDIO_EXTENSIONS.includes(path.extname(f).toLowerCase()))
        .sort((a, b) => a.localeCompare(b, 'es'));

      if (files.length === 0) continue;

      const relativeDir = path.relative(path.join(process.cwd(), 'public', 'audio'), dirPath);

      return files.map((file) => ({
        title: path.basename(file, path.extname(file)),
        file: path.join(relativeDir, file).split(path.sep).join('/'),
      }));
    } catch {
      continue;
    }
  }

  return [];
}
