import HeroSub from "@/app/components/SharedComponent/HeroSub";
import NotFound from "@/app/components/NotFound";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: false },
};

const ErrorPage = () => {
  return (
    <>
      <HeroSub
        title="404"
      />
      <NotFound />
    </>
  );
};

export default ErrorPage;
