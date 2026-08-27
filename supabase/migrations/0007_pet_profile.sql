-- ============================================================================
-- Havenr — 0007_pet_profile.sql
-- Avance: tarjeta resumen (#8) y perfil completo de mascota (#9), a partir
-- de las referencias en "cambios en imagen".
--
-- La mayoría de los campos que muestran esas capturas ya existían en
-- `pets` (raza, sexo, edad, peso, veterinario, alergias, comportamiento,
-- compatibilidad...). Esto agrega lo que faltaba: entrenamiento en casa,
-- instrucciones de baño/potty, cuánto tiempo puede quedarse sola,
-- microchip, fecha de adopción y aseguradora de la mascota.
-- ============================================================================

alter table public.pets
  add column if not exists house_trained boolean,
  add column if not exists potty_instructions text,
  add column if not exists alone_time_hours text
    check (alone_time_hours in ('0-1h', '1-4h', '4-8h', '8+h')),
  add column if not exists is_microchipped boolean,
  add column if not exists adopted_at date,
  add column if not exists insurance_provider text;
