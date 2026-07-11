import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, FileJson, FileSpreadsheet, Shield, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";

interface DataCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  estimatedSize: string;
}

interface DataExportRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestExport: (format: "json" | "csv", categories: string[]) => Promise<void>;
}

export function DataExportRequestModal({
  isOpen,
  onClose,
  onRequestExport
}: DataExportRequestModalProps) {
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "profile",
    "trips",
    "expenses",
    "activities",
    "messages"
  ]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);

  const dataCategories: DataCategory[] = [
    {
      id: "profile",
      label: "Profile Information",
      description: "Personal details, email, preferences",
      icon: "👤",
      estimatedSize: "< 1 MB"
    },
    {
      id: "trips",
      label: "Trip Data",
      description: "All trips you've created or joined",
      icon: "✈️",
      estimatedSize: "2-5 MB"
    },
    {
      id: "expenses",
      label: "Expense Records",
      description: "All expenses and settlements",
      icon: "💰",
      estimatedSize: "1-3 MB"
    },
    {
      id: "activities",
      label: "Activities & Itineraries",
      description: "All planned activities and votes",
      icon: "📅",
      estimatedSize: "1-2 MB"
    },
    {
      id: "messages",
      label: "Messages & Chat",
      description: "All trip messages and comments",
      icon: "💬",
      estimatedSize: "2-10 MB"
    },
    {
      id: "media",
      label: "Media Files",
      description: "Photos, receipts, and attachments",
      icon: "🖼️",
      estimatedSize: "10-100 MB"
    }
  ];

  const handleToggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAll = () => {
    setSelectedCategories(dataCategories.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedCategories([]);
  };

  const handleRequestExport = async () => {
    if (selectedCategories.length === 0) return;

    setIsRequesting(true);
    setRequestStatus("processing");
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      await onRequestExport(format, selectedCategories);

      clearInterval(progressInterval);
      setProgress(100);
      setRequestStatus("success");

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Failed to request export:", error);
      setRequestStatus("error");
    } finally {
      setIsRequesting(false);
    }
  };

  const getTotalEstimatedSize = () => {
    const selected = dataCategories.filter(c => selectedCategories.includes(c.id));
    if (selected.length === 0) return "0 MB";
    if (selected.some(c => c.id === "media")) return "10-100 MB";
    return "5-20 MB";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <DialogTitle>Export Your Data</DialogTitle>
          </div>
          <DialogDescription>
            Download a copy of your TripSync data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* GDPR Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              You have the right to access your personal data. We'll prepare a complete export of your selected data.
            </AlertDescription>
          </Alert>

          {/* Format Selection */}
          {requestStatus === "idle" && (
            <>
              <Card className="p-4">
                <Label className="text-sm font-semibold mb-3 block">Export Format</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormat("json")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      format === "json"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <FileJson className={`h-6 w-6 mx-auto mb-2 ${format === "json" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm font-medium">JSON</p>
                    <p className="text-xs text-muted-foreground mt-1">Machine-readable</p>
                  </button>
                  <button
                    onClick={() => setFormat("csv")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      format === "csv"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <FileSpreadsheet className={`h-6 w-6 mx-auto mb-2 ${format === "csv" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm font-medium">CSV</p>
                    <p className="text-xs text-muted-foreground mt-1">Spreadsheet-friendly</p>
                  </button>
                </div>
              </Card>

              {/* Data Categories */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold">Select Data to Export</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="text-xs h-7"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeselectAll}
                      className="text-xs h-7"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {dataCategories.map((category) => (
                    <div
                      key={category.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedCategories.includes(category.id)
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/30"
                      }`}
                      onClick={() => handleToggleCategory(category.id)}
                    >
                      <Checkbox
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => handleToggleCategory(category.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{category.icon}</span>
                          <p className="text-sm font-medium">{category.label}</p>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {category.estimatedSize}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Summary */}
              <Card className="p-3 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-blue-900">
                      {selectedCategories.length} categories selected
                    </p>
                    <p className="text-xs text-blue-800">
                      Estimated size: {getTotalEstimatedSize()}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-white">
                    {format.toUpperCase()}
                  </Badge>
                </div>
              </Card>
            </>
          )}

          {/* Processing State */}
          {requestStatus === "processing" && (
            <Card className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div>
                  <h4 className="font-semibold mb-1">Preparing Your Export</h4>
                  <p className="text-sm text-muted-foreground">
                    This may take a few moments...
                  </p>
                </div>
                <div className="w-full space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{progress}% complete</p>
                </div>
              </div>
            </Card>
          )}

          {/* Success State */}
          {requestStatus === "success" && (
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex flex-col items-center text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">Export Ready!</h4>
                  <p className="text-sm text-green-800">
                    Your data export has been prepared. Check your email for the download link.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Error State */}
          {requestStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Failed to prepare export. Please try again or contact support if the problem persists.
              </AlertDescription>
            </Alert>
          )}

          {/* Info */}
          {requestStatus === "idle" && (
            <Card className="p-3 bg-muted">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">What happens next?</p>
                  <ul className="space-y-1">
                    <li>• Your export will be prepared within 24 hours</li>
                    <li>• You'll receive an email with a secure download link</li>
                    <li>• The link expires after 7 days for security</li>
                    <li>• You can request exports once per week</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          {requestStatus === "idle" ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleRequestExport}
                disabled={selectedCategories.length === 0 || isRequesting}
              >
                <Download className="h-4 w-4 mr-2" />
                Request Export
              </Button>
            </>
          ) : requestStatus === "success" ? (
            <Button onClick={onClose}>Close</Button>
          ) : requestStatus === "error" ? (
            <>
              <Button variant="outline" onClick={() => setRequestStatus("idle")}>
                Try Again
              </Button>
              <Button onClick={onClose}>Close</Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
