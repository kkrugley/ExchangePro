
import { API_URL } from '../constants';
import { ExchangeRates } from '../types';

export const fetchExchangeRates = async (baseCurrency: string): Promise<ExchangeRates> => {
  try {
    const response = await fetch(`${API_URL}${baseCurrency}`);
    if (!response.ok) throw new Error('Failed to fetch rates');
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error('Exchange Rate Fetch Error:', error);
    throw error;
  }
};
