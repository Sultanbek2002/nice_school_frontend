import Link from "next/link";

const Logo: React.FC = () => {
  return (
    <Link href="/" className="inline-flex items-center select-none">
      {/* Векторный логотип «nice Global» (знак школы на месте «g»). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logo/logo-full.svg"
        alt="nice Global"
        width={180}
        height={36}
        className="h-8 w-auto sm:h-9"
      />
    </Link>
  );
};

export default Logo;
