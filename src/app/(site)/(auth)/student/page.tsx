import SignUp from "@/app/components/Auth/SignUp/page";
import Profile from "@/app/components/Student/profile/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Sign Up | Property",
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
