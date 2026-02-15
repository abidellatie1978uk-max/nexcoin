/**
 * Componente para formatar valores monetários com centavos menores
 * Estilo profissional usado em apps financeiros modernos
 */

interface FormattedAmountProps {
  value: string | number;
  symbol?: string;
  className?: string;
  showSymbol?: boolean;
  decimalScale?: number; // Escala dos centavos em relação ao tamanho principal (0-1)
}

export function FormattedAmount({
  value,
  symbol,
  className = "text-xl font-light",
  showSymbol = true,
  decimalScale = 0.65 // 65% do tamanho principal por padrão
}: FormattedAmountProps) {
  // Converter número para string formatada se necessário
  let formattedValue = typeof value === 'number'
    ? value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    : value;

  // Separar parte inteira e decimal
  const parts = formattedValue.split(',');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '00';

  return (
    <span className={className}>
      {showSymbol && symbol && `${symbol} `}
      {integerPart}
      <span style={{ fontSize: `${decimalScale}em` }}>,{decimalPart}</span>
    </span>
  );
}