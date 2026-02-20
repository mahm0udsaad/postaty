"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Mail,
  MapPin,
} from "lucide-react";
import type { AppLocale } from "@/lib/i18n";

const COPY = {
  ar: {
    description:
      "منصتك الذكية لتصميم إعلانات احترافية في ثوانٍ. دع بوستاتي يتولى التصميم، وركز أنت على نمو عملك.",
    product: "المنتج",
    company: "الشركة",
    contact: "تواصل معنا",
    createNow: "صمم الآن",
    pricing: "الأسعار",
    showcase: "أعمالنا",
    about: "من نحن",
    blog: "المدونة",
    contactUs: "اتصل بنا",
    location: "دبي، الإمارات العربية المتحدة",
    rights: "جميع الحقوق محفوظة.",
    privacy: "سياسة الخصوصية",
    terms: "الشروط والأحكام",
  },
  en: {
    description:
      "Your smart platform to create professional ads in seconds. Let Postaty handle design while you focus on growing your business.",
    product: "Product",
    company: "Company",
    contact: "Contact",
    createNow: "Create Now",
    pricing: "Pricing",
    showcase: "Showcase",
    about: "About",
    blog: "Blog",
    contactUs: "Contact Us",
    location: "Dubai, United Arab Emirates",
    rights: "All rights reserved.",
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
  },
} as const;

type FooterProps = {
  locale: AppLocale;
};

export function Footer({ locale }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const copy = COPY[locale];

  return (
    <footer className="bg-surface-1 border-t border-card-border pt-16 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative size-24 transition-transform duration-300 group-hover:rotate-12">
                <Image
                  src="/name_logo_svg.svg"
                  alt="Postaty Symbol"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              {copy.description}
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-6">{copy.product}</h3>
            <ul className="space-y-4 text-sm text-muted">
              <li>
                <Link href="/create" className="hover:text-primary transition-colors">
                  {copy.createNow}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition-colors">
                  {copy.pricing}
                </Link>
              </li>
              <li>
                <Link href="/showcase" className="hover:text-primary transition-colors">
                  {copy.showcase}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-6">{copy.company}</h3>
            <ul className="space-y-4 text-sm text-muted">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  {copy.about}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors">
                  {copy.blog}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  {copy.contactUs}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-6">{copy.contact}</h3>
            <ul className="space-y-4 text-sm text-muted">
              <li className="flex items-start gap-3">
                <Mail size={18} className="text-primary mt-0.5" />
                <span>hello@postaty.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-primary mt-0.5" />
                <span>{copy.location}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-card-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted">
            © {currentYear} Postaty. {copy.rights}
          </p>
          <div className="flex items-center gap-6 text-sm text-muted">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              {copy.privacy}
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              {copy.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
