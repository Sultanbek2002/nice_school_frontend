
import { Documentation } from "@/app/components/Documentation/Documentation";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Документация",
  robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <>
        <Documentation/>
        </>
    );
};
