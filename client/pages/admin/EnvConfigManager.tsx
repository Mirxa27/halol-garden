import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  CreditCard, 
  Mail, 
  Globe, 
  Shield, 
  HardDrive, 
  Activity,
  Plus,
  Save,
  RefreshCw,
  TestTube,
  Download,
  Upload,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Info,
  Sparkles,
  History,
  PlayCircle,
  Lock,
  Unlock
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion';
import { useToast } from '../../components/ui/use-toast';
import axios from 'axios';

interface EnvVariable {
  key: string;
  value: string;
  description?: string;
  category: string;
  required: boolean;
  encrypted: boolean;
  validation?: {
    type: string;
    pattern?: string;
    min?: number;
    max?: number;
    options?: string[];
  };
  lastModified?: Date;
  modifiedBy?: string;
}

interface EnvSnapshot {
  id: string;
  variables: EnvVariable[];
  createdAt: Date;
  createdBy: string;
  description: string;
  isActive: boolean;
}

interface WizardStep {
  title: string;
  category: string;
  variables: EnvVariable[];
  completed: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Database': <Database className="w-4 h-4" />,
  'AI Providers': <Sparkles className="w-4 h-4" />,
  'Payments': <CreditCard className="w-4 h-4" />,
  'Email': <Mail className="w-4 h-4" />,
  'Site Branding': <Globe className="w-4 h-4" />,
  'Authentication': <Shield className="w-4 h-4" />,
  'Storage': <HardDrive className="w-4 h-4" />,
  'Monitoring': <Activity className="w-4 h-4" />,
  'Other Services': <Settings className="w-4 h-4" />
};

const providerTests = [
  { id: 'openai', name: 'OpenAI', category: 'AI Providers' },
  { id: 'gemini', name: 'Google Gemini', category: 'AI Providers' },
  { id: 'elevenlabs', name: 'ElevenLabs', category: 'AI Providers' },
  { id: 'livekit', name: 'LiveKit', category: 'AI Providers' },
  { id: 'deepgram', name: 'Deepgram', category: 'AI Providers' },
  { id: 'hume', name: 'Hume', category: 'AI Providers' },
  { id: 'paypal', name: 'PayPal', category: 'Payments' },
  { id: 'myfatoorah', name: 'MyFatoorah', category: 'Payments' }
];

