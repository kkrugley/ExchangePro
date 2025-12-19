
export interface ExchangeRates {
  [currency: string]: number;
}

export interface CurrencyData {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export interface ConversionStep {
  from: string;
  to: string;
  midRate: number;
  appliedRate: number;
  marginPercent: number; // Individual margin for this specific step
  inputAmount: number;
  outputAmount: number;
  isManual: boolean;
}

export interface AnalysisResult {
  steps: ConversionStep[];
  totalAmount: number;
  directAmount: number;
  totalLossPercent: number;
  efficiency: number;
  monetaryLoss: number;
}
