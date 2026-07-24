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
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  CloudRain,
  Cloud,
  Sun,
  CloudSnow,
  Wind,
  AlertTriangle,
  Droplets,
  Thermometer,
} from 'lucide-react';
import { format } from 'date-fns';

interface WeatherDay {
  date: Date;
  high: number;
  low: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy';
  precipitation: number;
  humidity: number;
}

interface WeatherAlert {
  severity: 'info' | 'warning' | 'severe';
  title: string;
  description: string;
}

interface WeatherAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  forecast: WeatherDay[];
  alerts?: WeatherAlert[];
  recommendations: string[];
  temperatureUnit?: 'F' | 'C';
}

const WEATHER_ICONS: Record<WeatherDay['condition'], typeof Sun> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  windy: Wind,
};

const WEATHER_COLORS: Record<WeatherDay['condition'], string> = {
  sunny: 'bg-yellow-100 text-yellow-800',
  cloudy: 'bg-gray-100 text-gray-800',
  rainy: 'bg-blue-100 text-blue-800',
  snowy: 'bg-cyan-100 text-cyan-800',
  windy: 'bg-slate-100 text-slate-800',
};

const ALERT_COLORS: Record<WeatherAlert['severity'], { bg: string; border: string; text: string }> =
  {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900' },
    severe: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900' },
  };

export function WeatherAlertModal({
  isOpen,
  onClose,
  destination,
  forecast,
  alerts = [],
  recommendations,
  temperatureUnit = 'F',
}: WeatherAlertModalProps) {
  const formatTemp = (temp: number) => {
    return `${Math.round(temp)}°${temperatureUnit}`;
  };

  const hasAlerts = alerts.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>Weather Forecast</DialogTitle>
          </div>
          <DialogDescription>
            Upcoming weather for <strong>{destination}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Atlas Message */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary mb-1">Atlas Weather Update</p>
                <p className="text-sm text-muted-foreground">
                  {hasAlerts
                    ? 'There are weather alerts for your trip dates. Check below for details and recommendations.'
                    : 'Weather looks good for your trip! Check the forecast below to plan your activities.'}
                </p>
              </div>
            </div>
          </Card>

          {/* Weather Alerts */}
          {hasAlerts && (
            <div className="space-y-2">
              {alerts.map((alert, index) => {
                const colors = ALERT_COLORS[alert.severity];
                return (
                  <Card key={index} className={`p-4 ${colors.bg} ${colors.border}`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`h-5 w-5 ${colors.text} mt-0.5`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-semibold ${colors.text}`}>{alert.title}</h4>
                          <Badge
                            variant={alert.severity === 'severe' ? 'destructive' : 'secondary'}
                            className="uppercase text-xs"
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className={`text-sm ${colors.text}`}>{alert.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Forecast */}
          <div>
            <h4 className="font-semibold mb-3">{forecast.length}-Day Forecast</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {forecast.map((day, index) => {
                const WeatherIcon = WEATHER_ICONS[day.condition];
                const colorClass = WEATHER_COLORS[day.condition];

                return (
                  <Card key={index} className="p-4">
                    <div className="text-center">
                      <p className="text-sm font-medium mb-2">{format(day.date, 'EEE, MMM d')}</p>

                      <div
                        className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${colorClass} mb-3`}
                      >
                        <WeatherIcon className="h-8 w-8" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <Thermometer className="h-4 w-4 text-red-500" />
                          <span className="font-bold text-lg">{formatTemp(day.high)}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-muted-foreground">{formatTemp(day.low)}</span>
                        </div>

                        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Droplets className="h-3 w-3" />
                            <span>{day.precipitation}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Cloud className="h-3 w-3" />
                            <span>{day.humidity}%</span>
                          </div>
                        </div>

                        <Badge variant="outline" className={`capitalize text-xs ${colorClass}`}>
                          {day.condition}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="font-semibold mb-3 text-blue-900">Packing Recommendations</h4>
              <ul className="space-y-2">
                {recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Weather Tips */}
          <Card className="p-3 bg-muted/50">
            <p className="text-xs text-muted-foreground">
              <strong>Tip:</strong> Weather forecasts can change. Check back closer to your trip
              dates for the most accurate information. I'll send you updates if there are
              significant changes.
            </p>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Got It</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
