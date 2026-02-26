/**
 * Formata valores monetários (moedas fiat e stablecoins)
 * Sempre 2 casas decimais com separadores pt-BR
 * Exemplo: 100.000,00 ou 100,00
 */
export function formatCurrency(value: number | string, currency?: string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0,00';
  
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
  
  // Se especificou moeda, adiciona símbolo
  if (currency) {
    const symbols: { [key: string]: string } = {
      USD: '$',
      BRL: 'R$',
      GBP: '£',
      EUR: '€',
    };
    const symbol = symbols[currency] || '';
    return symbol ? `${symbol} ${formatted}` : formatted;
  }
  
  return formatted;
}

/**
 * Formata quantidades de criptomoedas
 * Remove zeros desnecessários no final
 * Exemplo: 0,5 BTC (não 0,50000000 BTC)
 */
export function formatCrypto(value: number): string {
  if (value === 0) return '0';
  
  // Para valores muito pequenos, usa até 8 casas decimais
  if (value < 0.00000001) return value.toFixed(8);
  
  // Para valores pequenos, usa precisão adequada sem zeros trailing
  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
  
  // Remove zeros desnecessários após a vírgula
  return formatted.replace(/,(\d*?)0+$/, ',$1').replace(/,$/, '');
}

/**
 * Formata números genéricos com precisão variável
 * Para usar em contextos que precisam de flexibilidade
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formata percentuais
 * Exemplo: +2,50% ou -1,23%
 */
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals).replace('.', ',')}%`;
}