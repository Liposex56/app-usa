-- ============================================================================
-- Havenr — 0004_payments_settings.sql
-- Avance: reparto de comisión (empresa / Havener) y cierre de un hueco en la
-- revisión de seguros.
--
-- Esto NO conecta ninguna pasarela de pago real (Stripe Connect u otra) ni
-- crea reservas — eso sigue pendiente de una cuenta empresarial y del
-- proveedor que se elija (ver README, sección "Lo que falta"). Lo que sí
-- entrega esta migración:
--   1. `platform_settings` — el porcentaje de comisión que se queda la
--      empresa, configurable desde el panel administrativo en vez de estar
--      escrito en el código. Arranca en 20% empresa / 80% Havener.
--   2. Un candado en `sitter_insurance` para que un Havener no pueda
--      auto-aprobarse el seguro. La tabla ya existía (0001_schema.sql) y la
--      política RLS ya dejaba al Havener escribir toda su fila, incluida
--      `status`; le faltaba el mismo trigger de "columnas de confianza" que
--      ya protege a `sitter_profiles`.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- platform_settings — fila única. `id` fijo en 1 para que sólo pueda existir
-- una fila (patrón singleton).
-- ---------------------------------------------------------------------------
create table if not exists public.platform_settings (
  id                          int primary key default 1 check (id = 1),
  company_commission_percent numeric(5,2) not null default 20.00
                              check (company_commission_percent >= 0
                                     and company_commission_percent <= 100),
  updated_by                  uuid references public.profiles (id),
  updated_at                  timestamptz not null default now()
);

insert into public.platform_settings (id, company_commission_percent)
values (1, 20.00)
on conflict (id) do nothing;

drop trigger if exists platform_settings_set_updated_at on public.platform_settings;
create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

alter table public.platform_settings enable row level security;

drop policy if exists "settings: staff read" on public.platform_settings;
create policy "settings: staff read"
  on public.platform_settings for select
  using (public.is_staff());

-- Sólo admins cambian la comisión — igual que staff_members.
drop policy if exists "settings: admin write" on public.platform_settings;
create policy "settings: admin write"
  on public.platform_settings for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- sitter_insurance — el Havener sólo puede tocar los campos de su envío.
-- `status`, `reviewed_by` y `reviewed_at` los mueve siempre el staff, igual
-- que protect_sitter_trust_columns() hace con sitter_profiles.
-- ---------------------------------------------------------------------------
create or replace function public.protect_sitter_insurance_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_staff() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- A Havener submitting for the first time always lands in 'pending',
    -- no matter what the client sends — there is no OLD row to fall back to.
    new.status      := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
    return new;
  end if;

  -- El Havener puede (re)enviar su seguro para revisión, pero no puede
  -- aprobarse ni rechazarse a sí mismo. Cualquier estado que no sea
  -- 'pending' vuelve al que ya tenía.
  if new.status is distinct from 'pending' then
    new.status := old.status;
  end if;

  new.reviewed_by := old.reviewed_by;
  new.reviewed_at := old.reviewed_at;

  return new;
end;
$$;

drop trigger if exists sitter_insurance_protect_trust on public.sitter_insurance;
create trigger sitter_insurance_protect_trust
  before insert or update on public.sitter_insurance
  for each row execute function public.protect_sitter_insurance_columns();
