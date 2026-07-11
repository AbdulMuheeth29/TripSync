import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Eye, Type, Contrast, Zap, Keyboard, Volume2, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface AccessibilitySettings {
  fontSize: "small" | "medium" | "large" | "x-large";
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  autoplayVideos: boolean;
  soundEffects: boolean;
  colorBlindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia";
}

interface AccessibilitySettingsPanelProps {
  initialSettings: AccessibilitySettings;
  onSave: (settings: AccessibilitySettings) => Promise<void>;
}

export function AccessibilitySettingsPanel({
  initialSettings,
  onSave
}: AccessibilitySettingsPanelProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(settings);
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save accessibility settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(initialSettings);
    setHasChanges(false);
  };

  const getFontSizeLabel = (size: string) => {
    const labels = {
      small: "Small (14px)",
      medium: "Medium (16px)",
      large: "Large (18px)",
      "x-large": "Extra Large (20px)"
    };
    return labels[size as keyof typeof labels];
  };

  const getColorBlindLabel = (mode: string) => {
    const labels = {
      none: "None",
      protanopia: "Protanopia (Red-Blind)",
      deuteranopia: "Deuteranopia (Green-Blind)",
      tritanopia: "Tritanopia (Blue-Blind)"
    };
    return labels[mode as keyof typeof labels];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Accessibility Settings</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Customize your experience to meet your accessibility needs
          </p>
        </div>
        {hasChanges && (
          <Badge variant="outline" className="bg-blue-50">
            Unsaved Changes
          </Badge>
        )}
      </div>

      <Separator />

      {/* Visual Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Type className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Visual Settings</h3>
        </div>

        <div className="space-y-4">
          {/* Font Size */}
          <div className="space-y-2">
            <Label htmlFor="font-size">Font Size</Label>
            <Select
              value={settings.fontSize}
              onValueChange={(value) => handleChange("fontSize", value as any)}
            >
              <SelectTrigger id="font-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">{getFontSizeLabel("small")}</SelectItem>
                <SelectItem value="medium">{getFontSizeLabel("medium")}</SelectItem>
                <SelectItem value="large">{getFontSizeLabel("large")}</SelectItem>
                <SelectItem value="x-large">{getFontSizeLabel("x-large")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose a comfortable reading size for all text
            </p>
          </div>

          <Separator />

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Contrast className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="high-contrast">High Contrast Mode</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Increase contrast between text and background for better visibility
              </p>
            </div>
            <Switch
              id="high-contrast"
              checked={settings.highContrast}
              onCheckedChange={(checked) => handleChange("highContrast", checked)}
            />
          </div>

          <Separator />

          {/* Color Blind Mode */}
          <div className="space-y-2">
            <Label htmlFor="colorblind-mode">Color Blind Mode</Label>
            <Select
              value={settings.colorBlindMode}
              onValueChange={(value) => handleChange("colorBlindMode", value as any)}
            >
              <SelectTrigger id="colorblind-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{getColorBlindLabel("none")}</SelectItem>
                <SelectItem value="protanopia">{getColorBlindLabel("protanopia")}</SelectItem>
                <SelectItem value="deuteranopia">{getColorBlindLabel("deuteranopia")}</SelectItem>
                <SelectItem value="tritanopia">{getColorBlindLabel("tritanopia")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Adjust colors to accommodate color vision deficiencies
            </p>
          </div>
        </div>
      </Card>

      {/* Motion & Animation */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Motion & Animation</h3>
        </div>

        <div className="space-y-4">
          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <Label htmlFor="reduced-motion">Reduced Motion</Label>
              <p className="text-xs text-muted-foreground">
                Minimize animations and transitions that may cause discomfort
              </p>
            </div>
            <Switch
              id="reduced-motion"
              checked={settings.reducedMotion}
              onCheckedChange={(checked) => handleChange("reducedMotion", checked)}
            />
          </div>

          <Separator />

          {/* Autoplay Videos */}
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <Label htmlFor="autoplay-videos">Autoplay Videos</Label>
              <p className="text-xs text-muted-foreground">
                Automatically play videos when scrolling (not recommended for sensitive users)
              </p>
            </div>
            <Switch
              id="autoplay-videos"
              checked={settings.autoplayVideos}
              onCheckedChange={(checked) => handleChange("autoplayVideos", checked)}
            />
          </div>
        </div>
      </Card>

      {/* Navigation & Interaction */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Keyboard className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Navigation & Interaction</h3>
        </div>

        <div className="space-y-4">
          {/* Screen Reader */}
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <Label htmlFor="screen-reader">Screen Reader Optimization</Label>
              <p className="text-xs text-muted-foreground">
                Enhanced ARIA labels and descriptions for screen readers
              </p>
            </div>
            <Switch
              id="screen-reader"
              checked={settings.screenReaderOptimized}
              onCheckedChange={(checked) => handleChange("screenReaderOptimized", checked)}
            />
          </div>

          <Separator />

          {/* Keyboard Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="keyboard-nav">Enhanced Keyboard Navigation</Label>
                <Badge variant="secondary" className="text-xs">Recommended</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Navigate the entire app using only your keyboard with Tab, Enter, and Arrow keys
              </p>
            </div>
            <Switch
              id="keyboard-nav"
              checked={settings.keyboardNavigation}
              onCheckedChange={(checked) => handleChange("keyboardNavigation", checked)}
            />
          </div>

          <Separator />

          {/* Focus Indicators */}
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <Label htmlFor="focus-indicators">Visible Focus Indicators</Label>
              <p className="text-xs text-muted-foreground">
                Show clear outlines around focused elements for keyboard navigation
              </p>
            </div>
            <Switch
              id="focus-indicators"
              checked={settings.focusIndicators}
              onCheckedChange={(checked) => handleChange("focusIndicators", checked)}
            />
          </div>
        </div>
      </Card>

      {/* Sound Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Sound Settings</h3>
        </div>

        <div className="space-y-4">
          {/* Sound Effects */}
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <Label htmlFor="sound-effects">Sound Effects</Label>
              <p className="text-xs text-muted-foreground">
                Play sounds for notifications and interactions
              </p>
            </div>
            <Switch
              id="sound-effects"
              checked={settings.soundEffects}
              onCheckedChange={(checked) => handleChange("soundEffects", checked)}
            />
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-900">
            <p className="font-medium mb-1">Accessibility Commitment</p>
            <p className="text-blue-800">
              We're committed to making TripSync accessible to everyone. If you encounter any accessibility issues or have suggestions, please contact our support team.
            </p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges || isSaving}
        >
          Reset to Defaults
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
