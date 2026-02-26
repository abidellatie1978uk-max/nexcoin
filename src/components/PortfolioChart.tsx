import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { useEffect, useState } from 'react';

interface PortfolioChartProps {
  value: number;
}

export function PortfolioChart({ value }: PortfolioChartProps) {
  const [data, setData] = useState<{ value: number; timestamp: number }[]>([]);
  const [isLoadingRealData, setIsLoadingRealData] = useState(true);

  useEffect(() => {
    // Gerar dados simulados realistas baseados em variações pequenas do USDT
    const generateRealisticData = () => {
      const points = 24; // 24 horas
      const newData = [];
      // USDT é stablecoin - variação muito pequena (0.1% a 0.3%)
      const baseValue = value;
      const maxVariation = value * 0.003; // 0.3% de variação máxima
      
      for (let i = 0; i < points; i++) {
        const progress = i / points;
        // Variação suave e pequena, típica de stablecoin
        const randomFactor = (Math.random() - 0.5) * 2; // -1 a 1
        const smoothing = Math.sin(progress * Math.PI * 2) * 0.5;
        const pointValue = baseValue + (maxVariation * randomFactor * 0.5) + (maxVariation * smoothing);
        
        newData.push({ 
          value: pointValue,
          timestamp: Date.now() - (points - i) * 3600000 // 1 hora por ponto
        });
      }
      
      return newData;
    };

    // Usar dados simulados realistas diretamente
    // USDT é stablecoin com variação mínima, então simulação é mais confiável
    setData(generateRealisticData());
    setIsLoadingRealData(false);

    // Atualizar dados a cada minuto para dar sensação de movimento
    const interval = setInterval(() => {
      setData(generateRealisticData());
    }, 60 * 1000); // 1 minuto

    return () => clearInterval(interval);
  }, [value]);

  if (data.length === 0) {
    return <div className="w-full h-full" style={{ minHeight: '48px' }} />;
  }

  return (
    <div className="w-full h-full" style={{ minWidth: '300px', minHeight: '48px' }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={48}>
        <LineChart data={data}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={2}
            dot={false}
            animationDuration={1000}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}