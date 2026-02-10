interface FlagIconProps {
  countryCode: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FlagIcon({ countryCode, size = 'md' }: FlagIconProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const imageSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  // Map country codes to lowercase for the API
  const countryCodeMap: Record<string, string> = {
    BR: 'br',
    US: 'us',
    PT: 'pt',
    ES: 'es',
    FR: 'fr',
    DE: 'de',
    IT: 'it',
    GB: 'gb',
    NL: 'nl',
    BE: 'be',
    CH: 'ch',
    AT: 'at',
    EU: 'eu',
  };

  const code = countryCodeMap[countryCode] || countryCode.toLowerCase();
  const flagUrl = `https://flagcdn.com/w80/${code}.png`;

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden`}>
      <img 
        src={flagUrl} 
        alt={`${countryCode} flag`}
        className={`${imageSizeClasses[size]} object-cover rounded-full`}
        onError={(e) => {
          // Fallback to text if image fails to load
          e.currentTarget.style.display = 'none';
          if (e.currentTarget.nextSibling) {
            (e.currentTarget.nextSibling as HTMLElement).style.display = 'block';
          }
        }}
      />
      <span className="text-sm hidden">{countryCode}</span>
    </div>
  );
}