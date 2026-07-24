import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  FileText,
  Download,
  Copy,
  Check,
  Loader2,
  Image,
  BarChart3,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';

interface TripStats {
  totalExpenses: number;
  totalActivities: number;
  totalPhotos: number;
  daysElapsed: number;
  topCategory: string;
  favoriteActivity: string;
}

interface TripRecapEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripName: string;
  destination: string;
  startDate: string;
  endDate: string;
  currentRecap?: string | null;
  stats: TripStats;
  onSave: (recapText: string) => Promise<void>;
  onGenerateRecap?: () => Promise<string>;
}

export function TripRecapEditorModal({
  isOpen,
  onClose,
  tripId,
  tripName,
  destination,
  startDate,
  endDate,
  currentRecap,
  stats,
  onSave,
  onGenerateRecap,
}: TripRecapEditorModalProps) {
  const [recapText, setRecapText] = useState(currentRecap || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!onGenerateRecap) return;

    setIsGenerating(true);
    try {
      const generated = await onGenerateRecap();
      setRecapText(generated);
      setHasChanges(true);
    } catch (error) {
      console.error('Failed to generate recap:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(recapText);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save recap:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(recapText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([recapText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tripName.replace(/[^a-z0-9]/gi, '_')}_recap.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const wordCount = recapText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = recapText.length;
  const estimatedReadingTime = Math.ceil(wordCount / 200);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <DialogTitle>Trip Recap Editor</DialogTitle>
          </div>
          <DialogDescription>
            Create a memorable summary of your {destination} adventure
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="stats">Trip Stats</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Editor Tab */}
          <TabsContent value="editor" className="space-y-4 mt-4">
            {/* AI Generate */}
            {onGenerateRecap && (
              <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-900">AI-Powered Recap</h4>
                    </div>
                    <p className="text-sm text-purple-800">
                      Let Atlas generate a personalized recap based on your trip activities,
                      expenses, and highlights
                    </p>
                  </div>
                  <Button onClick={handleGenerate} disabled={isGenerating} className="ml-4">
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}

            {/* Editor */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="font-semibold">Your Recap</Label>
                {hasChanges && (
                  <Badge variant="outline" className="bg-amber-50">
                    Unsaved Changes
                  </Badge>
                )}
              </div>
              <Textarea
                value={recapText}
                onChange={(e) => {
                  setRecapText(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="Share your favorite memories, highlights, and experiences from this trip..."
                className="min-h-[300px] resize-none"
              />

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{charCount} characters</span>
                  <span>•</span>
                  <span>~{estimatedReadingTime} min read</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={!recapText.trim()}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={!recapText.trim()}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </Card>

            {/* Writing Tips */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Writing Tips</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Start with your favorite memory or highlight</li>
                <li>• Include specific moments, inside jokes, or unexpected discoveries</li>
                <li>• Mention favorite meals, activities, or local experiences</li>
                <li>• Note what you'd do differently or recommend to others</li>
                <li>• End with gratitude or plans to return</li>
              </ul>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4 mt-4">
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-green-900 mb-2">{tripName}</h3>
                <p className="text-green-700 mb-4">
                  {format(new Date(startDate), 'MMM d')} -{' '}
                  {format(new Date(endDate), 'MMM d, yyyy')}
                </p>
                <Badge className="bg-green-600 text-white">{stats.daysElapsed} Days</Badge>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Activities Completed</p>
                    <p className="text-2xl font-bold">{stats.totalActivities}</p>
                  </div>
                </div>
                {stats.favoriteActivity && (
                  <p className="text-xs text-muted-foreground">
                    Top rated: {stats.favoriteActivity}
                  </p>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold">{stats.totalExpenses}</p>
                  </div>
                </div>
                {stats.topCategory && (
                  <p className="text-xs text-muted-foreground">Top category: {stats.topCategory}</p>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                    <Image className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Photos Shared</p>
                    <p className="text-2xl font-bold">{stats.totalPhotos}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <Calendar className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trip Duration</p>
                    <p className="text-2xl font-bold">{stats.daysElapsed}</p>
                    <p className="text-xs text-muted-foreground">days</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4 bg-muted">
              <p className="text-xs text-muted-foreground">
                💡 Use these stats in your recap to add specific details and make it more memorable!
              </p>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4 mt-4">
            <Card className="p-6">
              <div className="prose prose-sm max-w-none">
                <div className="mb-6 pb-6 border-b">
                  <h1 className="text-3xl font-bold mb-2">{tripName}</h1>
                  <p className="text-muted-foreground">
                    {destination} • {format(new Date(startDate), 'MMMM d')} -{' '}
                    {format(new Date(endDate), 'MMMM d, yyyy')}
                  </p>
                </div>

                {recapText ? (
                  <div className="whitespace-pre-wrap">{recapText}</div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No recap yet. Start writing to see a preview.
                    </p>
                  </div>
                )}

                {recapText && (
                  <div className="mt-8 pt-6 border-t">
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <p className="text-2xl font-bold text-primary">{stats.totalActivities}</p>
                        <p className="text-xs text-muted-foreground">Activities</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">{stats.totalPhotos}</p>
                        <p className="text-xs text-muted-foreground">Photos</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">{stats.daysElapsed}</p>
                        <p className="text-xs text-muted-foreground">Days</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-muted-foreground">
              {wordCount > 0 ? `${wordCount} words written` : 'Start writing or generate with AI'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                {isSaving ? 'Saving...' : 'Save Recap'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
