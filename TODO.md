# Arcana Realm Studios — TODO

Running log of pending work, dated by session. Newest entries on top.

## 2026-08-04 (continuación)

- **Guardian monetizado**: ya no es gratis para siempre — licencia propia
  por créditos (`GuardianLicense`), independiente de `BotLicense`. Ver
  `apps/api/src/modules/guardian/application/guardian-license.service.ts`.
- **Push-to-talk hecho**: `apps/streaming/mic-bridge` — puente WebSocket
  real, probado de punta a punta en sandbox (icecast2+liquidsoap+ffmpeg
  reales, sin Docker) con audio genuino confirmado por `ffprobe`.
- **Bot de IMVU — investigación de `imvu.js` completa, hallazgo importante**:
  `imvu.js` **no es un cliente del protocolo de IMVU** — es un cliente de un
  relay de terceros (`imvu.js.org`, no afiliado a IMVU) que autentica ahí y
  después escucha eventos de sala por un canal de **Supabase Realtime** que
  ese backend entrega. Usarlo implica darle el token de la cuenta bot de
  IMVU a un sitio de un solo mantenedor, sin código abierto del lado que sí
  habla con IMVU, con una licencia que prohíbe forkearlo/modificarlo. Detalle
  completo en `apps/api/src/modules/imvu-bot/README.md`. La interfaz de
  dominio `IImvuRoomChatAdapter` ya está escrita
  (`apps/api/src/modules/imvu-bot/domain/`), pero **no hay adapter de
  infraestructura todavía** — bloqueado en (a) decisión de negocio sobre
  confiar en `imvu.js.org` y (b) credenciales reales de una cuenta bot para
  probar. También encontré que `RoomMember` no tiene ningún campo de
  identidad de IMVU — hace falta agregar algo como `imvuDisplayName` antes
  de que las respuestas conscientes de rol (`roleTag`) sean posibles.
- Jamendo: cuenta `roxdev` registrada, key de app creada del lado de
  Jamendo, pero el login en devportal.jamendo.com sigue bloqueado
  ("account isn't active or hasn't been approved yet"). Se escribió a
  `api@jamendo.com` pidiendo que activen la cuenta — esperando respuesta.
- Sigue pendiente: `JAMENDO_CLIENT_ID` (bloqueado en lo de arriba),
  `STRIPE_PRICE_PLUS_MONTHLY`/`STRIPE_PRICE_PREMIUM_MONTHLY` reales, y
  renombrar el servicio de Railway `arcana-realm-studios` → `streaming`
  (no se puede por API/MCP, solo desde el dashboard — instrucciones dadas).

## 2026-08-04

Pendiente para retomar mañana, en orden de prioridad:

1. **Bot de IMVU en sala con IA (protocolo no oficial)** — el ítem más grande.
   IMVU no tiene API oficial (el programa de API keys está cerrado), así que
   esto necesariamente corre sobre protocolo no documentado. Investigado hoy:
   - `imvu.js@0.1.0` existe en npm (`github.com/imvujs/imvu.js`, publicado
     hace 6 meses, depende de `@supabase/supabase-js`) — falta leer su código
     fuente real para entender qué expone antes de construir el adapter
     encima, no asumir nada de su README de marketing.
   - Hace falta una cuenta de bot de IMVU real (credenciales) para poder
     probar la conexión end-to-end — no se puede verificar sin eso.
   - Diseño: aislar todo detrás de una interfaz de dominio
     (`IImvuRoomChatAdapter`) para que el protocolo no oficial quede
     reemplazable, con una capa de respuesta por IA (LLM) separada de los
     comandos determinísticos existentes (!play, !skip, etc.) y consciente
     de los roles de sala (`RoomMember.roleTag`, ya construido hoy).
2. **Configurar `JAMENDO_CLIENT_ID`** en el servicio `api` de Railway —
   registro gratis en developer.jamendo.com. Sin esto, la búsqueda de música
   sigue funcionando pero solo devuelve la librería propia subida, no el
   catálogo Jamendo.
3. **Configurar precios reales de Stripe** (`STRIPE_PRICE_PLUS_MONTHLY`,
   `STRIPE_PRICE_PREMIUM_MONTHLY`) — sin esto el checkout de Plus/Premium
   (incluido el trial de 3 días nuevo) falla limpio con "no price configured".
4. **Mic on/off desde el navegador (push-to-talk)** — todavía no arrancado.
   El harbor de Liquidsoap ya acepta conexiones de fuente (confirmado
   funcionando hoy), pero un navegador no puede hablarle directo a ese
   protocolo — falta un puente WebSocket-mic → harbor.
5. Cosmético: renombrar el servicio de Railway `arcana-realm-studios` (el de
   Icecast/Liquidsoap) a `streaming` — el nombre genérico causó que hoy casi
   se creara un servicio duplicado sin querer antes de notar que ya existía
   y ya estaba funcionando.

### Notas del día

- El servicio de streaming (Icecast + Liquidsoap) **ya está desplegado y
  funcionando** en Railway — verificado con logs reales (Icecast arrancó,
  Liquidsoap 2.1.3 conectó el harbor mount exitosamente). No hace falta
  volver a desplegarlo.
- La cuenta de Railway está en plan Free — al intentar crear un servicio
  nuevo hoy salió "Free plan resource provision limit exceeded". Si se
  necesita otro servicio más adelante, revisar si hace falta upgrade de plan.
- PRs #3, #4, #5 mergeados hoy a `main`: trial de 3 días + anti-abuso por IP,
  sección propia de Guardian en pricing, now-playing + reproductor +
  volumen, control de cola (mover/quitar), catálogo Jamendo, roles de sala
  self-service, copy corregido del panel de Live, widget de FAQ.
