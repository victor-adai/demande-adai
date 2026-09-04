"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "fa-table-cells-large" },
  { href: "/admin/demandes", label: "Demandes", icon: "fa-inbox" },
  { href: "/admin/catalogue", label: "Catalogue", icon: "fa-book" },
  { href: "/admin/parametres", label: "Paramètres", icon: "fa-gear" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="admin-sidebar">
      <div className="brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/adai-logo.png" alt="" className="brand-mark" />
        <span className="brand-text">ΛDΛI</span>
      </div>
      <nav className="admin-nav" aria-label="Navigation admin">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} data-active={active} aria-current={active ? "page" : undefined}>
              <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
              <span className="label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="admin-sidebar-footer">
        <span className="admin-email">{session?.user?.email ?? ""}</span>
        <button className="admin-logout" onClick={() => signOut({ callbackUrl: "/admin/login" })}>
          <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
