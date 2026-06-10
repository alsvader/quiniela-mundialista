/**
 * Bandera de país (design.md D10). SVGs locales en public/flags/ (flag-icons,
 * MIT). DESIGN.md: ligera desaturación hasta hover — el contenedor que quiera
 * ese efecto debe llevar la clase `group`. Sin código → no se renderiza nada
 * (eliminatorias "por definir" en V2).
 */
export function TeamFlag({ code }: { code: string | null }) {
  if (!code) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG local diminuto; next/image no aporta aquí
    <img
      src={`/flags/${code}.svg`}
      alt=""
      aria-hidden
      width={20}
      height={15}
      loading="lazy"
      className="inline-block h-[15px] w-5 shrink-0 rounded-[2px] object-cover saturate-75 transition-[filter] duration-200 ease-(--ease-out-quart) group-hover:saturate-100"
    />
  );
}
