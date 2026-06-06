import { RootProvider } from "fumadocs-ui/provider/next";
import { i18nProvider } from "fumadocs-ui/i18n";
import { getSiteLanguage } from "@/lib/locale";
import "./global.css";
import "katex/dist/katex.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

const siteLanguage = getSiteLanguage();

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang={siteLanguage.htmlLang} className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider i18n={i18nProvider(siteLanguage.translations)}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
