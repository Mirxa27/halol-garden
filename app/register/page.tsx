import { Suspense } from 'react';
import RegisterForm from './RegisterForm';

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}

export const metadata = {
  title: 'Register - Medical Devices Marketplace',
  description: 'Create your account as a healthcare provider or equipment supplier',
};