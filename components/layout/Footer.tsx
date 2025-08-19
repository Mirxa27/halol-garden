'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Facebook, Twitter, Linkedin, Instagram, 
  Mail, Phone, MapPin, ArrowRight 
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    products: [
      { name: 'Diagnostic Equipment', href: '/products?category=diagnostic' },
      { name: 'Surgical Instruments', href: '/products?category=surgical' },
      { name: 'Patient Monitoring', href: '/products?category=monitoring' },
      { name: 'Laboratory Equipment', href: '/products?category=laboratory' },
    ],
    services: [
      { name: 'Equipment Rental', href: '/services/rental' },
      { name: 'Maintenance & Repair', href: '/services/maintenance' },
      { name: 'Training Programs', href: '/services/training' },
      { name: 'Consultation', href: '/services/consultation' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Our Team', href: '/team' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press & Media', href: '/press' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Contact Support', href: '/contact' },
      { name: 'Shipping Info', href: '/shipping' },
      { name: 'Returns & Refunds', href: '/returns' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  ];

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t">
      {/* Newsletter Section */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Subscribe to Our Newsletter
              </h3>
              <p className="text-primary-foreground/80">
                Get the latest updates on new products and upcoming sales
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 rounded-md bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/60 border border-primary-foreground/20 focus:outline-none focus:border-primary-foreground/40"
              />
              <Button variant="secondary" className="gap-2">
                Subscribe
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold text-primary">MedMarket</span>
            </Link>
            <p className="text-muted-foreground mb-4">
              Your trusted partner for medical equipment and healthcare solutions in the Middle East.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@medmarket.com</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Dubai, UAE</span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold mb-4">Products</h4>
            <ul className="space-y-2">
              {footerLinks.products.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
              <p>© {currentYear} MedMarket. All rights reserved.</p>
              <div className="flex gap-4">
                <Link href="/privacy" className="hover:text-primary">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-primary">
                  Terms of Service
                </Link>
                <Link href="/cookies" className="hover:text-primary">
                  Cookie Policy
                </Link>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}