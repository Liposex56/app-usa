# Havenr — web platform

Fase 1 del proyecto Havenr: sitio público en inglés, autenticación con Supabase
y onboarding completo de dueño (owner) y cuidador (Havener).

Stack: **Next.js 15 (App Router) · TypeScript · Tailwind CSS 3 · Supabase**

---

## 1. Arrancar en tu máquina

```bash
npm install
cp .env.local.example .env.local   # y llena las dos llaves de Supabase
npm run dev
```

Abre http://localhost:3000

> `npm install` necesita internet. La primera vez también descarga las fuentes
> de Google (Jost y Source Sans 3) que usa `next/font`.

---

## 2. Configurar Supabase

### 2.1 Llaves

En tu proyecto de Supabase → **Project Settings → API**:

| Valor | Va en |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` / `publishable` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` (ver 2.5 — solo la usa el webhook de Stripe) |

La `service_role` key se salta todas las políticas RLS — **solo** se lee
desde `lib/supabase/service.ts`, y ese archivo solo se usa desde
`app/api/stripe/webhook/route.ts` (un endpoint que Stripe llama sin sesión
de usuario). Nunca la importes desde una Server Action, página o componente
que actúe a nombre de un usuario — ahí siempre `lib/supabase/server.ts`,
para que RLS siga aplicando.

### 2.2 Migraciones

En el **SQL Editor** de Supabase, ejecuta en este orden:

1. `supabase/migrations/0001_schema.sql` — tablas, enums, triggers
2. `supabase/migrations/0002_rls.sql` — Row Level Security y la vista pública
3. `supabase/migrations/0003_storage.sql` — buckets y sus políticas
4. `supabase/migrations/0004_payments_settings.sql` — comisión configurable
   y el candado que evita que un Havener se auto-apruebe el seguro
5. `supabase/migrations/0005_service_settings.sql` — configuración de
   servicios y días disponibles por Havener
6. `supabase/migrations/0006_profile_and_public_view.sql` — perfil público
   y la vista `public_sitters`
7. `supabase/migrations/0007_pet_profile.sql` — perfil extendido de mascota
8. `supabase/migrations/0008_bookings_chat_reviews.sql` — reservas, chat y
   reseñas de publicación doble
9. `supabase/migrations/0009_instant_booking.sql` — reserva instantánea
   (sin paso de aceptar/rechazar), propuestas de Meet & Greet, reseñas
   públicas del perfil del Havener
10. `supabase/migrations/0010_owner_profile.sql` — vista del dueño de
    mascota para el Havener (About / Feedback / Pets)
11. `supabase/migrations/0011_stripe.sql` — columnas para cuentas Stripe
    Connect por Havener, estado de pago por reserva y verificación de
    documentos con Stripe Identity
12. `supabase/migrations/0012_walk_tracking.sql` — puntos GPS de las
    caminatas (mapa en vivo)

Cada archivo es idempotente: se puede volver a correr sin romper nada.
**Cada vez que se agregue un archivo nuevo en `supabase/migrations/`, hay
que correrlo a mano en el SQL Editor de Supabase — nadie más lo hace por
ti.**

### 2.3 Auth

En **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (en producción, el dominio real)
- **Redirect URLs**: agrega `http://localhost:3000/auth/callback`

En **Authentication → Providers → Email**, deja *Confirm email* activado.
Si lo apagas para probar más rápido, el registro entra directo al onboarding.

### 2.4 Hacerte administrador

Después de crear tu cuenta, corre esto en el SQL Editor:

```sql
insert into public.staff_members (user_id, role)
select id, 'admin' from public.profiles where email = 'tu-correo@ejemplo.com';
```

### 2.5 Stripe (cobros, pagos a Haveners, propina y verificación de identidad)

Todo el código ya está escrito y no se activa hasta que existan las llaves
de Stripe: sin ellas la app sigue funcionando igual, solo que cada pantalla de
pago dice "todavía no está activado". Qué hace cuando se activa:

