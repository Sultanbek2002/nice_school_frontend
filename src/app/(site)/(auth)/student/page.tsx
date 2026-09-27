import SignUp from "@/app/components/Auth/SignUp/page";
import Profile from "@/app/components/Student/profile/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Личный кабинет ученика",
  robots: { index: false, follow: false },
};

const ProfilePage = () => {
  return (
    <>
      {/* <Breadcrumb pageName="Sign Up Page" /> */}

      <Profile />
    </>
  );
};

export default ProfilePage;
