# Agravado por el Vínculo · votación en sala

App de votación en sala para *Agravado por el Vínculo*. El público escanea un
QR desde la butaca, acusa a uno de los siete sospechosos, y el panel de
backstage controla cuándo se abre y se cierra la votación.

Los sospechosos:

| # | Personaje | Rol |
| --- | --- | --- |
| 1 | Noah Davies | Detective |
| 2 | Lady Maid | Ama de llaves |
| 3 | Liam Jones | Mano derecha de Emily |
| 4 | James Smith | 2do esposo de Emily |
| 5 | Mary Caissings | Esposa de John |
| 6 | Cinthia Murdoch | Protegida de Emily |
| 7 | Lawrence Caissings | Hijo menor de Emily |

El título vive en `src/lib/constants.ts` (`SHOW_TITLE`) y los personajes al
final de `supabase/schema.sql`. De cada uno se ve el nombre y el rol que ocupa
en la casa, nada más: la acusación se cuenta en escena, no en el celular. Quién
interpreta a cada uno (y con qué identikit) vive en `src/lib/cast.ts`; ver
«Identikits y elenco».

Tres pantallas:

- **`/votar`** — lo que ve el público. El QR de la butaca apunta acá, y el mismo
  papel sirve para todas las funciones.
- **`/admin`** — backstage: abrir y cerrar la votación, ver los votos en vivo,
  resolver empates, finalizar la función, imprimir los QR.
- **`/`** — la landing de la obra: sinopsis, sospechosos, funciones, entradas
  (link a Alternativa Teatral) y elenco. Todo lo que dice vive en
  `src/lib/landing-content.ts`; el lettering del flyer va en
  `public/landing/wordmark.png` (ver `public/landing/README.md`). No linkea a
  la votación: la única puerta a `/votar` es el QR de la butaca.

La ruta de votación vive en `VOTE_PATH` (`src/lib/constants.ts`), que es lo que
usa el generador de QR: si algún día se mueve, el papel se genera solo con la
ruta nueva.

---

## Probarlo ahora, sin configurar nada

```bash
npm install
npm run demo
```

Abrí <http://localhost:3000/votar> y <http://localhost:3000/admin> (contraseña:
`demo`). Todo corre en memoria: no necesita Supabase ni internet, y se reinicia
cuando reiniciás el server.

Sirve para comparar las tres variantes de la pantalla de votación antes de
decidir cuál se usa en la sala:

| Variante | URL | Cómo se vota |
| --- | --- | --- |
| Scroll vertical **(default)** | `/votar?ui=stack` | Gesto de feed. El botón vive en cada panel y pide dos toques. |
| Swipe horizontal | `/votar?ui=swipe` | Un sospechoso por pantalla completa. El botón sigue a quien estás mirando. |
| Grilla | `/votar?ui=grid` | Los siete juntos en pantalla. Tocás uno, después confirmás abajo. |

El default es **scroll vertical**: con siete sospechosos es la única que le
puede dar el celular entero a cada uno sin pedir un gesto que haya que explicar.
El swipe es igual de teatral pero deslizar de costado siete veces se hace largo,
y la grilla —la más rápida para alguien que ya decidió— necesita cuatro filas
para que entren todos, así que deja las figuras chicas.

La variante por defecto se fija con `NEXT_PUBLIC_DEFAULT_VOTE_UI`.

---

## Puesta en producción (Vercel + Supabase, gratis)

### 1. Supabase

1. Crear un proyecto en <https://supabase.com> (plan free).
2. **SQL Editor → New query**: pegar todo `supabase/schema.sql` y ejecutar.
   Es idempotente: se puede volver a correr cuando quieras.

   **Si el proyecto de Supabase ya existía** (venías de la versión de cuatro
   personajes), esto es todo lo que hay que hacer antes de deployar: volvé a
   pegar `schema.sql` entero y ejecutalo. La sección 8 del archivo pone al día
   lo que `create ... if not exists` no toca — el default `hidden`, la
   visibilidad de una función creada y todavía sin abrir, y las filas de conteo
   de los sospechosos nuevos. Una función *abierta* conserva la visibilidad que
   tenía: si querés taparle los conteos, cambialo desde el panel.

   Los placeholders `a`..`d` se borran solos salvo que tengan votos. Si te
   quedaron votos de ensayo encima, borralos («Borrar todos los votos» en el
   panel, o finalizá esa función) y volvé a correr el archivo.
3. Los siete sospechosos ya están cargados al final de `schema.sql`, en el
   `insert into public.options`. Ese insert es un upsert: si volvés a correr el
   archivo, pisa nombre, rol, color y orden con lo que diga el
   archivo (`image_url` no se toca, así que las fotos sobreviven). Para un
   retoque rápido sirve **Table Editor → options**, pero lo que dure conviene
   escribirlo en `schema.sql`. Los `id` conviene no tocarlos una vez que hubo
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
| `NEXT_PUBLIC_DEFAULT_VOTE_UI` | `stack` (default), `swipe` o `grid` |

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

1. **`/admin` → Crear función.** Si esa noche Lady Maid o Mary Caissings las
   hace otra actriz, elegilo ahí mismo en «Elenco de hoy»: el público ve el
   identikit de quien está en escena. Se puede corregir después desde el panel
   sin tocar los votos. Queda en «sin abrir»: el público que escanee antes de
   tiempo ve una pantalla de espera que se despierta sola.
