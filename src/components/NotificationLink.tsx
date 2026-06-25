"use client";

import Link from "next/link";

type Props = {
  href?: string;
  className?: string;
  children: React.ReactNode;
};

/** Link interno (`/…`) ou URL absoluta. */
export function NotificationLink({ href, className, children }: Props) {
  if (!href || href.trim() === "") {
    return <span className={className}>{children}</span>;
  }
  const h = href.trim();
  if (/^https?:\/\//i.test(h)) {
    return (
      <a href={h} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  const path = h.startsWith("/") ? h : `/${h}`;
  return (
    <Link href={path} className={className}>
      {children}
    </Link>
  );
}
