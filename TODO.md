# Arcana Realm Studios — TODO

Running log of pending work, dated by session. Newest entries on top.

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
