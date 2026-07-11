import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const tripBasicsSchema = z.object({
  tripName: z.string().min(3, "Trip name must be at least 3 characters"),
  destination: z.string().min(2, "Please enter a destination"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  groupSize: z.number().min(1).max(20),
  budget: z.number().min(0),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type TripBasicsForm = z.infer<typeof tripBasicsSchema>;

interface Step1TripBasicsProps {
  onNext: (data: TripBasicsForm) => void;
  defaultValues?: Partial<TripBasicsForm>;
}

export function Step1TripBasics({ onNext, defaultValues }: Step1TripBasicsProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<TripBasicsForm>({
    resolver: zodResolver(tripBasicsSchema),
    defaultValues: {
      tripName: defaultValues?.tripName || "",
      destination: defaultValues?.destination || "",
      startDate: defaultValues?.startDate,
      endDate: defaultValues?.endDate,
      groupSize: defaultValues?.groupSize || 2,
      budget: defaultValues?.budget || 1000,
    }
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const groupSize = watch("groupSize");
  const budget = watch("budget");

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Let's start with the basics</h2>
        <p className="text-muted-foreground">Tell us about your trip</p>
      </div>

      {/* Trip Name */}
      <div className="space-y-2">
        <Label htmlFor="tripName">Trip Name</Label>
        <Input
          id="tripName"
          placeholder="e.g., Summer Adventure in Bali"
          {...register("tripName")}
          className={errors.tripName ? "border-red-500" : ""}
        />
        {errors.tripName && (
          <p className="text-sm text-red-500">{errors.tripName.message}</p>
        )}
      </div>

      {/* Destination */}
      <div className="space-y-2">
        <Label htmlFor="destination">
          <MapPin className="inline h-4 w-4 mr-1" />
          Destination
        </Label>
        <Input
          id="destination"
          placeholder="Where are you going?"
          {...register("destination")}
          className={errors.destination ? "border-red-500" : ""}
        />
        {errors.destination && (
          <p className="text-sm text-red-500">{errors.destination.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Try: "Bali, Indonesia" or "Paris, France"
        </p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            <CalendarIcon className="inline h-4 w-4 mr-1" />
            Start Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground",
                  errors.startDate && "border-red-500"
                )}
              >
                {startDate ? format(startDate, "PP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setValue("startDate", date)}
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
          {errors.startDate && (
            <p className="text-sm text-red-500">{errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground",
                  errors.endDate && "border-red-500"
                )}
              >
                {endDate ? format(endDate, "PP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => date && setValue("endDate", date)}
                disabled={(date) => !startDate || date <= startDate}
              />
            </PopoverContent>
          </Popover>
          {errors.endDate && (
            <p className="text-sm text-red-500">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      {/* Group Size */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>
            <Users className="inline h-4 w-4 mr-1" />
            Group Size
          </Label>
          <span className="text-sm font-medium">{groupSize} {groupSize === 1 ? "person" : "people"}</span>
        </div>
        <Slider
          value={[groupSize]}
          onValueChange={(value) => setValue("groupSize", value[0])}
          min={1}
          max={20}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Including yourself
        </p>
      </div>

      {/* Budget */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>
            <DollarSign className="inline h-4 w-4 mr-1" />
            Budget per Person
          </Label>
          <span className="text-sm font-medium">${budget.toLocaleString()}</span>
        </div>
        <Slider
          value={[budget]}
          onValueChange={(value) => setValue("budget", value[0])}
          min={100}
          max={10000}
          step={100}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$100</span>
          <span>Total: ${(budget * groupSize).toLocaleString()}</span>
          <span>$10,000</span>
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg">
        Continue to Trip Vibe
      </Button>
    </form>
  );
}
