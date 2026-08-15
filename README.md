# El veredicto · votación en sala

App de votación para una obra de teatro con cuatro finales. El público escanea
un QR desde la butaca, elige uno de los cuatro sospechosos, y el panel de
backstage controla cuándo se abre y se cierra la votación.

Dos pantallas:

- **`/`** — lo que ve el público. Es la raíz del sitio, así que el QR codifica
  el dominio pelado y el mismo papel sirve para todas las funciones.
- **`/admin`** — backstage: abrir y cerrar la votación, ver los votos en vivo,
  resolver empates, finalizar la función, imprimir los QR.

---

## Probarlo ahora, sin configurar nada

```bash
npm install
npm run demo
```

Abrí <http://localhost:3000> y <http://localhost:3000/admin> (contraseña:
`demo`). Todo corre en memoria: no necesita Supabase ni internet, y se reinicia
cuando reiniciás el server.

Sirve para comparar las tres variantes de la pantalla de votación antes de
decidir cuál se usa en la sala:

| Variante | URL | Cómo se vota |
| --- | --- | --- |
| Grilla 2×2 | `/?ui=grid` | Los cuatro juntos en pantalla. Tocás uno, después confirmás abajo. |
| Swipe horizontal | `/?ui=swipe` | Un sospechoso por pantalla completa. El botón sigue a quien estás mirando. |
| Scroll vertical | `/?ui=stack` | Gesto de feed. El botón vive en cada panel y pide dos toques. |

Recomendación para arrancar: **swipe**. Es la más teatral (cada personaje ocupa
el celular entero, con su color y su párrafo de acusación) y la más difícil de
votar por accidente en una sala a oscuras. La grilla es la más rápida para
alguien que ya decidió, pero deja las figuras chicas.

La variante por defecto se fija con `NEXT_PUBLIC_DEFAULT_VOTE_UI`.

---

## Puesta en producción (Vercel + Supabase, gratis)

### 1. Supabase

1. Crear un proyecto en <https://supabase.com> (plan free).
2. **SQL Editor → New query**: pegar todo `supabase/schema.sql` y ejecutar.
   Es idempotente: se puede volver a correr cuando quieras.
3. Editar los cuatro personajes reales. Están al final de `schema.sql`, en el
   `insert into public.options`. Se pueden cambiar en cualquier momento desde
   **Table Editor → options**; los `id` conviene no tocarlos una vez que hubo
   funciones reales, porque los votos los referencian.
4. **Settings → API**: copiar la *Project URL*, la *anon key* y la
   *service_role key*.

### 2. Vercel

Importar el repo y cargar las variables de entorno de `.env.example`:

| Variable | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key — **nunca** con prefijo `NEXT_PUBLIC_` |
| `ADMIN_PASSWORD` | la contraseña del panel |
| `AUTH_SECRET` | `openssl rand -hex 32` |
| `NEXT_PUBLIC_DEFAULT_VOTE_UI` | `swipe`, `grid` o `stack` |

Las variables `NEXT_PUBLIC_*` se hornean en el build: si cambiás alguna, hay que
redeployar para que tome efecto. Las otras se leen en cada request.

### 3. Los QR

`/admin/qr` genera el código y una hoja lista para imprimir y recortar
(corrección de errores alta, que aguanta el papel doblado en una butaca).

El QR apunta al dominio con el que estés navegando el panel, así que **generalo
desde el dominio definitivo**. Si vas a usar un dominio propio, agregalo en
Vercel *antes* de imprimir: `VERCEL_PROJECT_PRODUCTION_URL` siempre devuelve el
`.vercel.app`, y el papel de la butaca quedaría con la URL fea. Para forzar un
dominio concreto está `NEXT_PUBLIC_SITE_URL`, o el parámetro `?url=` de la
página.

---

## El día de la función

1. **`/admin` → Crear función.** Queda en «sin abrir»: el público que escanee
   antes de tiempo ve una pantalla de espera que se despierta sola.
2. **Elegir qué ve el público** (se puede cambiar en cualquier momento):
   - **En vivo** — las barras se mueven desde el primer voto. Máxima sensación
     de evento colectivo, pero puede arrastrar a los indecisos.
   - **Al votar** — cada uno ve los conteos recién después de elegir. Es el
     default y el mejor punto medio para 40 butacas.
   - **Ocultos** — nadie ve nada hasta que cerrás. La única de las tres que es
     hermética de verdad (ver «Privacidad de los conteos» abajo).
