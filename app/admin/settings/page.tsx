'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  RefreshCw, 
  Settings, 
  Globe, 
  CreditCard, 
  Mail, 
  Shield, 
  Package,
  Users,
  Zap
} from 'lucide-react';

// Form schemas for different setting categories
const generalSettingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  siteDescription: z.string().min(1, 'Site description is required'),
  contactEmail: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
});

const commerceSettingsSchema = z.object({
  defaultCurrency: z.string().min(1, 'Currency is required'),
  taxRate: z.number().min(0).max(100),
  freeShippingThreshold: z.number().min(0),
  defaultShippingCost: z.number().min(0),
});

const paymentSettingsSchema = z.object({
  stripeEnabled: z.boolean(),
  myfatoorahEnabled: z.boolean(),
  codEnabled: z.boolean(),
  bankTransferEnabled: z.boolean(),
});

interface SystemSettings {
  [key: string]: any;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);

  // Form hooks for different categories
  const generalForm = useForm({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      siteName: '',
      siteDescription: '',
      contactEmail: '',
      phoneNumber: '',
    },
  });

  const commerceForm = useForm({
    resolver: zodResolver(commerceSettingsSchema),
    defaultValues: {
      defaultCurrency: 'USD',
      taxRate: 15,
      freeShippingThreshold: 500,
      defaultShippingCost: 50,
    },
  });

  const paymentForm = useForm({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      stripeEnabled: true,
      myfatoorahEnabled: true,
      codEnabled: true,
      bankTransferEnabled: true,
    },
  });

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.data.settings);
        populateFormValues(data.data.settings);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const populateFormValues = (settingsData: any) => {
    // Populate general settings
    if (settingsData.GENERAL) {
      const general = settingsData.GENERAL.reduce((acc: any, item: any) => {
        const key = item.key.replace('GENERAL_', '').toLowerCase();
        acc[key] = item.value;
        return acc;
      }, {});

      generalForm.reset({
        siteName: general.site_name || '',
        siteDescription: general.site_description || '',
        contactEmail: general.contact_email || '',
        phoneNumber: general.phone_number || '',
      });
    }

    // Populate commerce settings
    if (settingsData.COMMERCE) {
      const commerce = settingsData.COMMERCE.reduce((acc: any, item: any) => {
        const key = item.key.replace('COMMERCE_', '').toLowerCase();
        acc[key] = item.value;
        return acc;
      }, {});

      commerceForm.reset({
        defaultCurrency: commerce.default_currency || 'USD',
        taxRate: Number(commerce.tax_rate) || 15,
        freeShippingThreshold: Number(commerce.free_shipping_threshold) || 500,
        defaultShippingCost: Number(commerce.default_shipping_cost) || 50,
      });
    }

    // Populate payment settings
    if (settingsData.PAYMENT) {
      const payment = settingsData.PAYMENT.reduce((acc: any, item: any) => {
        const key = item.key.replace('PAYMENT_', '').toLowerCase();
        acc[key] = item.value;
        return acc;
      }, {});

      paymentForm.reset({
        stripeEnabled: payment.stripe_enabled || false,
        myfatoorahEnabled: payment.myfatoorah_enabled || false,
        codEnabled: payment.cod_enabled || false,
        bankTransferEnabled: payment.bank_transfer_enabled || false,
      });
    }
  };

  const initializeSettings = async () => {
    try {
      setInitializing(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Default settings initialized successfully',
        });
        await fetchSettings();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to initialize settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error initializing settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize settings',
        variant: 'destructive',
      });
    } finally {
      setInitializing(false);
    }
  };

  const saveSettings = async (category: string, data: any) => {
    try {
      setSaving(true);
      
      // Convert form data to API format
      const settingsArray = Object.entries(data).map(([key, value]) => ({
        key: `${category.toUpperCase()}_${key.toUpperCase()}`,
        value,
        type: typeof value === 'boolean' ? 'BOOLEAN' : 
              typeof value === 'number' ? 'NUMBER' : 'STRING',
        description: `${category} setting: ${key}`,
      }));

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsArray),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${category} settings saved successfully`,
        });
        await fetchSettings();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure your medical devices marketplace platform
          </p>
        </div>
        <Button 
          onClick={initializeSettings}
          disabled={initializing}
          variant="outline"
        >
          {initializing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          Initialize Defaults
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="commerce" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Commerce
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Features
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic platform configuration and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form 
                onSubmit={generalForm.handleSubmit((data) => saveSettings('general', data))}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      {...generalForm.register('siteName')}
                      placeholder="Medical Devices Marketplace"
                    />
                    {generalForm.formState.errors.siteName && (
                      <p className="text-sm text-red-600">
                        {generalForm.formState.errors.siteName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      {...generalForm.register('contactEmail')}
                      placeholder="support@medical-devices.com"
                    />
                    {generalForm.formState.errors.contactEmail && (
                      <p className="text-sm text-red-600">
                        {generalForm.formState.errors.contactEmail.message}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    {...generalForm.register('siteDescription')}
                    placeholder="Premier marketplace for medical devices in the Arabic-speaking healthcare market"
                    rows={3}
                  />
                  {generalForm.formState.errors.siteDescription && (
                    <p className="text-sm text-red-600">
                      {generalForm.formState.errors.siteDescription.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    {...generalForm.register('phoneNumber')}
                    placeholder="+966 11 123 4567"
                  />
                  {generalForm.formState.errors.phoneNumber && (
                    <p className="text-sm text-red-600">
                      {generalForm.formState.errors.phoneNumber.message}
                    </p>
                  )}
                </div>

                <Separator />
                
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save General Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commerce Settings */}
        <TabsContent value="commerce">
          <Card>
            <CardHeader>
              <CardTitle>Commerce Settings</CardTitle>
              <CardDescription>
                Configure pricing, shipping, and tax settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form 
                onSubmit={commerceForm.handleSubmit((data) => saveSettings('commerce', data))}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultCurrency">Default Currency</Label>
                    <Input
                      id="defaultCurrency"
                      {...commerceForm.register('defaultCurrency')}
                      placeholder="USD"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      {...commerceForm.register('taxRate', { valueAsNumber: true })}
                      placeholder="15"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="freeShippingThreshold">Free Shipping Threshold</Label>
                    <Input
                      id="freeShippingThreshold"
                      type="number"
                      step="0.01"
                      {...commerceForm.register('freeShippingThreshold', { valueAsNumber: true })}
                      placeholder="500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultShippingCost">Default Shipping Cost</Label>
                    <Input
                      id="defaultShippingCost"
                      type="number"
                      step="0.01"
                      {...commerceForm.register('defaultShippingCost', { valueAsNumber: true })}
                      placeholder="50"
                    />
                  </div>
                </div>

                <Separator />
                
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Commerce Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Gateway Settings</CardTitle>
              <CardDescription>
                Enable or disable payment methods for your platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form 
                onSubmit={paymentForm.handleSubmit((data) => saveSettings('payment', data))}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Stripe Payment Gateway</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable Stripe for credit card payments
                      </p>
                    </div>
                    <Switch
                      checked={paymentForm.watch('stripeEnabled')}
                      onCheckedChange={(checked) => 
                        paymentForm.setValue('stripeEnabled', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>MyFatoorah Payment Gateway</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable MyFatoorah for Middle East payments
                      </p>
                    </div>
                    <Switch
                      checked={paymentForm.watch('myfatoorahEnabled')}
                      onCheckedChange={(checked) => 
                        paymentForm.setValue('myfatoorahEnabled', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Cash on Delivery</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow customers to pay upon delivery
                      </p>
                    </div>
                    <Switch
                      checked={paymentForm.watch('codEnabled')}
                      onCheckedChange={(checked) => 
                        paymentForm.setValue('codEnabled', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Bank Transfer</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow direct bank transfer payments
                      </p>
                    </div>
                    <Switch
                      checked={paymentForm.watch('bankTransferEnabled')}
                      onCheckedChange={(checked) => 
                        paymentForm.setValue('bankTransferEnabled', checked)
                      }
                    />
                  </div>
                </div>

                <Separator />
                
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Payment Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional tabs would be implemented similarly */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure email templates and SMTP settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Email settings configuration coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security policies and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Security settings configuration coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Enable or disable platform features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Feature flags configuration coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}