2. **Elegir qué ve el público** (se puede cambiar en cualquier momento):
   - **Ocultos** — nadie ve los votos ajenos hasta que cerrás. Es el default y
     la única de las tres que es hermética de verdad (ver «Privacidad de los
     conteos» abajo).
   - **Al votar** — cada uno ve los conteos recién después de elegir.
   - **En vivo** — las barras se mueven desde el primer voto. Máxima sensación
     de evento colectivo, pero arrastra a los indecisos.

   Con «Ocultos» el reparto igual ve todo en tiempo real desde `/admin`, y el
   público ve el resultado completo al cerrar la votación: lo que queda tapado
   es el conteo *mientras se vota*, que es lo que condiciona el voto de al lado.
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

## Identikits y elenco

Cada sospechoso se muestra como un identikit dibujado (`Identikit.tsx`): el
dibujo sobre un halo del color del personaje, con una huella dactilar de fondo
como marca de agua. Mientras falte el archivo de alguno, esa tarjeta muestra
la silueta dibujada por código, así que se puede ir cargando de a uno.

### Cargar los dibujos

1. Partir de los PNG originales, blanco y negro con fondo transparente,
   recortados al busto (el script recorta el margen transparente sobrante).
   Con que tengan **900 px de ancho o más** alcanza; más resolución no se ve.
2. Nombrarlos como dice `src/lib/cast.ts` (`noah.png`, `maid-a.png`,
   `maid-b.png`, `mary-a.png`, `mary-b.png`, …) y correr

   ```bash
   npm run identikits -- ~/carpeta/con/los/png
   ```

   Deja los WebP listos en `public/identikits/`. Se commitean con el código:
   son parte de la obra, no datos de una función.

Por qué WebP y 900 px: el dibujo nunca ocupa más de ~300 px CSS en pantalla, y
un celular actual tiene pantalla 3x, así que 900 px es el tope de lo que
alguien puede distinguir. WebP con pérdida (calidad 82) y canal alfa deja un
dibujo a lápiz en grises idéntico al PNG a un quinto o un décimo del peso: unos
40–80 KB por identikit en vez de 300–600 KB. En el wifi de un teatro lleno, con
cuarenta celulares bajando los siete a la vez, esa es la diferencia entre que
aparezcan al toque o de a uno.

`image_url` en la tabla `options` sigue existiendo como respaldo: se usa solo
para un personaje que no tenga identikit en `cast.ts` (por ejemplo, una foto
subida a Supabase Storage).

### Cuando cambia el elenco

En algunas fechas Lady Maid y Mary Caissings las hace otra actriz, y el
identikit tiene que ser el de quien está en escena. Eso se resuelve en dos
lugares:

- **`src/lib/cast.ts`** lista, por personaje, los actores posibles: un `id`
  estable, la etiqueta que muestra el panel (poné el nombre de la actriz) y el
  archivo de su identikit. El primero de la lista es el elenco por defecto.
  Para sumar un reemplazo a otro personaje alcanza con agregarlo a su lista y
  cargar el dibujo; el panel lo empieza a preguntar solo.
- **`shows.casting`** guarda, por función, qué actor se eligió para cada
  personaje que tiene más de uno (`{ "maid": "b" }`). Se elige al crear la
  función en `/admin`, y se puede cambiar después desde la tarjeta «Elenco de
  hoy». Como la elección queda en la función, el historial sabe con qué elenco
  se jugó cada noche.

Cambiar el elenco con la votación abierta es inocuo: cambia el dibujo que ve el
público (los celulares se actualizan solos, como con cualquier cambio en la
función) y no toca ningún voto.

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

### Por qué el voto se siente instantáneo

Son dos cosas distintas, y conviene no confundirlas al buscar lentitud:

- **La pantalla no espera al servidor.** Al tocar, el voto se pinta de una
  (`withOptimisticVote` en `VoteApp.tsx`) y la respuesta del POST lo confirma
  después. Si el servidor lo rechaza, la pantalla vuelve atrás sola y aparece el
  error.
- **El POST hace dos viajes a Supabase, no seis.** `/api/vote` trae la función y
  las opciones en un solo viaje paralelo, valida el `optionId` en memoria,
  inserta, y arma la respuesta con lo que ya tiene (`composePublicState`). Solo
  vuelve a la base si hay conteos para mostrar.

Si algún día el voto vuelve a sentirse lento, mirá primero estos dos puntos y la
región del proyecto de Supabase. El websocket no interviene: eso es lo que
avisa a *los demás* que votaste, no lo que registra tu voto.

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

**Ocultos es el default**, en la base (`shows.results_visibility`) y en el
panel: salvo que alguien lo cambie a mano, nadie en la sala puede ver los votos
ajenos mientras la votación está abierta. La policy de RLS impide leer
`tallies` — no hay forma de espiar los números, ni siquiera por websocket.

En modo **al votar** la tabla sí es legible, porque el que ya votó necesita
recibir las actualizaciones en vivo. Alguien con la consola del navegador
abierta podría mirar los conteos antes de votar. Es una barrera de interfaz
contra el efecto manada, no un secreto criptográfico. Si hace falta que sea
hermético hasta el cierre, usar **ocultos**.

---

## Tests del esquema

La lógica que más importa vive en SQL: los triggers de conteo, el índice que
garantiza una sola función viva a la vez, y las policies de RLS. `supabase/
schema.test.sql` las verifica (25 aserciones) contra un Postgres local:

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
