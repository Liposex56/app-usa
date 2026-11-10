/** Jessica's wording for each cancellation policy, shown wherever one is chosen or applies. */
export const CANCELLATION_POLICY_TEXT: Array<{ value: string; label: string; text: string }> = [
  {
    value: 'same_day',
    label: 'Same Day',
    text: 'Clients get a full refund if they cancel before the stay starts. After the stay starts, they get a 50% refund on the first 7 cancelled days and 100% refund on any days after that.',
  },
  {
    value: 'one_day',
    label: 'One Day',
    text: 'Clients get a full refund if they cancel by noon the day before the stay starts. After that, they get a 50% refund on the first 7 cancelled days and 100% refund on any days after that.',
  },
  {
    value: 'three_day',
    label: 'Three Day',
    text: 'Clients get a full refund if they cancel by noon 3 days before the stay starts. After that, they get a 50% refund on the first 7 cancelled days and 100% refund on any days after that.',
  },
  {
    value: 'seven_day',
    label: 'Seven Day',
    text: 'Clients get a full refund if they cancel by noon one week before the stay starts. After that, they get a 50% refund on the first 7 cancelled days and 100% refund on any days after that.',
  },
];

/** A "what do these mean?" link that opens the four policies in place. */
export function CancellationPoliciesHelp() {
  return (
    <details className="rounded-2xl border border-espresso-700/10 bg-bone p-4">
      <summary className="cursor-pointer text-sm font-semibold text-espresso-700 underline underline-offset-2">
        What does each cancellation policy mean?
      </summary>
      <div className="mt-3 space-y-3">
        <p className="text-sm font-semibold text-espresso-700">Cancellation policies</p>
        {CANCELLATION_POLICY_TEXT.map((policy) => (
          <div key={policy.value}>
            <p className="text-sm font-semibold text-espresso-700">{policy.label}</p>
            <p className="text-sm leading-relaxed text-espresso-600">{policy.text}</p>
          </div>
        ))}
      </div>
    </details>
  );
}