- **Cobro al dueño** con Stripe Checkout, en dólares: **tarjetas, Apple Pay y
  Google Pay** (Checkout muestra las billeteras solo, en los dispositivos que
  las tienen). Pagar es el "Book" del dueño.
- **Pago al Havener** con Stripe Connect (cuentas Express): el dinero va a la
  cuenta del Havener y Havenr se queda su comisión (`application_fee`).
- **Reembolsos automáticos** (`lib/refunds.ts`) cuando una solicitud pagada se
  rechaza o se retira, cuando Havenr confirma una cancelación, y cuando se
  modifica una solicitud pagada (el precio se recalcula y el dueño paga de
  nuevo). Se devuelve también la parte del Havener y la comisión.
- **Propina** (10 / 15 / 20 / 25 % con el monto exacto) al terminar el
  servicio: un pago aparte, 100 % para el Havener.
- **Stripe Identity** para el documento y la selfie del Havener. Ojo: Stripe
  **no** revisa antecedentes penales.

**Pasos** (primero en *modo de prueba*; el modo real se activa al final):

1. En el dashboard de Stripe elige la cuenta de Havenr (o crea una cuenta
   nueva dentro de la misma organización) y activa **Connect** (cuentas
   Express) e **Identity**.
2. **Developers → API keys:** la *Secret key* (`sk_test_…`) →
   `STRIPE_SECRET_KEY` en Vercel.
3. **Developers → Webhooks:** crea un endpoint a
   `https://<tu-dominio>/api/stripe/webhook` con los eventos
   `checkout.session.completed`, `identity.verification_session.verified` y
   `identity.verification_session.requires_input` (eventos de **tu cuenta**).
   Su *Signing secret* (`whsec_…`) → `STRIPE_WEBHOOK_SECRET`.
4. Si quieres que el estado de las cuentas de los Haveners se actualice solo,
   crea un **segundo** endpoint a la misma URL con el evento
   `account.updated` y "Listen to events on Connected accounts". Su secreto se
   agrega al mismo `STRIPE_WEBHOOK_SECRET` **separado por coma**
   (`whsec_a,whsec_b`). Sin él no pasa nada grave: la pantalla de pagos del
   Havener también consulta a Stripe al abrirse.
5. `SUPABASE_SERVICE_ROLE_KEY` (ver 2.1): sin ella el webhook y los
   reembolsos no pueden escribir en `bookings`.
6. `NEXT_PUBLIC_SITE_URL` debe ser el dominio real en Vercel (Stripe redirige
   ahí al volver del checkout y del alta del Havener).
7. Aplica `supabase/migrations/0020_payment_columns_protected.sql`: impide que
   un dueño marque su propia reserva como pagada desde la API.

Prueba con tarjetas de prueba (`4242 4242 4242 4242`, cualquier fecha futura y
CVC). Para salir a producción: activa la cuenta (datos de la empresa y banco),
cambia a las llaves `sk_live_…` y crea de nuevo los webhooks en modo real.

Eso te da acceso de staff en todas las políticas RLS y el menú "Admin panel".

---

## 3. Qué hay construido

### Sitio público (inglés)

| Ruta | Contenido |
|---|---|
| `/` | Home (el diseño final de la landing, ver abajo): entrada animada, hero, video HAVNR, 5 servicios, Four checks, cómo funciona, detalles, testimonios, FAQ y cierre |
| `/services` | Los 5 servicios con lo que incluye cada uno |
| `/services/[slug]` | Detalle por servicio |
| `/how-it-works` | Flujo de dueño y flujo de Havener, y cómo funciona el pago |
| `/trust-and-safety` | Las 5 verificaciones, privacidad, incidentes, reseñas dobles |
| `/become-a-havener` | Landing de reclutamiento con requisitos |
| `/legal/[terms\|privacy\|cookies]` | Plantillas — **falta el texto legal real** |

### La home (landing)

Es el trabajo final del programador (proyecto Vite `havenr-web`), portado
tal cual a Next.js. El diseño, los textos y las rutas de los botones están en
`components/home/`:

