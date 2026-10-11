import { faq } from './content';

export function Faq() {
  return (
    <section id="faq" className="px-5 pt-[clamp(64px,7vw,100px)]">
      <h2 className="hv-display text-center text-[clamp(56px,7.6vw,109px)] leading-[0.9]">{faq.title}</h2>
      <p className="mt-4 text-center text-[clamp(20px,2.3vw,33px)] font-medium uppercase leading-none text-hv-mustard">
        {faq.subtitle}
      </p>

      {/* Collapsible questions. To add more, add items in content.ts */}
      <div className="mx-auto mt-[clamp(32px,4.4vw,64px)] max-w-[794px] divide-y divide-hv-ink/10">
        {faq.items.map((item, i) => (
          <details key={item.q} className="group py-3" open={i === 0}>
            <summary className="cursor-pointer list-none text-center text-[clamp(20px,2.25vw,32px)] font-medium leading-tight [&::-webkit-details-marker]:hidden">
              {item.q}
            </summary>
            <p className="mt-4 text-[clamp(18px,2.3vw,33px)] font-medium leading-[1.12]">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