3. **Abrir votación** cuando lo pide la escena. Los celulares que ya tenían la
   página abierta pasan solos a la pantalla de votación.
4. **Cerrar votación.** El público ve el resultado y el final más votado.
5. **Si hay empate**, el panel avisa y el final NO se elige solo: se fija a mano
   desde «Final que se juega». La obra tiene que seguir igual, y esa decisión la
   toma una persona.
6. **Finalizar función.** Queda archivada en el historial y se libera el lugar
   para la próxima.

«Reabrir votación» está para el caso de haber cerrado antes de tiempo, y
«Borrar todos los votos» para limpiar después de un ensayo.

---

## Fotos de los actores

Las siluetas dibujadas son un placeholder. Para usar las fotos reales:

1. Recortar cada actor en PNG con fondo transparente (vertical, pensado para
   verse contra negro).
2. Subirlas a **Supabase → Storage**, en un bucket público.
3. Pegar la URL de cada una en la columna `image_url` de su fila en `options`.

`Silhouette.tsx` usa la foto automáticamente cuando `image_url` no está vacío;
no hay que tocar código.

---

## Cómo funciona

- **Next.js 16** (App Router) en Vercel, **Supabase Postgres** para los datos y
  **Supabase Realtime** para empujar los conteos.
- Los votos se cuentan en una tabla `tallies` que mantiene un trigger. Realtime
  publica esa tabla, así que cada voto nuevo llega a los 40 celulares por
  websocket, sin que ninguno tenga que reconsultar nada.
- Como red de seguridad hay polling lento (45 s con el websocket conectado, 8 s
  si se cayó) y un refresco al volver del background. El wifi de un teatro lleno
  tira conexiones, y perderse el «abrió la votación» es el único error que esta
  app no se puede permitir.

### Un voto por dispositivo

Cada celular genera un UUID que guarda en `localStorage` y espeja en una cookie;
la base tiene un `unique (show_id, device_id)`.

Esto frena el doble voto accidental — recargar, volver atrás, reabrir el QR —
que es el caso real. **No** frena a alguien decidido: borrar el storage o entrar
en incógnito da un voto nuevo. Para 40 butacas con la obra en escena es una
compensación razonable; la alternativa (login, códigos por butaca) agrega
fricción justo en el momento en que menos se la banca.

Hay un tope opcional por conexión (`VOTE_IP_LIMIT`), **apagado por defecto**:
si el teatro ofrece wifi, las 40 butacas salen por una sola IP y cualquier
límite bajo dejaría gente afuera. Solo tiene sentido si el público entra por
datos móviles. Se guarda un hash de la IP, no la IP.

### Seguridad

- La *anon key* viaja al celular del público, así que solo tiene `SELECT` sobre
  `options`, `shows` y `tallies`. Los votos se insertan desde `/api/vote` con la
  *service role key*, que nunca sale del servidor.
- La tabla `votes` tiene RLS activo y cero policies, más un `revoke` explícito:
  quién votó qué no es legible con la clave pública.
- El panel se protege con contraseña y una cookie firmada con HMAC.

### Privacidad de los conteos

En modo **ocultos**, la policy de RLS impide leer `tallies` — no hay forma de
espiar los números, ni siquiera por websocket.

En modo **al votar** la tabla sí es legible, porque el que ya votó necesita
recibir las actualizaciones en vivo. Alguien con la consola del navegador
abierta podría mirar los conteos antes de votar. Es una barrera de interfaz
contra el efecto manada, no un secreto criptográfico. Si hace falta que sea
hermético hasta el cierre, usar **ocultos**.

---

## Tests del esquema

La lógica que más importa vive en SQL: los triggers de conteo, el índice que
garantiza una sola función viva a la vez, y las policies de RLS. `supabase/
schema.test.sql` las verifica (21 aserciones) contra un Postgres local:

```bash
createdb votos_test
psql -d votos_test -f supabase/test-prelude.sql   # simula los roles de Supabase
psql -d votos_test -f supabase/schema.sql
psql -d votos_test -f supabase/schema.test.sql
```

---

## Costos

Vercel Hobby y Supabase free alcanzan de sobra: son ~40 votos por función.

**El detalle a tener en cuenta:** Supabase pausa los proyectos free después de
7 días sin actividad, y despausarlos desde el dashboard tarda unos minutos. Si
las funciones son semanales o más espaciadas, entrá al panel un rato antes de
que llegue el público, o pasá el proyecto a un plan pago los meses de temporada.
