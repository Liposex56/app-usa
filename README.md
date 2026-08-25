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

La `service_role` key **no se usa en este proyecto** y nunca debe entrar al
código de Next.js: se salta todas las políticas RLS.

### 2.2 Migraciones

En el **SQL Editor** de Supabase, ejecuta en este orden:

1. `supabase/migrations/0001_schema.sql` — tablas, enums, triggers
2. `supabase/migrations/0002_rls.sql` — Row Level Security y la vista pública
3. `supabase/migrations/0003_storage.sql` — buckets y sus políticas

Cada archivo es idempotente: se puede volver a correr sin romper nada.

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

En orden sugerido:

1. **Búsqueda y filtros** — la regla de "compatibilidad antes que popularidad"
   ya está en el modelo de datos, falta la consulta y la UI
2. **Reservas** — tabla `bookings`, máquina de estados, calendario, y la
   política RLS que le da al Havener acceso a la mascota mientras dure la reserva
3. **Chat interno** con detección de contactos externos
4. **Pagos** — pasarela de marketplace, comisión, propinas, liquidación
5. **App móvil** (React Native + Expo) con GPS e informes de servicio
6. **Panel administrativo**
7. **Reels y multimedia**

### Pendientes que no son código

- **Texto legal**: términos, privacidad y cookies deben redactarlos un abogado
  en EE.UU. Las páginas ya existen, solo falta reemplazar el contenido.
- **Política de cancelación**: el anexo referido en la propuesta todavía no
  existe. Sin él no se puede programar el cálculo de fees.
- **Proveedores externos**: background check (tipo Checkr), pasarela de pagos,
  mapas, correo transaccional. Cada uno necesita cuenta empresarial a nombre
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
