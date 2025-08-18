'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Send,
} from 'lucide-react';

export function Footer() {
  const { t, language } = useLanguage();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: t.footer.about, href: '/about' },
      { name: t.footer.careers, href: '/careers' },
      { name: t.footer.press, href: '/press' },
      { name: t.footer.investors, href: '/investors' },
      { name: t.footer.partners, href: '/partners' },
    ],
    support: [
      { name: t.footer.help, href: '/help' },
      { name: t.footer.contact, href: '/contact' },
      { name: t.common.services, href: '/services' },
      { name: 'FAQ', href: '/faq' },
      { name: t.footer.sitemap, href: '/sitemap' },
    ],
    legal: [
      { name: t.footer.terms, href: '/terms' },
      { name: t.footer.privacy, href: '/privacy' },
      { name: t.footer.cookies, href: '/cookies' },
      { name: 'Compliance', href: '/compliance' },
      { name: 'Security', href: '/security' },
    ],
    categories: [
      { name: t.categories.diagnostic, href: '/products?category=diagnostic' },
      { name: t.categories.surgical, href: '/products?category=surgical' },
      { name: t.categories.monitoring, href: '/products?category=monitoring' },
      { name: t.categories.laboratory, href: '/products?category=laboratory' },
      { name: t.categories.emergency, href: '/products?category=emergency' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
  ];

  return (
    <footer className="bg-muted/50 border-t">
      {/* Newsletter Section */}
      <div className="bg-primary/5 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">{t.footer.newsletter}</h3>
            <p className="text-muted-foreground mb-6">
              Stay updated with the latest medical equipment and exclusive offers
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder={t.footer.emailPlaceholder}
                className="flex-1"
              />
              <Button type="submit" className="gap-2">
                <Send className="h-4 w-4" />
                {t.footer.subscribe}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="Medical Devices"
                width={40}
                height={40}
                className="h-10 w-10"
              />
              <span className="text-xl font-bold">Medical Devices</span>
            </Link>
            <p className="text-muted-foreground mb-4">
              Your trusted partner for premium medical equipment and healthcare solutions
              in the Middle East.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2">
              <a
                href="tel:+1234567890"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                <Phone className="h-4 w-4" />
                +1 (234) 567-890
              </a>
              <a
                href="mailto:info@medical-devices.com"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                <Mail className="h-4 w-4" />
                info@medical-devices.com
              </a>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>
                  123 Medical Plaza, Healthcare District<br />
                  Dubai, UAE 12345
                </span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-2 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="p-2 rounded-lg bg-background hover:bg-primary/10 transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              {footerLinks.categories.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            {t.footer.copyright.replace('2024', currentYear.toString())}
          </p>
          
          {/* Payment Methods */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Secure Payments:</span>
            <div className="flex gap-2">
              <Image
                src="/images/payments/visa.svg"
                alt="Visa"
                width={40}
                height={24}
                className="h-6 w-auto"
              />
              <Image
                src="/images/payments/mastercard.svg"
                alt="Mastercard"
                width={40}
                height={24}
                className="h-6 w-auto"
              />
              <Image
                src="/images/payments/paypal.svg"
                alt="PayPal"
                width={40}
                height={24}
                className="h-6 w-auto"
              />
              <Image
                src="/images/payments/myfatoorah.svg"
                alt="MyFatoorah"
                width={40}
                height={24}
                className="h-6 w-auto"
              />
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-8 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Image
              src="/images/certifications/iso.svg"
              alt="ISO Certified"
              width={60}
              height={40}
              className="h-10 w-auto"
            />
            <span>ISO 13485:2016</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Image
              src="/images/certifications/ce.svg"
              alt="CE Marked"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <span>CE Marked</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Image
              src="/images/certifications/fda.svg"
              alt="FDA Approved"
              width={60}
              height={40}
              className="h-10 w-auto"
            />
            <span>FDA Approved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}