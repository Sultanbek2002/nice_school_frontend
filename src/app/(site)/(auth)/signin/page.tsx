import Signin from "@/app/components/Auth/SignIn/Signin";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вход",
  robots: { index: false, follow: false },
};

const SigninPage = () => {
  return (
    <>
      

      <Signin />
    </>
  );
};

export default SigninPage;
