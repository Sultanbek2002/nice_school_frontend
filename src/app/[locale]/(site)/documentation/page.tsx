
import { Documentation } from "@/app/components/Documentation/Documentation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { title: t("documentationTitle"), robots: { index: false, follow: false } };
}

export default function Page() {
    return (
        <>
        <Documentation/>
        </>
    );
};
