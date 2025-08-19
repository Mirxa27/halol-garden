/**
 * Home Page - Landing Page
 * Main entry point for the Medical Devices Marketplace
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShieldCheck, Truck, Clock, Users, 
  Package, Wrench, Heart, Star,
  ArrowRight, CheckCircle, Globe, Phone
} from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { ProductCard } from '@/components/ProductCard';

import { getTranslations } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Medical Devices Marketplace - Premium Healthcare Equipment',
  description: 'Leading marketplace for medical devices in the Middle East. Find diagnostic, surgical, and therapeutic equipment from verified suppliers.',
  keywords: 'medical devices, healthcare equipment, medical supplies, hospital equipment',
};

export default async function HomePage() {
  const t = await getTranslations();

  // Mock data - would come from API
  const featuredProducts = [
    {
      id: '1',
      name: 'MRI Scanner ProMax',
      nameAr: 'جهاز الرنين المغناطيسي بروماكس',
      price: 450000,
      image: '/images/products/mri-scanner.jpg',
      category: 'DIAGNOSTIC',
      rating: 4.8,
      supplier: 'MedTech Solutions',
    },
    {
      id: '2',
      name: 'Surgical Robot System',
      nameAr: 'نظام الروبوت الجراحي',
      price: 850000,
      image: '/images/products/surgical-robot.jpg',
      category: 'SURGICAL',
      rating: 4.9,
      supplier: 'Advanced Medical Systems',
    },
    {
      id: '3',
      name: 'Patient Monitor X500',
      nameAr: 'جهاز مراقبة المريض X500',
      price: 12000,
      image: '/images/products/patient-monitor.jpg',
      category: 'MONITORING',
      rating: 4.7,
      supplier: 'HealthCare Innovations',
    },
  ];

  const categories = [
    { id: 'diagnostic', name: t.categories.diagnostic, icon: '🔬', count: 1250 },
    { id: 'surgical', name: t.categories.surgical, icon: '⚕️', count: 890 },
    { id: 'monitoring', name: t.categories.monitoring, icon: '📊', count: 650 },
    { id: 'therapeutic', name: t.categories.therapeutic, icon: '💊', count: 430 },
    { id: 'laboratory', name: t.categories.laboratory, icon: '🧪', count: 780 },
    { id: 'emergency', name: t.categories.emergency, icon: '🚑', count: 320 },
  ];

  const stats = [
    { label: t.stats.suppliers, value: '500+', icon: Users },
    { label: t.stats.products, value: '10,000+', icon: Package },
    { label: t.stats.hospitals, value: '1,200+', icon: Heart },
    { label: t.stats.countries, value: '15+', icon: Globe },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white">
                  {t.hero.title}
                  <span className="block text-blue-600 dark:text-blue-400">
                    {t.hero.subtitle}
                  </span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  {t.hero.description}
                </p>
              </div>

              <SearchBar placeholder={t.search.placeholder} />

              <div className="flex flex-wrap gap-4">
                <Link href="/products">
                  <Button size="lg" className="gap-2">
                    {t.buttons.browseProducts}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/register?type=supplier">
                  <Button size="lg" variant="outline" className="gap-2">
                    {t.buttons.becomeSupplier}
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                {[
                  { icon: ShieldCheck, text: t.features.verified },
                  { icon: Truck, text: t.features.fastDelivery },
                  { icon: Clock, text: t.features.support247 },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <item.icon className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-3xl opacity-20"></div>
              <Image
                src="/images/hero-medical.jpg"
                alt="Medical Equipment"
                width={600}
                height={600}
                className="relative rounded-3xl shadow-2xl"
                priority
              />
              
              {/* Floating Stats */}
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">4.9/5</p>
                    <p className="text-sm text-gray-500">{t.ratings.average}</p>
                  </div>
                </div>
              </div>

              <div className="absolute -top-6 -right-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">98%</p>
                    <p className="text-sm text-gray-500">{t.ratings.satisfaction}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-800 border-y dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t.sections.categories}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t.sections.categoriesDescription}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link key={category.id} href={`/products?category=${category.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{category.icon}</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {category.count} {t.common.products}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {t.sections.featuredProducts}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t.sections.featuredDescription}
              </p>
            </div>
            <Link href="/products">
              <Button variant="outline" className="gap-2">
                {t.buttons.viewAll}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t.sections.howItWorks}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t.sections.howItWorksDescription}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: t.steps.search.title,
                description: t.steps.search.description,
                icon: '🔍',
              },
              {
                step: '2',
                title: t.steps.compare.title,
                description: t.steps.compare.description,
                icon: '⚖️',
              },
              {
                step: '3',
                title: t.steps.purchase.title,
                description: t.steps.purchase.description,
                icon: '🛒',
              },
            ].map((item, index) => (
              <Card key={index} className="relative">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center text-2xl mb-4">
                    {item.icon}
                  </div>
                  <div className="absolute top-4 right-4 text-6xl font-bold text-gray-100 dark:text-gray-700">
                    {item.step}
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t.sections.services}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t.sections.servicesDescription}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Package,
                title: t.services.procurement.title,
                description: t.services.procurement.description,
              },
              {
                icon: Wrench,
                title: t.services.maintenance.title,
                description: t.services.maintenance.description,
              },
              {
                icon: Users,
                title: t.services.training.title,
                description: t.services.training.description,
              },
              {
                icon: Phone,
                title: t.services.support.title,
                description: t.services.support.description,
              },
            ].map((service, index) => (
              <Card key={index}>
                <CardHeader>
                  <service.icon className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{service.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            {t.cta.title}
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {t.cta.description}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                {t.buttons.getStarted}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white/20">
                {t.buttons.contactSales}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}