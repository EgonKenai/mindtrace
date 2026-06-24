import Link from "next/link";

import { zhCN } from "@/i18n/messages/zh-CN";
import { getSessionUser } from "@/server/auth/session";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="brand-link" href="/zh-CN">
          <span>{zhCN.brand.name}</span>
          <small>{zhCN.brand.shortDescription}</small>
        </Link>
        <nav aria-label={zhCN.navigation.ariaLabel} className="site-nav">
          {user && (
            <>
              <Link href="/zh-CN/today">{zhCN.navigation.today}</Link>
              <Link href="/zh-CN/history">{zhCN.navigation.history}</Link>
              <Link href="/zh-CN/settings">{zhCN.navigation.settings}</Link>
            </>
          )}
          <Link href="/zh-CN/product-boundary">
            {zhCN.navigation.productBoundary}
          </Link>
          <Link href="/zh-CN/safety">{zhCN.navigation.safety}</Link>
        </nav>
      </div>
    </header>
  );
}
