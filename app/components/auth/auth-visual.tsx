import Image from "next/image";

const showcaseImages = [
  { src: "/showcase/burger-stack.jpeg", alt: "Burger ad design" },
  { src: "/showcase/chicken-offer.jpeg", alt: "Chicken offer ad design" },
  { src: "/showcase/book-promo.jpeg", alt: "Book promo ad design" },
  { src: "/showcase/supermarket-fruits.jpeg", alt: "Supermarket fruits ad design" },
];

export function AuthVisual() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-surface-2">
      {/* Gradient orbs */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/15 rounded-full blur-[80px] pointer-events-none -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/15 rounded-full blur-[80px] pointer-events-none translate-y-1/3 -translate-x-1/3" />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

      {/* Collage grid */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="grid grid-cols-2 gap-4 w-full max-w-md rotate-3">
          {showcaseImages.map((img, idx) => (
            <div
              key={idx}
              className={`relative aspect-[4/5] rounded-2xl overflow-hidden shadow-xl border border-white/10 ${
                idx % 2 === 1 ? "translate-y-6" : ""
              }`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 0vw, 200px"
                priority={idx < 2}
              />
              <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
