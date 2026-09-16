# Identikits

Acá van los dibujos de los siete sospechosos, en WebP con transparencia. Los
nombres de archivo los fija `src/lib/cast.ts` (campo `identikit` de cada actor):

| Archivo | Personaje |
| --- | --- |
| `noah.webp` | Noah Davies |
| `maid-a.webp` / `maid-b.webp` | Lady Maid, según el elenco de la función |
| `liam.webp` | Liam Jones |
| `james.webp` | James Smith |
| `mary-a.webp` / `mary-b.webp` | Mary Caissings, según el elenco de la función |
| `cinthia.webp` | Cinthia Murdoch |
| `lawrence.webp` | Lawrence Caissings |

No se editan a mano: se generan desde los PNG originales con

```bash
npm run identikits -- ~/carpeta/con/los/png
```

Mientras falte un archivo, la pantalla muestra la silueta dibujada de ese
personaje (ver `Identikit.tsx`).
