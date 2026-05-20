import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  DM_Sans,
  Inter,
  Open_Sans,
  Plus_Jakarta_Sans,
  Roboto,
} from "next/font/google";
import { BrandingProvider } from "@/contexts/branding-context";
import { getAppSettings } from "@/lib/branding/get-app-settings";
import { buildCustomThemeCss } from "@/lib/theme/presets";
import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { VersionGuard } from "@/components/system/version-guard";
import "../globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const fontVariables = [
  inter.variable,
  roboto.variable,
  openSans.variable,
  dmSans.variable,
  plusJakarta.variable,
].join(" ");

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAppSettings();
  const icon = settings.logoUrl ?? siteConfig.logo;

  return {
    title: settings.appName,
    description: siteConfig.description,
    icons: {
      icon,
      apple: icon,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "ar")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const branding = await getAppSettings();
  const customThemeCss = !branding.theme.isPreset
    ? buildCustomThemeCss(
        branding.theme.themeId,
        branding.theme.lightTokens,
        branding.theme.darkTokens,
      )
    : null;

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
      data-theme={branding.themeId}
      data-font={branding.fontFamily}
      className={`${fontVariables} h-full`}
    >
      <body className="min-h-full font-sans antialiased">
        {customThemeCss ? (
          <style dangerouslySetInnerHTML={{ __html: customThemeCss }} />
        ) : null}
        <ThemeProvider>
          <BrandingProvider value={branding}>
            <NextIntlClientProvider messages={messages}>
              <QueryProvider>
                <TooltipProvider>
                  {children}
                  <VersionGuard />
                  <Toaster richColors position="top-center" />
                </TooltipProvider>
              </QueryProvider>
            </NextIntlClientProvider>
          </BrandingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
