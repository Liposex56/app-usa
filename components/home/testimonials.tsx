import { testimonials } from './content';

export function Testimonials() {
  return (
    <section className="pt-[clamp(80px,11.5vw,166px)]">
      <h2 className="mx-auto max-w-[1440px] px-5 text-[clamp(22px,2.5vw,36px)] font-medium uppercase leading-none lg:px-[67px]">
        {testimonials.title}
      </h2>

      <div className="mt-[clamp(24px,3.4vw,49px)] bg-hv-ink">
        <ul className="mx-auto grid max-w-[1440px] gap-1 px-5 py-[22px] md:grid-cols-3 lg:px-[40px]">
          {testimonials.items.map((item, i) => (
            <li
              key={i}
              className="relative flex min-h-[340px] flex-col rounded-[36px] bg-hv-paper p-[clamp(24px,2.3vw,32px)] pt-[clamp(32px,5vw,72px)] md:aspect-[455/437] md:min-h-0"
            >
              {item.quote ? (
                <blockquote className="max-w-[360px] text-[clamp(20px,2.1vw,30px)] font-medium leading-[1.25]">
                  <p>{item.quote}</p>
                  <footer className="mt-0">{item.author}</footer>
                </blockquote>
              ) : (
                <p className="text-[clamp(18px,1.6vw,23px)] font-medium text-hv-ink/30">[testimonio pendiente]</p>
              )}
              {/* Golden circle: place for the photo of the person or their pet */}
              <span className="ml-[40%] mt-auto block aspect-square w-[clamp(90px,8.5vw,122px)] rounded-full bg-hv-mustard" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
