import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Wrench, 
  Package, 
  Users, 
  Shield, 
  Globe,
  Heart,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { Button } from '../client/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../client/components/ui/card';

export default function Home() {
  return (
    <>
      <Head>
        <title>Medical Devices Marketplace - Your Trusted Healthcare Equipment Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Navigation */}
        <nav className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <Link href="/" className="flex items-center space-x-2">
                  <Heart className="h-8 w-8 text-blue-600" />
                  <span className="font-bold text-xl">MedMarket</span>
                </Link>
                <div className="hidden md:flex space-x-6">
                  <Link href="/products" className="text-gray-700 hover:text-blue-600">Products</Link>
                  <Link href="/rentals" className="text-gray-700 hover:text-blue-600">Rentals</Link>
                  <Link href="/maintenance" className="text-gray-700 hover:text-blue-600">Maintenance</Link>
                  <Link href="/about" className="text-gray-700 hover:text-blue-600">About</Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Your Complete Medical Equipment
              <span className="text-blue-600"> Marketplace</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Connect with trusted suppliers, rent equipment on-demand, and access professional maintenance services - all in one platform designed for the Arabic-speaking healthcare market.
            </p>
            <div className="flex justify-center space-x-4">
              <Button size="lg" asChild>
                <Link href="/auth/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/demo">Watch Demo</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need in One Platform</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <ShoppingCart className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Equipment Sales</CardTitle>
                <CardDescription>
                  Browse and purchase from a vast catalog of medical devices from verified suppliers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Competitive pricing</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Quality guaranteed</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Fast delivery</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Package className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Equipment Rental</CardTitle>
                <CardDescription>
                  Flexible rental options for temporary needs without large capital investments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Daily, weekly, monthly rates</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Maintenance included</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">24/7 support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Wrench className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Maintenance Services</CardTitle>
                <CardDescription>
                  Professional maintenance and repair services by certified engineers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Preventive maintenance</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Emergency repairs</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Service contracts</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Multi-User Platform</CardTitle>
                <CardDescription>
                  Tailored experiences for healthcare providers, suppliers, and service engineers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Role-based dashboards</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Team collaboration</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Secure messaging</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Secure & Compliant</CardTitle>
                <CardDescription>
                  Enterprise-grade security with healthcare compliance standards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Data encryption</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">HIPAA compliant</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Regular audits</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Arabic Language Support</CardTitle>
                <CardDescription>
                  Full Arabic interface with RTL support for seamless user experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Native Arabic UI</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Bilingual support</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Local payment methods</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-blue-600 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">10,000+</div>
                <div className="text-blue-100">Medical Products</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-blue-100">Healthcare Providers</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">100+</div>
                <div className="text-blue-100">Verified Suppliers</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">24/7</div>
                <div className="text-blue-100">Customer Support</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Medical Equipment Management?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of healthcare providers who trust our platform
            </p>
            <div className="flex justify-center space-x-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/auth/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-blue-600" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Heart className="h-8 w-8 text-blue-400" />
                  <span className="font-bold text-xl">MedMarket</span>
                </div>
                <p className="text-gray-400">
                  Your trusted medical devices marketplace for the Arabic-speaking healthcare market.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Platform</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/products" className="hover:text-white">Products</Link></li>
                  <li><Link href="/rentals" className="hover:text-white">Rentals</Link></li>
                  <li><Link href="/maintenance" className="hover:text-white">Maintenance</Link></li>
                  <li><Link href="/suppliers" className="hover:text-white">Suppliers</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                  <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                  <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                  <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                  <li><Link href="/compliance" className="hover:text-white">Compliance</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 Medical Devices Marketplace. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  // You can fetch initial data here if needed
  return {
    props: {},
  };
};