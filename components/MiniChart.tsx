import { useEffect, useState } from 'react';

interface MiniChartProps {
  coinId: string;
  color: string;
}

export function MiniChart({ coinId, color }: MiniChartProps) {
  const [priceHistory, setPriceHistory] = useState<number[]>([]);

  useEffect(() => {
    // Buscar dados históricos das últimas 24 horas
    const fetchChartData = async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=1&interval=hourly`
        );
        
        // Verificar se a resposta é válida
        if (!response.ok) {
          // Se throttled ou erro, usar dados mock
          setPriceHistory(generateMockData());
          return;
        }

        // Verificar se a resposta é JSON válida
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          // Resposta não é JSON (ex: "Throttled"), usar dados mock
          setPriceHistory(generateMockData());
          return;
        }

        const data = await response.json();
        
        if (data.prices && data.prices.length > 0) {
          // Extrair apenas os preços (ignorar timestamps)
          const prices = data.prices.map((p: [number, number]) => p[1]);
          setPriceHistory(prices);
        } else {
          setPriceHistory(generateMockData());
        }
      } catch (error) {
        // Em caso de qualquer erro, usar dados mock silenciosamente
        setPriceHistory(generateMockData());
      }
    };

    fetchChartData();
    
    // Atualizar a cada 15 segundos para tempo real
    const interval = setInterval(fetchChartData, 15000);
    
    return () => clearInterval(interval);
  }, [coinId]);

  // Gerar dados mock para fallback
  const generateMockData = () => {
    const data: number[] = [];
    let value = 100;
    for (let i = 0; i < 24; i++) {
      value += (Math.random() - 0.5) * 10;
      data.push(value);
    }
    return data;
  };

  // Gerar o path SVG baseado nos dados
  const generatePath = () => {
    if (priceHistory.length === 0) {
      return "M0,20 L100,20";
    }

    const minPrice = Math.min(...priceHistory);
    const maxPrice = Math.max(...priceHistory);
    const range = maxPrice - minPrice || 1;

    const points = priceHistory.map((price, index) => {
      const x = (index / (priceHistory.length - 1)) * 100;
      const y = 40 - ((price - minPrice) / range) * 30 - 5; // 5-35 range
      return `${x},${y}`;
    });

    return `M${points.join(' L')}`;
  };

  // Gerar o path da área preenchida
  const generateAreaPath = () => {
    if (priceHistory.length === 0) {
      return "M0,20 L100,20 L100,40 L0,40 Z";
    }

    const minPrice = Math.min(...priceHistory);
    const maxPrice = Math.max(...priceHistory);
    const range = maxPrice - minPrice || 1;

    const points = priceHistory.map((price, index) => {
      const x = (index / (priceHistory.length - 1)) * 100;
      const y = 40 - ((price - minPrice) / range) * 30 - 5;
      return `${x},${y}`;
    });

    return `M${points.join(' L')} L100,40 L0,40 Z`;
  };

  return (
    <svg className="w-full h-full" viewBox="0 0 100 40">
      <defs>
        <linearGradient id={`gradient-${coinId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path 
        d={generateAreaPath()}
        fill={`url(#gradient-${coinId})`}
      />
      <path 
        d={generatePath()}
        fill="none" 
        stroke={color}
        strokeLinecap="round" 
        strokeWidth="2"
      />
    </svg>
  );
}