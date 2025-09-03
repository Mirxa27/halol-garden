import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Medical equipment services including maintenance, repair, and support',
};

export default function ServicesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Our Services</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Equipment Maintenance</h2>
          <p className="text-gray-600">
            Professional maintenance services for all medical equipment to ensure optimal performance and longevity.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Repair Services</h2>
          <p className="text-gray-600">
            Quick and reliable repair services by certified technicians for all types of medical devices.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Technical Support</h2>
          <p className="text-gray-600">
            24/7 technical support to help you with any issues or questions about your medical equipment.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Equipment Rental</h2>
          <p className="text-gray-600">
            Flexible rental options for medical equipment to meet your temporary or long-term needs.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Installation & Setup</h2>
          <p className="text-gray-600">
            Professional installation and setup services to ensure your equipment is properly configured.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Training Programs</h2>
          <p className="text-gray-600">
            Comprehensive training programs for healthcare staff on proper equipment usage and safety.
          </p>
        </div>
      </div>
    </div>
  );
}