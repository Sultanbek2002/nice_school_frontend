import { Poppins } from 'next/font/google'
import './globals.css'
import Header from '@/app/components/Layout/Header'
import Footer from '@/app/components/Layout/Footer'
import { getSiteStructure } from '@/utils/apiData'
const font = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let navLinks: { label: string; href: string }[] = [];
  let schoolInfo = null;
  let bannerData = null;
  try {
    const response = await getSiteStructure(); // Теперь возвращает ApiResponse
    if (response) {
      // 1. Навигация
      if (Array.isArray(response.structure)) {
        navLinks = response.structure
          .sort((a: any, b: any) => a.order - b.order)
          .map((item: any) => ({
            label: item.name,
            href: item.link
          }));
      }

      // 2. Данные школы и Баннер
      schoolInfo = response.school_info;
      bannerData = response.banner;
    }

  } catch (error) {
    console.error("Ошибка при загрузке данных в layout:", error);
  }

  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${font.className}`}>
        {/* Передаем контакты в Header, если там нужен телефон */}
        <Header navData={navLinks} contactData={schoolInfo} />

        <main className="pt-20">
          {/* ВАЖНО: Children — это твои страницы (page.tsx). 
             Данные баннера лучше получать прямо в app/page.tsx (главная), 
             так как layout не может напрямую прокинуть props в children.
          */}
          {children}
        </main>

        {/* Передаем всю информацию в Footer */}
        <Footer data={schoolInfo} />
      </body>
    </html>
  )
}