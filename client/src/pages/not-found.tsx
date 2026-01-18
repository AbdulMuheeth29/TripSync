import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plane, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
          <Plane className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold">TripSync</span>
      </div>

      <Card className="max-w-md w-full">
        <CardContent className="py-12 text-center">
          <div className="text-6xl font-bold text-primary mb-4">404</div>
          <h1 className="text-2xl font-semibold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/">
            <Button className="gap-2" data-testid="button-go-home">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
