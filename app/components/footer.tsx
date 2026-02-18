"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  Instagram, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Mail, 
  MapPin 
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-1 border-t border-card-border pt-16 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
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
              منصتك الذكية لتصميم إعلانات احترافية في ثوانٍ. دع بوستاتي يتولى التصميم، وركز أنت على نمو عملك.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://instagram.com/postaty.app" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://x.com/postatyapp" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary transition-colors" aria-label="X (Twitter)">
                <Twitter size={20} />
              </a>
              <a href="https://linkedin.com/company/postaty" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary transition-colors" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="https://facebook.com/postaty.app" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h3 className="font-bold mb-6">المنتج</h3>
            <ul className="space-y-4 text-sm text-muted">
              <li>
                <Link href="/create" className="hover:text-primary transition-colors">
                  صمم الآن
                </Link>
              </li>
              <li>
                <Link href="/templates" className="hover:text-primary transition-colors">
                  القوالب
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-primary transition-colors">
                  الأسعار
                </Link>
              </li>
              <li>
                <Link href="/showcase" className="hover:text-primary transition-colors">
                  أعمالنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h3 className="font-bold mb-6">الشركة</h3>
            <ul className="space-y-4 text-sm text-muted">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  من نحن
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors">
                  المدونة
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-primary transition-colors">
                  وظائف
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  اتصل بنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="font-bold mb-6">تواصل معنا</h3>
            <ul className="space-y-4 text-sm text-muted">
              <li className="flex items-start gap-3">
                <Mail size={18} className="text-primary mt-0.5" />
                <span>hello@postaty.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-primary mt-0.5" />
                <span>الرياض، المملكة العربية السعودية</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-card-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted">
            © {currentYear} Postaty. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              سياسة الخصوصية
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              الشروط والأحكام
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
