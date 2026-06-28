import Signin from "@/app/components/Auth/SignIn/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Sign In | Property",
};

const SigninPage = () => {
  return (
    <>
      

      <Signin />
    </>
  );
};

export default SigninPage;
