# Asesinato en la Mansión Greenstout · votación en sala

App de votación en sala para *Asesinato en la Mansión Greenstout*. El público
escanea un QR desde la butaca, acusa a uno de los siete sospechosos, y el panel
de backstage controla cuándo se abre y se cierra la votación.

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
final de `supabase/schema.sql`. Los párrafos de acusación de cada uno son de
relleno: reemplazalos por el texto real de la obra.

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
| Scroll vertical **(default)** | `/?ui=stack` | Gesto de feed. El botón vive en cada panel y pide dos toques. |
| Swipe horizontal | `/?ui=swipe` | Un sospechoso por pantalla completa. El botón sigue a quien estás mirando. |
| Grilla | `/?ui=grid` | Los siete juntos en pantalla. Tocás uno, después confirmás abajo. |

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

   Los placeholders `a`..`d` se borran solos **salvo que tengan votos**, y ahí
   el público los ve mezclados con los sospechosos reales. Ojo que «Borrar
   todos los votos» del panel solo limpia la función actual: los ensayos ya
   finalizados también cuentan. Para sacarlos, en el SQL Editor:

   ```sql
   -- 1. Mirá qué se va a borrar
   select o.id, o.name, count(v.id) as votos, count(distinct v.show_id) as funciones
     from options o left join votes v on v.option_id = o.id
    where o.id in ('a', 'b', 'c', 'd')
    group by o.id, o.name order by o.id;

   -- 2. Si son todos de ensayo, limpiá
   delete from votes   where option_id in ('a', 'b', 'c', 'd');
   delete from options where id        in ('a', 'b', 'c', 'd');
   ```

   Las funciones viejas quedan en el historial; la que tuviera uno de esos
   personajes como ganador fijado vuelve a conteo automático.
3. Los siete sospechosos ya están cargados al final de `schema.sql`, en el
   `insert into public.options`. Ese insert es un upsert: si volvés a correr el
   archivo, pisa nombre, bajada, párrafo, color y orden con lo que diga el
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

1. **`/admin` → Crear función.** Queda en «sin abrir»: el público que escanee
   antes de tiempo ve una pantalla de espera que se despierta sola.
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

## Fotos de los actores

Las siluetas dibujadas son un placeholder. Para usar las fotos reales:

1. Recortar cada uno de los siete actores en PNG con fondo transparente
   (vertical, pensado para verse contra negro).
2. Subirlas a **Supabase → Storage**, en un bucket público.
3. Pegar la URL de cada una en la columna `image_url` de su fila en `options`.

`Silhouette.tsx` usa la foto automáticamente cuando `image_url` no está vacío;
no hay que tocar código. Mientras tanto dibuja una silueta distinta por
sospechoso (sombrero, cofia, rodete, melena…), que alcanza para saber si la
pantalla se lee de un vistazo a oscuras.

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
schema.test.sql` las verifica (22 aserciones) contra un Postgres local:

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
