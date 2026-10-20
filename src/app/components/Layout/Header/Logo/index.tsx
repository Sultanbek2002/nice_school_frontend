import Link from "next/link";
import Image from "next/image";

const Logo: React.FC = () => {
  return (
    <Link href="/" className="inline-flex items-center gap-2 select-none">
      <Image
        src="/images/logo/logo-mark.png"
        alt="Nice School"
        width={40}
        height={62}
        className="h-10 w-auto"
        quality={100}
      />
      <span className="font-[family-name:var(--font-heading)] text-lg font-bold leading-none text-midnight_text sm:text-xl">
        Nice <span className="text-primary">School</span>
      </span>
    </Link>
  );
};

export default Logo;
