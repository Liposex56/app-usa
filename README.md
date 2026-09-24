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

Eso te da acceso de staff en todas las políticas RLS. El panel administrativo
en sí es una fase posterior.

---

## 3. Qué hay construido

### Sitio público (inglés)

| Ruta | Contenido |
|---|---|
| `/` | Home: hero, 5 servicios, verificación, cómo funciona, features |
| `/services` | Los 5 servicios con lo que incluye cada uno |
| `/services/[slug]` | Detalle por servicio |
| `/how-it-works` | Flujo de dueño y flujo de Havener, y cómo funciona el pago |
| `/trust-and-safety` | Las 5 verificaciones, privacidad, incidentes, reseñas dobles |
| `/become-a-havener` | Landing de reclutamiento con requisitos |
| `/legal/[terms\|privacy\|cookies]` | Plantillas — **falta el texto legal real** |

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

### Panel administrativo (arranque)

Visible en el menú sólo para filas en `staff_members`. Por ahora sólo cubre
lo que se pidió como primer avance del módulo de pagos/seguros:

| Ruta | Contenido |
|---|---|
| `/dashboard/admin` | Resumen: seguros pendientes, comisión vigente |
| `/dashboard/admin/insurance` | Aprobar/rechazar seguros enviados; actualiza `sitter_insurance` y la insignia pública `is_insured` |
| `/dashboard/admin/settings` | Comisión de la empresa (`platform_settings`, sólo editable por `role = 'admin'`) y un simulador de reparto |

El resto del panel (usuarios, reservas, chat, reportes — sección 15 de la
propuesta) sigue sin construir.

### Reservas, disponibilidad, chat y Meet & Greet

- **Búsqueda por fechas** (`/search`): el dueño elige rango de fechas y solo
  ve Haveners sin una reserva `confirmed`/`in_progress` que choque con esas
  fechas (`lib/availability.ts`).
- **Reserva instantánea**: como la disponibilidad ya se verificó al buscar,
  `requestBookingAction` crea la reserva directamente en `confirmed` — no
  existe paso de aceptar/rechazar por parte del Havener.
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

### Verificación de identidad automática

`/dashboard/havener/verification` usa Stripe Identity (documento + selfie)
para aprobar `background_check_status` automáticamente — mismo estado: el
código está listo, solo falta la cuenta de Stripe. Es una verificación de
identidad, no un background check criminal completo; si la empresa
necesita eso además, hay que sumar un proveedor tipo Checkr más adelante.

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

Búsqueda por disponibilidad, reservas instantáneas, chat, Meet & Greet, mapa
GPS de caminatas, cobro con Stripe Connect y verificación de identidad con
Stripe Identity ya están construidos (ver sección 3). Queda:

1. **Llamada con número enmascarado** ("Connect through Havenr" en la
   reserva) — hoy solo se guarda la preferencia de horario
   (`bookings.call_window`); falta contratar un proveedor de telefonía tipo
   Twilio para el número real.
2. **App móvil** (React Native + Expo) con GPS e informes de servicio
3. **Panel administrativo completo** — usuarios, reservas, chat, reportes
   (hoy sólo existen seguros y comisión, ver arriba)
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
- **Background check criminal completo** (tipo Checkr) si Stripe Identity
  (solo identidad) no es suficiente para el negocio.
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
