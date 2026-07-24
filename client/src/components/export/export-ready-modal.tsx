import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Download, Mail, FileText, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import type { ExportFormat } from "./export-format-selector";

interface ExportReadyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onEmailSend: () => void;
  format: ExportFormat;
  tripName: string;
  fileSize: string;
  exportDate: Date;
  numberOfExpenses: number;
  numberOfMembers: number;
}

const FORMAT_INFO: Record<ExportFormat, { icon: string; color: string; description: string }> = {
  pdf: {
    icon: "📄",
    color: "bg-red-100 text-red-800 border-red-200",
    description: "Professional PDF document ready to share or print"
  },
  csv: {
    icon: "📊",
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Spreadsheet file ready to import into Excel or Google Sheets"
  },
  json: {
    icon: "📋",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "JSON data file ready for processing or integration"
  }
};

export function ExportReadyModal({
  isOpen,
  onClose,
  onDownload,
  onEmailSend,
  format: exportFormat,
  tripName,
  fileSize,
  exportDate,
  numberOfExpenses,
  numberOfMembers
}: ExportReadyModalProps) {
  const formatInfo = FORMAT_INFO[exportFormat];
  const fileName = `${tripName.replace(/\s+/g, '_')}_expenses_${format(exportDate, 'yyyy-MM-dd')}.${exportFormat}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 animate-bounce">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center">
            Export Ready!
          </DialogTitle>
          <DialogDescription className="text-center">
            Your expense report has been generated successfully
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Info Card */}
          <Card className={`p-4 ${formatInfo.color}`}>
            <div className="flex items-start gap-3">
              <div className="text-3xl">{formatInfo.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold mb-1 truncate">{fileName}</h4>
                <p className="text-sm mb-2">{formatInfo.description}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {exportFormat.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {fileSize}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Export Summary */}
          <Card className="p-4 bg-muted/50">
            <h4 className="font-semibold text-sm mb-3">Export Summary</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Trip Name</span>
                </div>
                <span className="font-medium">{tripName}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Generated</span>
                </div>
                <span className="font-medium">
                  {format(exportDate, "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Expenses</span>
                </div>
                <span className="font-medium">{numberOfExpenses} items</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Members</span>
                </div>
                <span className="font-medium">{numberOfMembers} people</span>
              </div>
            </div>
          </Card>

          {/* Actions Info */}
          <Card className="p-3 bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> You can download the file now or email it to yourself and your group members
            </p>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onEmailSend}
            className="flex-1"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email to Group
          </Button>
          <Button
            onClick={onDownload}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download File
          </Button>
        </DialogFooter>

        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
