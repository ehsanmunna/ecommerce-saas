import Link from 'next/link';

const LINKS: { label: string; href: string }[] = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Shipping & Delivery', href: '/shipping-policy' },
  { label: 'Returns & Refunds', href: '/return-policy' },
];

export function Footer() {
  return (
    <div className="bg-ink flex flex-col items-center gap-8 px-6 py-14 mt-auto">
      <div className="w-full max-w-[1592px] flex items-center justify-between gap-8 flex-wrap">
        <span className="text-base font-bold text-white">Frozen — Trendy &amp; Stylish Outfits for Kids</span>
        <nav className="flex items-center gap-6 flex-wrap">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-[#b2b2b2] hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <span className="text-sm text-[#b2b2b2]">© 2026 Frozen. All rights reserved.</span>
    </div>
  );
}
