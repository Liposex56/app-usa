'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, FormError, Input } from '@/components/ui/field';
import type { SitterInsuranceRow } from '@/lib/database.types';

import { saveInsuranceAction, type InsuranceState } from './actions';

const INITIAL_STATE: InsuranceState = { error: null };

export function InsuranceForm({
  existing,
}: {
  existing: SitterInsuranceRow | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveInsuranceAction,
    INITIAL_STATE
  );

  return (
    <form action={formAction} className="space-y-5" encType="multipart/form-data">
      <FormError message={state.error} />

      <Field label="Aseguradora" htmlFor="provider" required>
        <Input
          id="provider"
          name="provider"
          defaultValue={existing?.provider ?? ''}
          required
        />
      </Field>

      <Field label="Número de póliza" htmlFor="policyNumber" required>
        <Input
          id="policyNumber"
          name="policyNumber"
          defaultValue={existing?.policy_number ?? ''}
          required
        />
      </Field>

      <Field label="Tipo de cobertura" htmlFor="coverageType">
        <Input
          id="coverageType"
          name="coverageType"
          placeholder="Responsabilidad civil, por ejemplo"
          defaultValue={existing?.coverage_type ?? ''}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Vigente desde" htmlFor="effectiveDate">
          <Input
            id="effectiveDate"
            name="effectiveDate"
            type="date"
            defaultValue={existing?.effective_date ?? ''}
          />
        </Field>
        <Field label="Vence" htmlFor="expiresAt" required>
          <Input
            id="expiresAt"
            name="expiresAt"
            type="date"
            defaultValue={existing?.expires_at ?? ''}
            required
          />
        </Field>
      </div>

      <Field
        label="Documento de la póliza"
        htmlFor="document"
        hint="PDF o foto. Es privado — sólo lo revisa el staff de Havenr."
      >
        <Input id="document" name="document" type="file" accept=".pdf,image/*" />
      </Field>

      {existing?.document_path && (
        <p className="text-xs text-espresso-500/70">
          Ya tienes un documento cargado. Sube uno nuevo sólo si quieres
          reemplazarlo.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Enviando…' : 'Enviar para revisión'}
      </Button>
    </form>
  );
}
