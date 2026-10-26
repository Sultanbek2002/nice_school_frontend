import SignUp from "@/app/components/Auth/SignUp/SignUpForm";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { title: t("signupTitle"), robots: { index: false, follow: false } };
}

const SignupPage = () => {
  return (
    <>
      {/* <Breadcrumb pageName="Sign Up Page" /> */}

      <SignUp />
    </>
  );
};

export default SignupPage;
