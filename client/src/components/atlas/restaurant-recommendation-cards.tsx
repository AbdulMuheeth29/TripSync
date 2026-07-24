import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, DollarSign, ExternalLink, Plus, Navigation } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  priceLevel: number; // 1-4 ($, $$, $$$, $$$$)
  description: string;
  address: string;
  distance?: string;
  imageUrl?: string;
  menuUrl?: string;
  mapsUrl?: string;
}

interface RestaurantRecommendationCardsProps {
  restaurants: Restaurant[];
  onAddToItinerary: (restaurantId: string) => void;
  onViewMenu: (menuUrl: string) => void;
  onGetDirections: (mapsUrl: string) => void;
}

export function RestaurantRecommendationCards({
  restaurants,
  onAddToItinerary,
  onViewMenu,
  onGetDirections,
}: RestaurantRecommendationCardsProps) {
  const getPriceSymbol = (level: number) => {
    return '$'.repeat(level);
  };

  if (restaurants.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No recommendations available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Restaurant Recommendations</h3>
        <Badge variant="secondary">
          {restaurants.length} {restaurants.length === 1 ? 'Option' : 'Options'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {restaurants.map((restaurant, index) => (
          <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Image */}
            {restaurant.imageUrl && (
              <div className="aspect-video bg-muted relative overflow-hidden">
                <img
                  src={restaurant.imageUrl}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge className="bg-white/90 text-foreground backdrop-blur-sm">
                    #{index + 1}
                  </Badge>
                </div>
              </div>
            )}

            <div className="p-4 space-y-3">
              {/* Header */}
              <div>
                <h4 className="font-semibold text-lg mb-1">{restaurant.name}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {restaurant.cuisine}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {getPriceSymbol(restaurant.priceLevel)}
                  </span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(restaurant.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{restaurant.rating.toFixed(1)}</span>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground line-clamp-2">{restaurant.description}</p>

              {/* Address */}
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-muted-foreground">{restaurant.address}</p>
                  {restaurant.distance && (
                    <p className="text-xs text-muted-foreground mt-1">{restaurant.distance} away</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => onAddToItinerary(restaurant.id)}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Itinerary
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  {restaurant.menuUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewMenu(restaurant.menuUrl!)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Menu
                    </Button>
                  )}
                  {restaurant.mapsUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onGetDirections(restaurant.mapsUrl!)}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Directions
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
