import Link from "next/link";

import { LanguageSwitcher } from "@/components/language-switcher";
import type { AppLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { getSessionUser } from "@/server/auth/session";

export async function SiteHeader({ locale }: { locale: AppLocale }) {
  const user = await getSessionUser();
  const zhCN = getMessages(locale);
  const prefix = `/${locale}`;

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="brand-link" href={prefix}>
          <span>{zhCN.brand.name}</span>
          <small>{zhCN.brand.shortDescription}</small>
        </Link>
        <nav aria-label={zhCN.navigation.ariaLabel} className="site-nav">
          {user && (
            <>
              <Link href={prefix}>{zhCN.navigation.overview}</Link>
              <Link href={`${prefix}/today`}>{zhCN.navigation.today}</Link>
              <Link href={`${prefix}/history`}>{zhCN.navigation.history}</Link>
              <details className="site-nav-dropdown">
                <summary>{zhCN.navigation.insights}</summary>
                <div>
                  <Link href={`${prefix}/trends`}>
                    {zhCN.navigation.trends}
                  </Link>
                  <Link href={`${prefix}/long-term`}>
                    {zhCN.navigation.longTerm}
                  </Link>
                </div>
              </details>
              <Link href={`${prefix}/plans`}>{zhCN.navigation.plans}</Link>
              <Link href={`${prefix}/settings`}>
                {zhCN.navigation.settings}
              </Link>
            </>
          )}
          {!user && <Link href={`${prefix}/demo`}>{zhCN.navigation.demo}</Link>}
          <Link href={`${prefix}/product-boundary`}>
            {zhCN.navigation.productBoundary}
          </Link>
          <Link href={`${prefix}/safety`}>{zhCN.navigation.safety}</Link>
          {!user && (
            <Link href={`${prefix}/login`}>{zhCN.navigation.login}</Link>
          )}
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
