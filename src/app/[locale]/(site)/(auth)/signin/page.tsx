import Signin from "@/app/components/Auth/SignIn/Signin";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { title: t("signinTitle"), robots: { index: false, follow: false } };
}

const SigninPage = () => {
  return (
    <>
      

      <Signin />
    </>
  );
};

export default SigninPage;
