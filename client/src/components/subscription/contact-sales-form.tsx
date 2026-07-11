import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Building, Users, Mail, Phone, Send, CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

interface ContactSalesFormProps {
  onSubmit: (data: SalesInquiry) => void | Promise<void>;
  defaultPlan?: "Teams" | "Enterprise";
}

export interface SalesInquiry {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  companySize: string;
  planInterest: "Teams" | "Enterprise" | "Custom";
  message: string;
  interestedInDemo: boolean;
}

const contactSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  companySize: z.string().min(1, "Please select company size"),
  message: z.string().min(10, "Please provide more details (minimum 10 characters)")
});

const COMPANY_SIZES = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees"
];

export function ContactSalesForm({
  onSubmit,
  defaultPlan = "Teams"
}: ContactSalesFormProps) {
  const [formData, setFormData] = useState<SalesInquiry>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    companySize: "",
    planInterest: defaultPlan,
    message: "",
    interestedInDemo: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (field: keyof SalesInquiry, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    try {
      contactSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    await onSubmit(formData);
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <Card className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
        <p className="text-muted-foreground mb-6">
          We've received your inquiry. Our sales team will reach out within 24 hours.
        </p>

        <Card className="p-4 bg-blue-50 border-blue-200 text-left">
          <p className="text-sm text-blue-900 mb-2">
            <strong>What's Next?</strong>
          </p>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>You'll receive a confirmation email shortly</li>
            <li>A sales representative will contact you within 24 hours</li>
            {formData.interestedInDemo && <li>We'll schedule a personalized demo at your convenience</li>}
            <li>We'll prepare a custom quote based on your needs</li>
          </ul>
        </Card>

        <Button onClick={() => setIsSubmitted(false)} className="mt-6">
          Submit Another Inquiry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Contact Sales</h2>
        <p className="text-lg text-muted-foreground">
          Let's discuss how TripSync Teams can work for your organization
        </p>
      </div>

      {/* Benefits Banner */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Why Choose TripSync Teams?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <span>Unlimited trips and team members</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <span>Priority customer support</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <span>Advanced analytics & reporting</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <span>Custom integrations & SSO</span>
          </div>
        </div>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="companyName"
                placeholder="Acme Inc."
                className={`pl-10 ${errors.companyName ? 'border-red-500' : ''}`}
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
              />
            </div>
            {errors.companyName && (
              <p className="text-xs text-red-600">{errors.companyName}</p>
            )}
          </div>

          {/* Contact Name */}
          <div className="space-y-2">
            <Label htmlFor="contactName">Your Name *</Label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="contactName"
                placeholder="John Doe"
                className={`pl-10 ${errors.contactName ? 'border-red-500' : ''}`}
                value={formData.contactName}
                onChange={(e) => handleChange('contactName', e.target.value)}
              />
            </div>
            {errors.contactName && (
              <p className="text-xs text-red-600">{errors.contactName}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Work Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="john@acme.com"
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                className="pl-10"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Company Size */}
          <div className="space-y-2">
            <Label htmlFor="companySize">Company Size *</Label>
            <Select
              value={formData.companySize}
              onValueChange={(value) => handleChange('companySize', value)}
            >
              <SelectTrigger
                id="companySize"
                className={errors.companySize ? 'border-red-500' : ''}
              >
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.companySize && (
              <p className="text-xs text-red-600">{errors.companySize}</p>
            )}
          </div>

          {/* Plan Interest */}
          <div className="space-y-2">
            <Label htmlFor="planInterest">Plan Interest</Label>
            <Select
              value={formData.planInterest}
              onValueChange={(value: any) => handleChange('planInterest', value)}
            >
              <SelectTrigger id="planInterest">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Teams">Teams Plan</SelectItem>
                <SelectItem value="Enterprise">Enterprise Plan</SelectItem>
                <SelectItem value="Custom">Custom Solution</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message">Tell us about your needs *</Label>
          <Textarea
            id="message"
            placeholder="Tell us about your team size, use case, and any specific requirements..."
            rows={5}
            className={errors.message ? 'border-red-500' : ''}
            value={formData.message}
            onChange={(e) => handleChange('message', e.target.value)}
          />
          {errors.message && (
            <p className="text-xs text-red-600">{errors.message}</p>
          )}
        </div>

        {/* Demo Interest */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="demo"
              checked={formData.interestedInDemo}
              onCheckedChange={(checked) => handleChange('interestedInDemo', checked)}
            />
            <Label htmlFor="demo" className="cursor-pointer leading-relaxed">
              I'm interested in scheduling a personalized demo
            </Label>
          </div>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? "Sending..." : "Contact Sales Team"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By submitting this form, you agree to be contacted by our sales team.
          We typically respond within 24 hours.
        </p>
      </form>
    </div>
  );
}