export default function EnvConfigManager() {
  const [variables, setVariables] = useState<Record<string, EnvVariable[]>>({});
  const [editingVar, setEditingVar] = useState<EnvVariable | null>(null);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [snapshots, setSnapshots] = useState<EnvSnapshot[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardData, setWizardData] = useState<{ steps: WizardStep[], progress: number } | null>(null);
  const [currentWizardStep, setCurrentWizardStep] = useState(0);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; models?: string[] }>>({});
  const [showSnapshotDialog, setShowSnapshotDialog] = useState(false);
  const [snapshotDescription, setSnapshotDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadVariables();
    checkInitialConfig();
    loadSnapshots();
  }, []);

  const loadVariables = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/env-config');
      setVariables(response.data.variables);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load environment variables',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkInitialConfig = async () => {
    try {
      const response = await axios.get('/api/admin/env-config/check');
      if (response.data.needsConfiguration) {
        const wizardResponse = await axios.get('/api/admin/env-config/wizard');
        setWizardData(wizardResponse.data);
        setShowWizard(true);
      }
    } catch (error) {
      console.error('Failed to check initial configuration', error);
    }
  };

  const loadSnapshots = async () => {
    try {
      const response = await axios.get('/api/admin/env-config/snapshots');
      setSnapshots(response.data.snapshots);
    } catch (error) {
      console.error('Failed to load snapshots', error);
    }
  };

  const saveVariable = async (variable: EnvVariable) => {
    try {
      setLoading(true);
      await axios.post('/api/admin/env-config/update', {
        key: variable.key,
        value: variable.value
      });
      
      toast({
        title: 'Success',
        description: `${variable.key} has been updated`
      });
      
      setEditingVar(null);
      await loadVariables();
      
      // If in wizard mode, update wizard data
      if (showWizard) {
        const wizardResponse = await axios.get('/api/admin/env-config/wizard');
        setWizardData(wizardResponse.data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save variable',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteVariable = async (key: string) => {
    if (!confirm(`Are you sure you want to delete ${key}?`)) return;
    
    try {
      setLoading(true);
      await axios.delete(`/api/admin/env-config/${key}`);
      
      toast({
        title: 'Success',
        description: `${key} has been deleted`
      });
      
      await loadVariables();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete variable',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const testProvider = async (providerId: string) => {
    try {
      const response = await axios.post(`/api/admin/env-config/test/${providerId}`);
      setTestResults({
        ...testResults,
        [providerId]: response.data
      });
      
      toast({
        title: response.data.success ? 'Success' : 'Failed',
        description: response.data.message,
        variant: response.data.success ? 'default' : 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test provider',
        variant: 'destructive'
      });
    }
  };

  const createSnapshot = async () => {
    try {
      setLoading(true);
      await axios.post('/api/admin/env-config/snapshot', {
        description: snapshotDescription
      });
      
      toast({
        title: 'Success',
        description: 'Snapshot created successfully'
      });
      
      setShowSnapshotDialog(false);
      setSnapshotDescription('');
      await loadSnapshots();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create snapshot',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const restoreSnapshot = async (snapshotId: string) => {
    if (!confirm('Are you sure you want to restore this snapshot? Current configuration will be overwritten.')) return;
    
    try {
      setLoading(true);
      await axios.post(`/api/admin/env-config/snapshot/${snapshotId}/restore`);
      
      toast({
        title: 'Success',
        description: 'Snapshot restored successfully. Redeployment triggered.'
      });
      
      await loadVariables();
      await loadSnapshots();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore snapshot',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerRedeploy = async () => {
    if (!confirm('Are you sure you want to trigger a redeployment?')) return;
    
    try {
      setLoading(true);
      await axios.post('/api/admin/env-config/redeploy');
      
      toast({
        title: 'Success',
        description: 'Redeployment triggered successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to trigger redeployment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderVariableInput = (variable: EnvVariable) => {
    const isEditing = editingVar?.key === variable.key;
    const value = isEditing ? editingVar.value : variable.value;
    const showValue = showValues[variable.key] || !variable.encrypted;

    if (variable.validation?.options) {
      return (
        <Select
          value={value}
          onValueChange={(val) => setEditingVar({ ...variable, value: val })}
          disabled={!isEditing}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {variable.validation.options.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (variable.validation?.type === 'number') {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => setEditingVar({ ...variable, value: e.target.value })}
          disabled={!isEditing}
          min={variable.validation.min}
          max={variable.validation.max}
        />
      );
    }

    return (
      <div className="relative">
        <Input
          type={showValue ? 'text' : 'password'}
          value={value}
          onChange={(e) => setEditingVar({ ...variable, value: e.target.value })}
          disabled={!isEditing}
          placeholder={variable.encrypted && !value ? '••••••••' : ''}
        />
        {variable.encrypted && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => setShowValues({ ...showValues, [variable.key]: !showValue })}
          >
            {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        )}
      </div>
    );
  };

  const renderWizard = () => {
    if (!wizardData) return null;
    
    const currentStep = wizardData.steps[currentWizardStep];
    
    return (
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Initial Configuration Wizard</DialogTitle>
            <DialogDescription>
              Complete the required configuration to get your platform running
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  Overall Progress
                </span>
                <span className="text-sm font-medium">
                  {Math.round(wizardData.progress)}%
                </span>
              </div>
              <Progress value={wizardData.progress} className="h-2" />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {wizardData.steps.map((step, index) => (
                <Button
                  key={index}
                  variant={index === currentWizardStep ? 'default' : step.completed ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentWizardStep(index)}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  {categoryIcons[step.category]}
                  {step.title}
                  {step.completed && <Check className="w-3 h-3 ml-1" />}
                </Button>
              ))}
            </div>
            
            {currentStep && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {categoryIcons[currentStep.category]}
                    {currentStep.title}
                  </CardTitle>
                  <CardDescription>
                    Configure the required {currentStep.title.toLowerCase()} settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentStep.variables.map(variable => (
                    <div key={variable.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={variable.key}>
                          {variable.key}
                          {variable.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {variable.encrypted && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            Encrypted
                          </Badge>
                        )}
                      </div>
                      {variable.description && (
                        <p className="text-sm text-muted-foreground">
                          {variable.description}
                        </p>
                      )}
                      {renderVariableInput(variable)}
                      {editingVar?.key === variable.key && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveVariable(editingVar)}
                            disabled={loading}
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingVar(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                      {!editingVar && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingVar(variable)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
          
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentWizardStep(Math.max(0, currentWizardStep - 1))}
                disabled={currentWizardStep === 0}
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentWizardStep(Math.min(wizardData.steps.length - 1, currentWizardStep + 1))}
                disabled={currentWizardStep === wizardData.steps.length - 1}
              >
                Next
              </Button>
            </div>
            <Button
              variant="default"
              onClick={() => setShowWizard(false)}
              disabled={wizardData.progress < 100}
            >
              {wizardData.progress < 100 ? 'Complete Required Fields' : 'Finish Setup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Environment Configuration</h1>
          <p className="text-muted-foreground">
            Manage environment variables and provider integrations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowWizard(true)} variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configuration Wizard
          </Button>
          <Button onClick={() => setShowSnapshotDialog(true)} variant="outline">
            <Save className="w-4 h-4 mr-2" />
            Create Snapshot
          </Button>
          <Button onClick={triggerRedeploy} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Redeploy
          </Button>
        </div>
      </div>

      {/* Provider Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {providerTests.map(provider => {
          const result = testResults[provider.id];
          return (
            <Card key={provider.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium">
                    {provider.name}
                  </CardTitle>
                  {result && (
                    <Badge variant={result.success ? 'success' : 'destructive'}>
                      {result.success ? 'Connected' : 'Failed'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testProvider(provider.id)}
                  className="w-full"
                >
                  <TestTube className="w-3 h-3 mr-1" />
                  Test Connection
                </Button>
                {result?.models && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      {result.models.length} models available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="variables" className="space-y-4">
        <TabsList>
          <TabsTrigger value="variables">Environment Variables</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots & Backup</TabsTrigger>
          <TabsTrigger value="providers">Provider Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="variables" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.keys(categoryIcons).map(category => (
                  <SelectItem key={category} value={category}>
                    <div className="flex items-center gap-2">
                      {categoryIcons[category]}
                      {category}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Accordion type="multiple" className="space-y-4">
            {Object.entries(variables)
              .filter(([category]) => selectedCategory === 'all' || category === selectedCategory)
              .map(([category, vars]) => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      {categoryIcons[category]}
                      {category}
                      <Badge variant="secondary" className="ml-2">
                        {vars.length} variables
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {vars.map(variable => (
                        <Card key={variable.key}>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-base font-medium">
                                      {variable.key}
                                    </Label>
                                    {variable.required && (
                                      <Badge variant="destructive" className="text-xs">
                                        Required
                                      </Badge>
                                    )}
                                    {variable.encrypted && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Lock className="w-3 h-3 mr-1" />
                                        Encrypted
                                      </Badge>
                                    )}
                                  </div>
                                  {variable.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {variable.description}
                                    </p>
                                  )}
                                </div>
                                {!variable.required && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteVariable(variable.key)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                              
                              <div className="space-y-2">
                                {renderVariableInput(variable)}
                                {editingVar?.key === variable.key ? (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => saveVariable(editingVar)}
                                      disabled={loading}
                                    >
                                      <Save className="w-3 h-3 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingVar(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingVar(variable)}
                                  >
                                    Edit Value
                                  </Button>
                                )}
                              </div>
                              
                              {variable.validation && (
                                <Alert>
                                  <Info className="h-4 w-4" />
                                  <AlertDescription className="text-xs">
                                    Validation: {variable.validation.type}
                                    {variable.validation.pattern && ` (Pattern: ${variable.validation.pattern})`}
                                    {variable.validation.min !== undefined && ` (Min: ${variable.validation.min})`}
                                    {variable.validation.max !== undefined && ` (Max: ${variable.validation.max})`}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </TabsContent>

        <TabsContent value="snapshots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Snapshots</CardTitle>
              <CardDescription>
                Create and restore backups of your environment configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {snapshots.map(snapshot => (
                  <div
                    key={snapshot.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        <span className="font-medium">{snapshot.description}</span>
                        {snapshot.isActive && (
                          <Badge variant="success">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(snapshot.createdAt).toLocaleString()} by {snapshot.createdBy}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => restoreSnapshot(snapshot.id)}
                        disabled={snapshot.isActive}
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Restore
                      </Button>
                    </div>
                  </div>
                ))}
                
                {snapshots.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No snapshots available. Create your first backup to protect your configuration.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Integration Testing</CardTitle>
              <CardDescription>
                Test connections to external services and AI providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {providerTests.map(provider => {
                  const result = testResults[provider.id];
                  return (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {categoryIcons[provider.category]}
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {provider.category}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {result && (
                          <div className="text-right">
                            <Badge variant={result.success ? 'success' : 'destructive'}>
                              {result.success ? 'Connected' : 'Failed'}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {result.message}
                            </p>
                            {result.models && (
                              <p className="text-xs text-muted-foreground">
                                {result.models.length} models available
                              </p>
                            )}
                          </div>
                        )}
                        <Button
                          size="sm"
                          onClick={() => testProvider(provider.id)}
                          disabled={loading}
                        >
                          <TestTube className="w-3 h-3 mr-1" />
                          Test
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Snapshot Dialog */}
      <Dialog open={showSnapshotDialog} onOpenChange={setShowSnapshotDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Configuration Snapshot</DialogTitle>
            <DialogDescription>
              Save a backup of your current environment configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={snapshotDescription}
                onChange={(e) => setSnapshotDescription(e.target.value)}
                placeholder="e.g., Before major update, Production backup, etc."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSnapshotDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createSnapshot} disabled={!snapshotDescription || loading}>
              <Save className="w-4 h-4 mr-2" />
              Create Snapshot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Render Configuration Wizard */}
      {renderWizard()}
    </div>
  );
}