| Archivo | Para qué |
|---|---|
| `components/home/content.ts` | **Todos** los textos, fotos y videos, y a dónde va cada botón (`links`). Se edita aquí, no en los componentes |
| `components/home/intro.tsx`, `keyed-video.tsx` | Pantalla "Enter their haven": al dar clic se reproduce la puerta con el fondo negro vuelto transparente (WebGL). Se muestra una vez por sesión del navegador (cookie `havenr_intro_seen`); `intro.enabled = false` la apaga |
| `components/home/*.tsx` | Una sección por archivo (hero, services, trust-safety, how-it-works, details, testimonials, faq, closing) |
| `app/(home)/` | Layout (header + franja legal) y página que arma las secciones |
| `public/home/images`, `public/home/video` | Fotos, ilustraciones y videos |

**Cambiar el video de arriba:** el video de la franja es
`public/home/video/havenr-brand.mp4` (poster en
`public/home/images/havenr-brand-poster.jpg`). La franja se muestra con la
proporción del propio video (hoy 1920×818, 2.35:1), sin recortarlo: al cambiar
el archivo pon su ancho y alto reales en `servicesBand` (`content.ts`).
El espacio del hero (persona + perro) acepta un video poniendo su ruta en
`hero.video`. La animación de entrada es `public/home/video/intro-door.mp4`.
Los videos deben ir en MP4 H.264; con fondo negro si es la animación de entrada.

El header es el mismo para todo el sitio (`components/site-header.tsx`): en la
home sus enlaces bajan a cada sección; en las demás páginas llevan a `/#…`.
Los colores propios de la landing viven en `tailwind.config.ts` bajo `hv`
(`bg-hv-ink`, `text-hv-sky`…), porque su `cream` y `sky` no son los de la app.

### Cuentas

- `/signup`, `/login`, `/forgot-password`, `/account/password`
- Confirmación por correo vía `/auth/callback`
- Middleware que refresca la sesión y protege `/dashboard`, `/onboarding`, `/account`

### Onboarding

1. `/onboarding` — elegir rol (owner / havener / ambos)
2. `/onboarding/owner` — datos de contacto, dirección, contacto de emergencia
3. `/onboarding/pet` — perfil completo de mascota: salud, vacunas, alimentación,
   comportamiento, compatibilidad y notas privadas
4. `/onboarding/havener` — servicios y tarifas, bio, rutina diaria, zona,
   detalles de la casa, qué acepta, política de cancelación

El progreso se guarda en `profiles.onboarding_step`, así que el usuario puede
salir y volver donde quedó.

### Dashboard

`/dashboard` con mascotas, estado del listado de Havener, avance de las cuatro
verificaciones, y `/dashboard/pets`, `/dashboard/pets/new`, `/dashboard/havener`.

### Seguro del Havener

`/dashboard/havener/insurance` — el Havener registra aseguradora, póliza,
cobertura, vigencia y sube el documento (bucket privado `verification-docs`).
Cada envío queda en `pending`; un Havener no puede aprobarse a sí mismo
(`sitter_insurance_protect_trust`, ver `0004_payments_settings.sql`).

### Panel administrativo

Visible en el menú sólo para filas en `staff_members` (todo en inglés, como el
resto del sitio).

| Ruta | Contenido |
|---|---|
| `/dashboard/admin` | Resumen: perfiles, antecedentes y seguros por revisar, reservas abiertas, usuarios, comisión |
| `/dashboard/admin/havener-profiles` | Aprobar/rechazar perfiles de Havener (`sitter_profiles.status`) — lo que hace visibles a los Haveners en la búsqueda |
| `/dashboard/admin/background-checks` | Cola de antecedentes penales: resultados "Needs review", registro manual mientras no haya proveedor |
| `/dashboard/admin/insurance` | Aprobar/rechazar seguros enviados; actualiza `sitter_insurance` y la insignia pública `is_insured` |
| `/dashboard/admin/bookings` | Todas las reservas con filtro por estado; abre la reserva en modo solo lectura (también su chat) |
| `/dashboard/admin/users` | Usuarios con búsqueda por nombre/correo y filtro por rol |
| `/dashboard/admin/reports` | Conversaciones reportadas |
| `/dashboard/admin/settings` | Comisión de la empresa (`platform_settings`, sólo editable por `role = 'admin'`) y un simulador de reparto |

