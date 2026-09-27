import SignUp from "@/app/components/Auth/SignUp/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Регистрация",
  robots: { index: false, follow: false },
};

const SignupPage = () => {
  return (
    <>
      {/* <Breadcrumb pageName="Sign Up Page" /> */}

      <SignUp />
    </>
  );
};

export default SignupPage;
