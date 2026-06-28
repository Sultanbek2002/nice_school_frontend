import Link from "next/link";
import Image from "next/image"; 

const Logo: React.FC = () => {
  return (
    <Link href="/" className="inline-flex items-center select-none">
      <Image
        src="/images/logo/logo.svg"
        alt="logo"
        width={160}
        height={50}
        // style={{ width: "auto", height: "auto" }}
        quality={100}
      />
     
      
    </Link>
  );
};

export default Logo;