### Reservas, disponibilidad, chat y Meet & Greet

- **Búsqueda por fechas y servicio** (`/search`): no muestra ningún Havener
  hasta que el dueño elige fechas **y** servicio; entonces solo aparecen los
  compatibles con la mascota (especie, tamaño, energía) y libres en esas
  fechas (`lib/matching.ts`, `lib/availability.ts`). Los Haveners que
  actualizan su disponibilidad cada día aparecen primero.
- **Contactar a un Havener** (`/sitters/[id]/contact`): resumen editable
  (servicio, fechas, ventanas de entrega/recogida, mascotas, extras y mensaje
  prediseñado). Crea una solicitud `requested` más el primer mensaje del chat;
  el Havener la acepta o rechaza desde la reserva. Después
  (`/sitters/[id]/contact/sent`) se ofrecen hasta 3 Haveners compatibles ya
  seleccionados para contactarlos a todos con un clic.
- **Book en dos pasos** (`0014_booking_flow.sql`): una reserva solo pasa a
  `confirmed` cuando dueño **y** Havener hacen clic en "Book"; con uno solo
  queda `pending` (aunque el dueño ya haya pagado). El Havener ve tips de
  seguridad antes de reservar y puede "Cancel request" antes de confirmarse.
  Sobre el chat hay una barra: Book, Modify request (recalcula el precio en la
  base de datos y pide volver a reservar), Archive, Details y Report (los
  reportes se ven en `/dashboard/admin/reports`).
- **Calendario** (`/dashboard/calendar`, `0015_calendar_capacity.sql`): vista
  mensual por usuario. El Havener define cuántas mascotas acepta por servicio
  (por defecto y por día) y la disponibilidad se calcula por espacios; el
  dueño ve sus reservas y meet & greets.
- **Ubicación en la búsqueda**: dirección obligatoria con autocompletado
  (Photon/OpenStreetMap vía `/api/places`; cambiar de proveedor es editar
  `lib/places.ts`). Solo aparecen Haveners dentro de su radio de servicio; el
  Havener queda ubicado en el mapa al guardar su perfil.
- **Registro/inicio con Google o Facebook**: los botones ya están; cada
  proveedor se activa en Supabase → Authentication → Providers con las
  credenciales de ese proveedor (Google ya está activo). Apple se quitó: pide
  cuenta de desarrollador de pago (99 USD/año) y no es necesario para lanzar.
- **Chat** (`/dashboard/bookings/[id]`) en vivo vía Supabase Realtime, con
  filtro de contacto externo (`lib/chat-filter.ts`).
- **Meet & Greet**: cualquiera de las dos partes propone fecha/hora desde el
  chat; la otra acepta o rechaza (`meet_greets`, `0009_instant_booking.sql`).
- **Perfil del dueño para el Havener** (`/dashboard/bookings/[id]/owner`):
  About / Feedback / Pets — nunca expone la fila cruda de `profiles`.
- **Mapa GPS en vivo de las caminatas**: Leaflet + OpenStreetMap (sin llave
  de API), el Havener comparte su ubicación mientras camina al perro y el
  dueño ve la ruta en tiempo real (`0012_walk_tracking.sql`).

### Reparto de pago (empresa / Havener)

