import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";

const POPULAR_CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
];

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  label?: string;
  showConversion?: boolean;
  baseCurrency?: string;
  exchangeRate?: number;
}

export function CurrencySelector({
  value,
  onChange,
  label = "Currency",
  showConversion = false,
  baseCurrency,
  exchangeRate
}: CurrencySelectorProps) {
  const selectedCurrency = POPULAR_CURRENCIES.find(c => c.code === value);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <DollarSign className="h-4 w-4" />
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue>
            {selectedCurrency ? (
              <span>
                {selectedCurrency.symbol} {selectedCurrency.code} - {selectedCurrency.name}
              </span>
            ) : "Select currency"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {POPULAR_CURRENCIES.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <span className="flex items-center gap-2">
                <span className="font-mono">{currency.symbol}</span>
                <span className="font-medium">{currency.code}</span>
                <span className="text-muted-foreground">- {currency.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showConversion && baseCurrency && exchangeRate && value !== baseCurrency && (
        <p className="text-xs text-muted-foreground">
          1 {value} = {exchangeRate.toFixed(4)} {baseCurrency}
        </p>
      )}
    </div>
  );
}
