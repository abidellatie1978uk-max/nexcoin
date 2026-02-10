import { useState } from 'react';

interface CryptoIconProps {
  symbol: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

// URLs diretas do CoinGecko (sem proxy - mais rápido e confiável)
const CRYPTO_ICONS: Record<string, string> = {
  'BTC': 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png',
  'ETH': 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png',
  'USDT': 'https://coin-images.coingecko.com/coins/images/325/large/Tether.png',
  'TETHER': 'https://coin-images.coingecko.com/coins/images/325/large/Tether.png',
  'BNB': 'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  'SOL': 'https://coin-images.coingecko.com/coins/images/4128/large/solana.png',
  'XRP': 'https://coin-images.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  'ADA': 'https://coin-images.coingecko.com/coins/images/975/large/cardano.png',
  'AVAX': 'https://coin-images.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
  'DOGE': 'https://coin-images.coingecko.com/coins/images/5/large/dogecoin.png',
  'DOT': 'https://coin-images.coingecko.com/coins/images/12171/large/polkadot.png',
  'MATIC': 'https://coin-images.coingecko.com/coins/images/4713/large/matic-token-icon.png',
  'LINK': 'https://coin-images.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
  'UNI': 'https://coin-images.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  'LTC': 'https://coin-images.coingecko.com/coins/images/2/large/litecoin.png',
  'ATOM': 'https://coin-images.coingecko.com/coins/images/1481/large/cosmos_hub.png',
  'XLM': 'https://coin-images.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png',
  'TRX': 'https://coin-images.coingecko.com/coins/images/1094/large/tron-logo.png',
  'SHIB': 'https://coin-images.coingecko.com/coins/images/11939/large/shiba.png',
  'WBTC': 'https://coin-images.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png',
  'DAI': 'https://coin-images.coingecko.com/coins/images/9956/large/4943.png',
  'LEO': 'https://coin-images.coingecko.com/coins/images/8418/large/leo-token.png',
  'USDC': 'https://coin-images.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
  'TON': 'https://coin-images.coingecko.com/coins/images/17980/large/ton_symbol.png',
  'ETC': 'https://coin-images.coingecko.com/coins/images/453/large/ethereum-classic-logo.png',
  'BCH': 'https://coin-images.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png',
  'APT': 'https://coin-images.coingecko.com/coins/images/26455/large/aptos_round.png',
  'ARB': 'https://coin-images.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg',
  'OP': 'https://coin-images.coingecko.com/coins/images/25244/large/Optimism.png',
  'ICP': 'https://coin-images.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png',
  'FIL': 'https://coin-images.coingecko.com/coins/images/12817/large/filecoin.png',
  'NEAR': 'https://coin-images.coingecko.com/coins/images/10365/large/near_icon.png',
  'VET': 'https://coin-images.coingecko.com/coins/images/1167/large/VeChain-Logo-768x725.png',
  'ALGO': 'https://coin-images.coingecko.com/coins/images/4380/large/download.png',
  'INJ': 'https://coin-images.coingecko.com/coins/images/12882/large/Secondary_Symbol.png',
  'AAVE': 'https://coin-images.coingecko.com/coins/images/12645/large/AAVE.png',
  'MKR': 'https://coin-images.coingecko.com/coins/images/1364/large/Mark_Maker.png',
  'GRT': 'https://coin-images.coingecko.com/coins/images/13397/large/Graph_Token.png',
  'IMX': 'https://coin-images.coingecko.com/coins/images/17233/large/imx.png',
  'STX': 'https://coin-images.coingecko.com/coins/images/2069/large/Stacks_logo_full.png',
  'HBAR': 'https://coin-images.coingecko.com/coins/images/3688/large/hbar.png',
  'FTM': 'https://coin-images.coingecko.com/coins/images/4001/large/Fantom.png',
  'SAND': 'https://coin-images.coingecko.com/coins/images/12129/large/sandbox_logo.jpg',
  'MANA': 'https://coin-images.coingecko.com/coins/images/878/large/decentraland-mana.png',
  'AXS': 'https://coin-images.coingecko.com/coins/images/13029/large/axie_infinity_logo.png',
  'XTZ': 'https://coin-images.coingecko.com/coins/images/976/large/Tezos-logo.png',
  'THETA': 'https://coin-images.coingecko.com/coins/images/2538/large/theta-token-logo.png',
  'EOS': 'https://coin-images.coingecko.com/coins/images/738/large/eos-eos-logo.png',
  'XMR': 'https://coin-images.coingecko.com/coins/images/69/large/monero_logo.png',
  'FLOW': 'https://coin-images.coingecko.com/coins/images/13446/large/flow.png',
  'CHZ': 'https://coin-images.coingecko.com/coins/images/8834/large/Chiliz.png',
  'ZEC': 'https://coin-images.coingecko.com/coins/images/486/large/circle-zcash-color.png',
  'RUNE': 'https://coin-images.coingecko.com/coins/images/6595/large/TC-Icon-Round-Dark.png',
  'KLAY': 'https://coin-images.coingecko.com/coins/images/9672/large/klaytn.png',
  'DASH': 'https://coin-images.coingecko.com/coins/images/19/large/dash-logo.png',
  'NEO': 'https://coin-images.coingecko.com/coins/images/480/large/NEO_512_512.png',
  'IOTA': 'https://coin-images.coingecko.com/coins/images/692/large/IOTA_Swirl.png',
  'QNT': 'https://coin-images.coingecko.com/coins/images/3370/large/5ZOu7brX_400x400.jpg',
  'EGLD': 'https://coin-images.coingecko.com/coins/images/12335/large/egld-token-logo.png',
  'PEPE': 'https://coin-images.coingecko.com/coins/images/29850/large/pepe-token.jpeg',
  'FET': 'https://coin-images.coingecko.com/coins/images/5681/large/Fetch.jpg',
  'SUI': 'https://coin-images.coingecko.com/coins/images/26375/large/sui_asset.jpeg',
  'SEI': 'https://coin-images.coingecko.com/coins/images/28205/large/sei_icon.jpg',
  // Moedas Fiat
  'BRL': 'https://flagcdn.com/w80/br.png',
  'USD': 'https://flagcdn.com/w80/us.png',
  'EUR': 'https://flagcdn.com/w80/eu.png',
  'GBP': 'https://flagcdn.com/w80/gb.png',
};

// Cores de fallback para cada moeda
const CRYPTO_COLORS: Record<string, string> = {
  'BTC': '#F7931A',
  'ETH': '#627EEA',
  'USDT': '#26A17B',
  'TETHER': '#26A17B',
  'BNB': '#F3BA2F',
  'SOL': '#14F195',
  'XRP': '#23292F',
  'ADA': '#0033AD',
  'AVAX': '#E84142',
  'DOGE': '#C2A633',
  'DOT': '#E6007A',
  'MATIC': '#8247E5',
  'LINK': '#2A5ADA',
  'UNI': '#FF007A',
  'LTC': '#345D9D',
  'ATOM': '#2E3148',
  'XLM': '#14B6E7',
  'TRX': '#EB0029',
  'SHIB': '#FFA409',
  'WBTC': '#F09242',
  'DAI': '#F5AC37',
  'LEO': '#D33C40',
  'USDC': '#2775CA',
  'TON': '#0088CC',
  'ETC': '#328432',
  'BCH': '#8DC351',
  'APT': '#000000',
  'ARB': '#28A0F0',
  'OP': '#FF0420',
  'ICP': '#29ABE2',
  'FIL': '#0090FF',
  'NEAR': '#000000',
  'VET': '#15BDFF',
  'ALGO': '#000000',
  'INJ': '#00F2FE',
  'AAVE': '#B6509E',
  'MKR': '#1AAB9B',
  'GRT': '#6747ED',
  'IMX': '#0B0D23',
  'STX': '#5546FF',
  'HBAR': '#000000',
  'FTM': '#13B5EC',
  'SAND': '#00ADEF',
  'MANA': '#FF2D55',
  'AXS': '#0055D5',
  'XTZ': '#2C7DF7',
  'THETA': '#2AB8E6',
  'EOS': '#000000',
  'XMR': '#FF6600',
  'FLOW': '#00EF8B',
  'CHZ': '#CD0124',
  'ZEC': '#F4B728',
  'RUNE': '#00CCFF',
  'KLAY': '#FF3D00',
  'DASH': '#008CE7',
  'NEO': '#58BF00',
  'IOTA': '#000000',
  'QNT': '#1A1A1A',
  'EGLD': '#000000',
  'PEPE': '#22C55E',
  'FET': '#0714FE',
  'SUI': '#6FBCF0',
  'SEI': '#A91B1B',
};

export function CryptoIcon({ symbol, size = 'md' }: CryptoIconProps) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconUrl = CRYPTO_ICONS[symbol.toUpperCase()] || CRYPTO_ICONS['BTC'];
  const fallbackColor = CRYPTO_COLORS[symbol.toUpperCase()] || '#6B7280';

  // Se a imagem falhar ao carregar, mostra fallback com cor e símbolo
  if (imageError) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white shadow-md`}
        style={{ backgroundColor: fallbackColor }}
      >
        <span className={size === 'xs' ? 'text-[8px]' : size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-sm'}>
          {symbol.toUpperCase().slice(0, 3)}
        </span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center bg-white shadow-md`}>
      <img 
        src={iconUrl} 
        alt={`${symbol} icon`}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
        crossOrigin="anonymous"
        loading="lazy"
      />
    </div>
  );
}