`lib/payments.ts` calcula el reparto — hoy 20% empresa / 80% Havener,
configurable desde `/dashboard/admin/settings`. **El código de cobro ya
está completo** (`lib/stripe.ts`, `/dashboard/havener/payments`, botón "Pay
now" en la reserva, `/api/stripe/webhook`) pero no mueve dinero real todavía
porque falta crear la cuenta de Stripe de la empresa — en cuanto exista,
solo hace falta cargar las llaves (ver sección 2.5) para que empiece a
funcionar, sin tocar código.

### Verificación: identidad vs. antecedentes penales

Son dos cosas distintas y la insignia pública **"Background checked"** solo
significa la segunda. `/dashboard/havener/verification` tiene los dos pasos:

1. **Identidad** (`sitter_profiles.identity_status`): documento + selfie con
   Stripe Identity. El código está listo; falta la cuenta de Stripe.
2. **Antecedentes penales** (`background_checks` →
   `sitter_profiles.background_check_status`): lo corre un proveedor de
   screening (Checkr, ver abajo). Havenr nunca ve el SSN ni el reporte: crea
   una invitación, el Havener completa y firma el consentimiento en la página
   de Checkr, y de vuelta solo llega el veredicto.
   - `clear` → insignia encendida sola.
   - `consider` → **nunca se rechaza automáticamente**: queda en
     `/dashboard/admin/background-checks` para que una persona decida (las
     notificaciones de acción adversa FCRA se hacen desde Checkr).
   - Mientras no haya `CHECKR_API_KEY`, el staff registra el resultado a mano
     en ese mismo panel.

Variables (ver `.env.local.example`): `CHECKR_API_KEY` (también firma el
webhook), `CHECKR_PACKAGE` y opcionalmente `CHECKR_API_BASE` para staging.
Webhook: `https://<tu-dominio>/api/checkr/webhook` con los eventos
`invitation.completed`, `invitation.expired`, `report.created`,
`report.completed`. Requiere también `SUPABASE_SERVICE_ROLE_KEY`.

> La integración con Checkr está escrita según su documentación pública pero
> **no se ha probado contra su API** (no hay cuenta todavía): al conectar las
> llaves, hacer una prueba completa en su modo de pruebas antes de abrirlo.

### Horas exactas, inicio automático y cancelación (`0018_timed_services_and_cancellation.sql`)

- **Boarding y house sitting corren con la hora.** Antes de enviar la
  solicitud el dueño elige una hora de entrega y una de recogida (exactas,
  obligatorias; house sitting: llegada y salida). El servicio pasa solo a
  *En curso* a la hora de entrega del primer día y a *Finalizada* a la hora de
  recogida del último, en la hora de Boston. No hay botones Start / Complete
  para ellos y **no tienen informe de servicio**: las fotos y videos van por
  el chat (botón *Gallery* los junta) y a las 6 PM de Boston, si ese día no se
  envió ninguna, el Havener recibe un recordatorio. Lo hace `advance_booking_statuses()`: pg_cron cada pocos minutos
  y, además, la app la llama al abrir una reserva o la lista de reservas.
- **Caminatas, visitas y daycare** se inician y se cierran con Start / Mark
  completed del Havener. Caminatas y visitas tienen una **duración reservada
  (30 o 60 min)** y no se pueden cerrar antes; ninguna de las tres se cierra sin
  las fotos y el resumen (pipí / popó, comida, agua; arenero si es gato).
- **Fotos de boarding/daycare/house sitting van por el chat** (clip del campo de
  mensaje, bucket privado `chat-media`). El informe del servicio se arma con
  las fotos que el Havener mandó por ahí.
- **Cancelar una reserva confirmada es una solicitud**, no inmediata:
  - solo dentro del plazo de la política de cancelación del Havener para ese
    servicio (`same_day`/`one_day` = el día en que se reservó, `three_day` =
    3 días contando ese día, `seven_day` = 7), contado desde que se confirmó la
    reserva;
  - nunca durante el servicio;
  - la solicitud queda en `/dashboard/admin/cancellations` y la **confirma la
    empresa** (o la rechaza y la reserva sigue). Ambas partes reciben un
    mensaje en el chat. El plazo se valida en la base de datos
    (`protect_booking_transitions`), no solo en la pantalla.
  - Retirar una *solicitud* aún no confirmada sigue siendo inmediato.
- **Hora extra:** cada Havener pone su tarifa por hora en los ajustes del
  servicio (`extra_hour_rate_cents`); se muestra en el perfil y en la reserva.
  El cobro automático de horas extra llega con los pagos.
- **Tienda Pawsitive Vibes:** el dueño ve una tarjeta con enlace a la tienda en
  su reserva confirmada (`lib/partners.ts`).

### Feriados, tarifas automáticas y notificaciones (`0019_workflow_updates.sql`)

- **Feriados** (`holidays`, editable en *Admin → Rates & holidays*): una estadía
  que toque cualquiera se cobra completa con la **tarifa de feriado** del
  Havener. Si no, una estadía de más de una unidad puede usar su **tarifa de
  estadía larga**. El precio lo calcula la función SQL `stay_price()` (la usan
  la solicitud y *Modify request*); `lib/pricing.ts` solo copia la regla para
  el estimado en vivo del formulario. La reserva guarda qué tarifa se aplicó
  (`rate_kind`).
- **Tarifas automáticas:** *Admin → Rates & holidays* fija tres porcentajes
  (feriado, mascota adicional, estadía larga). Mientras alguno esté vacío, el
  interruptor del Havener ("Use Havenr's automatic rates") queda deshabilitado.
  Con él encendido, esas tres tarifas salen de su tarifa base (a dólares
  enteros); las demás las pone él.
- **Comisión real:** `platform_settings` solo la lee el staff, así que antes las
  solicitudes usaban siempre el 20 % por defecto. Ahora todos la leen con
  `current_commission_percent()`.
- **Notificaciones dentro de la app** (campana en la barra, `/dashboard/notifications`):
  nueva solicitud, mensaje (máx. una por conversación cada 15 min), le toca
  reservar a la otra parte, confirmada, rechazada, cancelada, iniciada,
  completada, reseña recibida y reseñas visibles. Las escriben triggers de la
  base de datos (`notify_user()`); el usuario solo puede leerlas y marcarlas
  leídas.
- **Recordatorios diarios** (pg_cron `daily-reminders`, 22:00 UTC): fotos del día
  en boarding / house sitting, y reseña pendiente a 1 y a 4 días.
- **Correo (opcional):** con `RESEND_API_KEY`, `EMAIL_FROM` y `CRON_SECRET`, la
  ruta `/api/cron/emails` (cron diario en `vercel.json`) envía por correo las
  notificaciones que siguen sin leer. Sin esas variables no pasa nada.

### Informes de servicio y caminatas con GPS

Mientras un servicio está `in_progress`, el Havener lleva un **log** en la
reserva (`service_updates` + bucket privado `service-updates`): fotos y
videos, entradas de un toque (potty, comida, agua, juego, medicación, chequeo
de bienestar…) y notas. El dueño lo sigue en vivo y, al terminar, ve el
**informe** (duración, distancia GPS de la caminata, fotos, entradas).

Para cerrar el servicio hay requisitos (`lib/service-reports.ts`, también
validados en el servidor en `completeServiceAction`):

| Servicio | Requisitos |
|---|---|
| Caminata | ≥1 foto, ≥1 potty break y ≥2 puntos de GPS |
| Visita | ≥1 foto y el chequeo de bienestar |
| Hospedaje, guardería, en casa | ≥1 foto o video |

El rastreo GPS mantiene la pantalla encendida (Screen Wake Lock) y avisa si el
navegador no lo permite — un celular deja de compartir ubicación al bloquearse.

---

## 4. Cómo está protegida la privacidad

Esto es lo que se le prometió a la clienta en la sección 16 de la propuesta y
está implementado en `0002_rls.sql`:

- **`profiles` no es legible por nadie más que su dueño.** Un Havener no puede
  leer el nombre legal, teléfono, dirección ni datos de pago de un cliente.
- La identidad pública de un Havener viaja por la vista **`public_sitters`**,
  que expone solo columnas seleccionadas a mano y solo si `status = 'approved'`.
  Esa vista es la frontera de privacidad: **nunca le agregues una columna PII.**
- Las columnas de confianza (`status`, background check, seguro, rating) están
  protegidas por el trigger `protect_sitter_trust_columns()`: un Havener no
  puede auto-aprobarse aunque manipule la petición.
- Documentos de identidad, vacunas y pólizas van al bucket privado
  `verification-docs`, legible solo por quien lo subió y por staff.
- Las fotos de mascotas están en un bucket privado; se sirven con URLs firmadas.

---

## 5. Lo que falta (fases siguientes)

Búsqueda por disponibilidad, solicitudes y reservas, chat, Meet & Greet, mapa
GPS e informes de servicio, cobro con Stripe Connect, verificación de
identidad y flujo de antecedentes penales ya están construidos (ver
sección 3). Queda:

1. **Llamada con número enmascarado** ("Connect through Havenr" en la
   reserva) — hoy solo se guarda la preferencia de horario
   (`bookings.call_window`); falta contratar un proveedor de telefonía tipo
   Twilio para el número real.
2. **App móvil** (React Native + Expo) con GPS e informes de servicio
3. **Recordatorios automáticos de fotos** para hospedaje y guardería ("no ha
   llegado ninguna foto hoy") — necesita correo/SMS transaccional.
4. **Reels y multimedia**

### Pendientes que no son código

- **Texto legal**: términos, privacidad y cookies deben redactarlos un abogado
  en EE.UU. Las páginas ya existen, solo falta reemplazar el contenido.
- **Política de cancelación**: el anexo referido en la propuesta todavía no
  existe. Sin él no se puede programar el cálculo de fees.
- **Cuenta de Stripe de la empresa** — activa cobros, payouts y la
  verificación de identidad automática a la vez (ver sección 2.5). Mientras
  tanto, el seguro y el background check se revisan a mano desde
  `/dashboard/admin/insurance` y `/dashboard/havener/verification`.
- **Proveedor de telefonía** (tipo Twilio) para el número enmascarado.
- **Cuenta de Checkr** (o similar) para los antecedentes penales
  automáticos — el código está listo, ver "Verificación: identidad vs.
  antecedentes penales". Hasta entonces se registran a mano en el panel.
- **Correo transaccional** — cada uno necesita cuenta empresarial a nombre
  de Havenr.

---

## 6. Marca

Los assets salen del manual de identidad (Leneconcept.co, entrega 2026-08-17)
y están en `public/brand/`.

| Color | Hex | Uso |
|---|---|---|
| Gold | `#BE8210` | Primario, botones y acentos |
| Sky | `#C2DCF4` | Secundario, hero y fondos suaves |
| Cream | `#FFF8CD` | Fondos cálidos y badges |
| Bone | `#F8F5E9` | Fondo general del sitio |
| Olive | `#69532A` | Terciario, texto de apoyo |
| Espresso | `#26100B` | Texto y secciones oscuras |

Tipografía: la marca usa **Myriad Pro** y **Better Vinegar**, ninguna con
licencia web. Se sustituyeron por **Source Sans 3** (hermana abierta de Myriad,
de Adobe) para texto y **Jost** para títulos, que coincide con el trazo
geométrico del logotipo. Si se compra la licencia de Myriad Pro para web, se
cambia en `app/layout.tsx`.

---

## 7. Estructura

```
app/
  (marketing)/      sitio público — layout con header y footer
  (auth)/           login, signup, forgot-password
  auth/             callback y signout (route handlers)
  onboarding/       wizard de 4 pasos + server actions
  dashboard/        área privada
  account/          cambio de contraseña
components/         ui, iconos, logo, header, footer
lib/
  supabase/         clientes de browser, server y middleware
  database.types.ts tipos que reflejan las migraciones
  services.ts       definición de los 5 servicios (fuente única)
supabase/migrations/  el SQL que hay que correr
public/brand/       logos derivados del manual de marca
```

Para regenerar los tipos desde la base real (recomendado después de cambiar el
esquema):

```bash
npx supabase gen types typescript --project-id TU-REF > lib/database.types.ts
```
