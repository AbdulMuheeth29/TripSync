import { useQuery } from "@tanstack/react-query";

const BASE = "USD";
const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "MXN", "THB", "INR"] as const;

async function fetchRates(): Promise<Record<string, number>> {
  const currencies = CURRENCIES.filter((c) => c !== BASE).join(",");
  const res = await fetch(
    `https://api.frankfurter.app/latest?from=${BASE}&to=${currencies}`,
    { signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) throw new Error("Exchange rates unavailable");
  const data = (await res.json()) as { rates: Record<string, number> };
  return { [BASE]: 1, ...data.rates };
}

export function useExchangeRates() {
  const query = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: fetchRates,
    staleTime: 1000 * 60 * 15,
    retry: 1,
  });

  function convert(amount: number, fromCurrency: string, toCurrency: string): number | null {
    const rates = query.data;
    if (!rates || fromCurrency === toCurrency) return amount;
    const fromRate = rates[fromCurrency] ?? null;
    const toRate = rates[toCurrency] ?? null;
    if (fromRate == null || toRate == null) return null;
    return (amount / fromRate) * toRate;
  }

  return { rates: query.data, isLoading: query.isLoading, convert, currencies: CURRENCIES };
}
