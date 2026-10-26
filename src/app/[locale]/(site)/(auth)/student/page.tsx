import SignUp from "@/app/components/Auth/SignUp/SignUpForm";
import Profile from "@/app/components/Student/profile/ProfileView";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { title: t("studentTitle"), robots: { index: false, follow: false } };
}

const ProfilePage = () => {
  return (
    <>
      {/* <Breadcrumb pageName="Sign Up Page" /> */}

      <Profile />
    </>
  );
};

export default ProfilePage;
