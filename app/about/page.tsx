import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Halol Garden - Your trusted medical equipment marketplace',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">About Halol Garden</h1>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              At Halol Garden, we are dedicated to revolutionizing the medical equipment industry by 
              providing a comprehensive marketplace that connects healthcare providers with trusted 
              suppliers of high-quality medical devices and equipment.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our platform ensures that healthcare facilities have access to the latest medical 
              technologies, enabling them to provide the best possible care to their patients.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Quality Assurance</h3>
                <p className="text-gray-700">
                  We partner only with certified suppliers who meet international quality standards.
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Trust & Transparency</h3>
                <p className="text-gray-700">
                  Building trust through transparent transactions and verified supplier credentials.
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Innovation</h3>
                <p className="text-gray-700">
                  Continuously improving our platform to meet the evolving needs of healthcare.
                </p>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Customer Focus</h3>
                <p className="text-gray-700">
                  Dedicated support team ensuring exceptional service for all our users.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6">Our Team</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our diverse team of healthcare professionals, technology experts, and business 
              specialists work together to create the best possible experience for our users.
            </p>
            <p className="text-gray-700 leading-relaxed">
              With years of combined experience in the medical industry, we understand the unique 
              challenges faced by healthcare providers and are committed to providing solutions 
              that make a real difference.
            </p>
          </section>

          <section className="bg-gray-100 p-8 rounded-lg">
            <h2 className="text-3xl font-semibold mb-6 text-center">Contact Us</h2>
            <div className="text-center">
              <p className="text-gray-700 mb-2">Have questions or want to learn more?</p>
              <p className="text-gray-700 mb-4">We're here to help!</p>
              <a 
                href="/contact" 
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get in Touch
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}