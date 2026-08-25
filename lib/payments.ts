/**
 * Reparto de pago entre la empresa y el Havener (propuesta, sección 13.1):
 * el dueño paga el total, la empresa retiene su comisión y liquida el resto
 * al cuidador. Esto sólo calcula el reparto — no mueve dinero. Conectar una
 * pasarela real (Stripe Connect u otra) es un paso posterior que requiere
 * cuenta empresarial con el proveedor.
 */

import type { PlatformSettingsRow } from '@/lib/database.types';

export type FeeSplit = {
  /** Lo que paga el dueño por el servicio, en centavos. */
  totalCents: number;
  /** Porcentaje de comisión aplicado. */
  commissionPercent: number;
  /** Lo que retiene la empresa, en centavos. */
  companyFeeCents: number;
  /** Lo que recibe el Havener, en centavos. */
  sitterPayoutCents: number;
};

export const DEFAULT_COMMISSION_PERCENT = 20;

/** Redondea al centavo más cercano — nunca trabajar el dinero en float. */
export function computeFeeSplit(
  totalCents: number,
  commissionPercent: number
): FeeSplit {
  const companyFeeCents = Math.round((totalCents * commissionPercent) / 100);
  return {
    totalCents,
    commissionPercent,
    companyFeeCents,
    sitterPayoutCents: totalCents - companyFeeCents,
  };
}

export function commissionPercentFromSettings(
  settings: Pick<PlatformSettingsRow, 'company_commission_percent'> | null
): number {
  return settings?.company_commission_percent ?? DEFAULT_COMMISSION_PERCENT;
}
