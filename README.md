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

### 2.5 Stripe (cobros, payouts y verificación de identidad)

Todo el código ya está escrito y no se activa hasta que exista la cuenta de
Stripe de la empresa — sin estas llaves, la app sigue funcionando igual,
solo que cada pantalla de pago/verificación muestra "todavía no está
activado" en vez de fallar. Cuando la cuenta exista:

1. Crea la cuenta en [stripe.com](https://stripe.com) y activa **Connect**
   (tipo Express) e **Identity** en el dashboard.
2. En **Developers → API keys**, copia la *Secret key* → `STRIPE_SECRET_KEY`.
3. En **Developers → Webhooks**, crea un endpoint apuntando a
   `https://<tu-dominio>/api/stripe/webhook`, suscrito a:
   `account.updated`, `checkout.session.completed`,
   `identity.verification_session.verified`,
   `identity.verification_session.requires_input`.
   Copia el *Signing secret* → `STRIPE_WEBHOOK_SECRET`.
4. Agrega `SUPABASE_SERVICE_ROLE_KEY` (ver 2.1) — sin ella el webhook no
   puede escribir en `bookings` / `sitter_profiles`.
5. Confirma que `NEXT_PUBLIC_SITE_URL` sea el dominio real en producción
   (Vercel → Environment Variables) — Stripe redirige ahí después del
   onboarding, el checkout y la verificación.

Ningún cambio de código hace falta: en cuanto esas variables existan en
Vercel y se vuelva a desplegar, `/dashboard/havener/payments`, el botón
"Pay now" y `/dashboard/havener/verification` empiezan a funcionar.

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
