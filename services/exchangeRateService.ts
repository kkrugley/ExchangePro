
import { API_URL } from '../constants';
import { ExchangeRates } from '../types';

export class ExchangeRateError extends Error {
  constructor(public message: string, public type: 'network' | 'unsupported' | 'not-found' | 'server' | 'unknown') {
    super(message);
    this.name = 'ExchangeRateError';
  }
}

export const fetchExchangeRates = async (baseCurrency: string): Promise<ExchangeRates> => {
  try {
    const response = await fetch(`${API_URL}${baseCurrency}`);
    
    if (response.status === 404) {
      throw new ExchangeRateError(`Валюта ${baseCurrency} не найдена.`, 'not-found');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData['error-type'] === 'unsupported-code') {
        throw new ExchangeRateError(`Код валюты ${baseCurrency} не поддерживается API.`, 'unsupported');
      }
      throw new ExchangeRateError('Проблема на стороне сервера курсов.', 'server');
    }

    const data = await response.json();
    
    if (data.result === 'error') {
      throw new ExchangeRateError(data['error-type'] || 'Ошибка API', 'server');
    }

    return data.rates;
  } catch (error) {
    if (error instanceof ExchangeRateError) throw error;
    
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ExchangeRateError('Нет соединения с интернетом. Проверьте сеть.', 'network');
    }
    
    console.error('Exchange Rate Fetch Error:', error);
    throw new ExchangeRateError('Неизвестная ошибка при получении курсов.', 'unknown');
  }
};
