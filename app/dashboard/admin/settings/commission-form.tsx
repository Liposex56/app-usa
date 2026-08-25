'use client';

import { useActionState, useState } from 'react';

import { Field, Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { computeFeeSplit } from '@/lib/payments';
import { formatCents } from '@/lib/utils';

import { updateCommissionAction, type SettingsState } from './actions';

const INITIAL_STATE: SettingsState = { error: null };

export function CommissionForm({
  initialPercent,
  canEdit,
}: {
  initialPercent: number;
  canEdit: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateCommissionAction,
    INITIAL_STATE
  );
  const [percent, setPercent] = useState(initialPercent);
  const [sampleDollars, setSampleDollars] = useState('70');

  const sampleCents = Math.round((Number.parseFloat(sampleDollars) || 0) * 100);
  const split = computeFeeSplit(sampleCents, percent);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        action={formAction}
        className="space-y-4 rounded-2xl border border-espresso-700/10 bg-white p-6"
      >
        <h2 className="font-semibold text-espresso-700">Comisión de la plataforma</h2>
        <Field
          label="Porcentaje para la empresa"
          htmlFor="commissionPercent"
          hint="El resto del valor del servicio se liquida al Havener."
          required
        >
          <Input
            id="commissionPercent"
            name="commissionPercent"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={percent}
            disabled={!canEdit}
            onChange={(e) => setPercent(Number.parseFloat(e.target.value) || 0)}
          />
        </Field>

        {!canEdit && (
          <p className="text-xs text-espresso-500/70">
            Sólo un administrador puede cambiar este valor. Puedes verlo, pero
            no editarlo con tu rol actual.
          </p>
        )}
        {state.error && <p className="text-sm text-red-700">{state.error}</p>}

        <Button type="submit" disabled={!canEdit || pending}>
          {pending ? 'Guardando…' : 'Guardar comisión'}
        </Button>
      </form>

      <div className="space-y-4 rounded-2xl border border-espresso-700/10 bg-white p-6">
        <h2 className="font-semibold text-espresso-700">Simulador de reparto</h2>
        <Field label="Valor del servicio" htmlFor="sampleDollars" hint="En dólares, sólo para previsualizar el reparto.">
          <Input
            id="sampleDollars"
            type="number"
            min={0}
            step="0.01"
            value={sampleDollars}
            onChange={(e) => setSampleDollars(e.target.value)}
          />
        </Field>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-espresso-500">Total pagado por el dueño</dt>
            <dd className="font-medium text-espresso-700">
              {formatCents(split.totalCents)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-espresso-500">
              Comisión de la empresa ({percent}%)
            </dt>
            <dd className="font-medium text-espresso-700">
              {formatCents(split.companyFeeCents)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-espresso-700/10 pt-2">
            <dt className="text-espresso-500">Pago al Havener</dt>
            <dd className="font-semibold text-gold-700">
              {formatCents(split.sitterPayoutCents)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
