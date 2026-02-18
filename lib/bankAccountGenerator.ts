// Gerador de dados de conta completos por país

export interface BankAccount {
  id: string;
  country: string;
  countryName: string;
  flagCode: string;
  currency: string;
  accountNumber: string;
  routingNumber?: string;
  iban?: string;
  swift?: string;
  bankName: string;
  bankCode?: string;
  branchCode?: string;
  sortCode?: string;
  accountType: string;
  createdAt: Date;
}

// Gerar número aleatório
const randomNumber = (length: number): string => {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
};

// Gerar conta bancária brasileira no formato: 12345678-9
const generateBrazilianAccount = (): string => {
  const accountBase = randomNumber(8); // 8 dígitos principais
  const dv = Math.floor(Math.random() * 10); // 1 dígito verificador
  return `${accountBase}-${dv}`;
};

// Gerar IBAN válido com dados fixos do banco
const generateIBAN = (countryCode: string, bankCode: string, accountNumber: string): string => {
  const checkDigits = randomNumber(2);
  return `${countryCode}${checkDigits}${bankCode}${accountNumber}`;
};

// Interface para dados bancários
interface BankData {
  bankCode?: string;
  branchCode?: string;
  sortCode?: string;
  routingNumber?: string;
  swift?: string;
}

// Dados fixos da Ethertron por país
const BANK_DATA: Record<string, BankData> = {
  BR: {
    bankCode: '336', // Código fixo da instituição
    branchCode: '0001', // Agência padrão
    swift: 'ETRBRBR',
  },
  US: {
    routingNumber: '021000021', // Routing number fixo
    swift: 'ETRUSNY',
  },
  PT: {
    bankCode: '0035', // Código da instituição
    swift: 'ETRPTPL',
  },
  ES: {
    bankCode: '2100', // Código da instituição
    swift: 'ETRESMM',
  },
  FR: {
    bankCode: '30004', // Código da instituição
    branchCode: '00001', // Code guichet
    swift: 'ETRFRPP',
  },
  DE: {
    bankCode: '10050000', // Bankleitzahl
    swift: 'ETRDEFF',
  },
  IT: {
    bankCode: '05034', // ABI
    branchCode: '01600', // CAB
    swift: 'ETRITM1',
  },
  GB: {
    sortCode: '60-16-13', // Sort code fixo
    swift: 'ETRGB2L',
  },
  NL: {
    bankCode: 'ETRC', // Identificador
    swift: 'ETRNL2A',
  },
  BE: {
    bankCode: '735', // Código da instituição
    swift: 'ETRBEBB',
  },
  CH: {
    bankCode: '00235', // BC-Nummer
    swift: 'ETRCHZZ',
  },
  AT: {
    bankCode: '12000', // Bankleitzahl
    swift: 'ETRATWW',
  },
  CA: {
    routingNumber: '000010001', // Transit + Institution number
    swift: 'ETRCATT',
  },
  AU: {
    routingNumber: '062-000', // BSB fixo
    swift: 'ETRAU2S',
  },
  MX: {
    bankCode: '072', // CLABE code
    swift: 'ETRMXMM',
  },
  AR: {
    bankCode: '336', // Código da instituição
    branchCode: '0001', // Sucursal
    swift: 'ETRARBA',
  },
  CL: {
    bankCode: '055', // Código da instituição
    swift: 'ETRCLRM',
  },
  CO: {
    bankCode: '0001', // Código de la institución
    swift: 'ETRCOBB',
  },
};

// Gerar dados de conta por país
export const generateBankAccountByCountry = (countryCode: string, userId?: string): BankAccount => {
  const accountId = userId ? `${userId}_${countryCode}_${Date.now()}` : `${countryCode}_${Date.now()}`;
  const createdAt = new Date();

  const bankData = BANK_DATA[countryCode as keyof typeof BANK_DATA];

  const accounts: Record<string, Omit<BankAccount, 'id' | 'createdAt'>> = {
    BR: {
      country: 'BR',
      countryName: 'Brasil',
      flagCode: 'br',
      currency: 'BRL',
      accountNumber: generateBrazilianAccount(),
      bankCode: bankData?.bankCode,
      branchCode: bankData?.branchCode,
      bankName: 'Ethertron transactions',
      accountType: 'Conta Corrente',
      swift: bankData?.swift,
    },
    US: {
      country: 'US',
      countryName: 'Estados Unidos',
      flagCode: 'us',
      currency: 'USD',
      accountNumber: randomNumber(12),
      routingNumber: bankData?.routingNumber,
      bankName: 'Ethertron transactions',
      accountType: 'Checking Account',
      swift: bankData?.swift,
    },
    PT: {
      country: 'PT',
      countryName: 'Portugal',
      flagCode: 'pt',
      currency: 'EUR',
      accountNumber: randomNumber(11),
      iban: generateIBAN('PT', bankData?.bankCode || '0000', randomNumber(11)),
      swift: bankData?.swift,
      bankName: 'Ethertron transactions',
      accountType: 'Conta à Ordem',
      bankCode: bankData?.bankCode,
    },
    ES: {
      country: 'ES',
      countryName: 'Espanha',
      flagCode: 'es',
      currency: 'EUR',
      accountNumber: randomNumber(10),
      iban: generateIBAN('ES', bankData?.bankCode || '0000', randomNumber(10)),
      swift: bankData?.swift,
      bankName: 'Ethertron transactions',
      accountType: 'Cuenta Corriente',
      bankCode: bankData?.bankCode,
    },
    FR: {
      country: 'FR',
      countryName: 'França',
      flagCode: 'fr',
      currency: 'EUR',
      accountNumber: randomNumber(11),
      iban: generateIBAN('FR', bankData?.bankCode || '00000', randomNumber(11)),
      swift: bankData?.swift,
      bankName: 'Ethertron transactions',
      accountType: 'Compte Courant',
      bankCode: bankData?.bankCode,
      branchCode: bankData?.branchCode,
    },
    DE: {
      country: 'DE',
      countryName: 'Alemanha',
      flagCode: 'de',
      currency: 'EUR',
      accountNumber: randomNumber(10),
      iban: generateIBAN('DE', bankData?.bankCode || '00000000', randomNumber(10)),
      swift: bankData?.swift,
      bankName: 'Ethertron transactions',
      accountType: 'Girokonto',
      bankCode: bankData?.bankCode,
    },
    IT: {
      country: 'IT',
      countryName: 'Itália',
      flagCode: 'it',
      currency: 'EUR',
      accountNumber: randomNumber(12),
      iban: generateIBAN('IT', (bankData?.bankCode || '00000') + (bankData?.branchCode || '00000'), randomNumber(12)),
      swift: bankData?.swift,
      bankName: 'Ethertron transactions',
      accountType: 'Conto Corrente',
      bankCode: bankData?.bankCode,
      branchCode: bankData?.branchCode,
    },
    GB: {
      country: 'GB',
      countryName: 'Reino Unido',
      flagCode: 'gb',
      currency: 'GBP',
      accountNumber: randomNumber(8),
      iban: generateIBAN('GB', bankData?.sortCode?.replace(/-/g, '') || '000000', randomNumber(8)),
      swift: bankData?.swift,
      bankName: 'Ethertron transactions',
      accountType: 'Current Account',
      sortCode: bankData?.sortCode,
    },
    NL: {
      country: 'NL',
      countryName: 'Holanda',
      flagCode: 'nl',
      currency: 'EUR',
      accountNumber: randomNumber(10),
      iban: generateIBAN('NL', bankData?.bankCode || 'ETRC', randomNumber(10)),
      swift: bankData?.swift,
      bankName: 'Ethertron transactions',
      accountType: 'Betaalrekening',
      bankCode: bankData?.bankCode,
    },
    BE: {
      country: 'BE',
      countryName: 'Bélgica',
      flagCode: 'be',
      currency: 'EUR',
      accountNumber: randomNumber(12),
      iban: generateIBAN('BE', bankData?.bankCode || '000', randomNumber(12)),
      swift: bankData?.swift,
      bankName: 'Ethertron transactions',
      accountType: 'Compte à Vue',
      bankCode: bankData?.bankCode,
    },
    CH: {
      country: 'CH',
      countryName: 'Suíça',
      flagCode: 'ch',
      currency: 'CHF',
      accountNumber: randomNumber(9),
      iban: generateIBAN('CH', bankData?.bankCode || '00000', randomNumber(9)),
      swift: bankData?.swift,
      bankName: 'Ethertron transactions',
      accountType: 'Privatkonto',
      bankCode: bankData?.bankCode,
    },
    AT: {
      country: 'AT',
      countryName: 'Áustria',
      flagCode: 'at',
      currency: 'EUR',
      accountNumber: randomNumber(11),
      iban: generateIBAN('AT', bankData?.bankCode || '00000', randomNumber(11)),
      swift: bankData?.swift,
      bankName: 'Ethertron transactions',
      accountType: 'Girokonto',
      bankCode: bankData?.bankCode,
    },
    CA: {
      country: 'CA',
      countryName: 'Canadá',
      flagCode: 'ca',
      currency: 'CAD',
      accountNumber: randomNumber(12),
      routingNumber: bankData?.routingNumber,
      swift: bankData?.swift,
      bankName: 'Ethertron transactions',
      accountType: 'Chequing Account',
    },
    AU: {
      country: 'AU',
      countryName: 'Austrália',
      flagCode: 'au',
      currency: 'AUD',
      accountNumber: randomNumber(9),
      routingNumber: bankData?.routingNumber, // BSB
      swift: bankData?.swift,
      bankName: 'Ethertron transactions',
      accountType: 'Transaction Account',
    },
    MX: {
      country: 'MX',
      countryName: 'México',
      flagCode: 'mx',
      currency: 'MXN',
      accountNumber: randomNumber(18),
      bankCode: bankData?.bankCode,
      swift: bankData?.swift,
      bankName: 'Ethertron transactions',
      accountType: 'Cuenta de Cheques',
    },
    AR: {
      country: 'AR',
      countryName: 'Argentina',
      flagCode: 'ar',
      currency: 'ARS',
      accountNumber: randomNumber(14),
      bankCode: bankData?.bankCode,
      branchCode: bankData?.branchCode,
      swift: bankData?.swift,
      bankName: 'Ethertron transactions',
      accountType: 'Cuenta Corriente',
    },
    CL: {
      country: 'CL',
      countryName: 'Chile',
      flagCode: 'cl',
      currency: 'CLP',
      accountNumber: randomNumber(12),
      bankCode: bankData?.bankCode,
      swift: bankData?.swift,
      bankName: 'Ethertron transactions',
      accountType: 'Cuenta Corriente',
    },
    CO: {
      country: 'CO',
      countryName: 'Colômbia',
      flagCode: 'co',
      currency: 'COP',
      accountNumber: randomNumber(11),
      bankCode: bankData?.bankCode,
      swift: bankData?.swift,
      bankName: 'Ethertron transactions',
      accountType: 'Cuenta de Ahorros',
    },
  };

  const baseAccount = accounts[countryCode] || {
    country: countryCode,
    countryName: 'País',
    flagCode: countryCode.toLowerCase(),
    currency: 'USD',
    accountNumber: randomNumber(10),
    iban: generateIBAN(countryCode, '0000', randomNumber(10)),
    swift: `ETR${countryCode}XX`,
    bankName: 'Ethertron transactions',
    accountType: 'Account',
  };

  return {
    id: accountId,
    ...baseAccount,
    createdAt,
  };
};

// Obter países disponíveis para criação de conta
export const getAvailableCountries = () => {
  return [
    { code: 'BR', name: 'Brasil', flag: 'br', currency: 'BRL' },
    { code: 'US', name: 'Estados Unidos', flag: 'us', currency: 'USD' },
    { code: 'PT', name: 'Portugal', flag: 'pt', currency: 'EUR' },
    { code: 'ES', name: 'Espanha', flag: 'es', currency: 'EUR' },
    { code: 'FR', name: 'França', flag: 'fr', currency: 'EUR' },
    { code: 'DE', name: 'Alemanha', flag: 'de', currency: 'EUR' },
    { code: 'IT', name: 'Itália', flag: 'it', currency: 'EUR' },
    { code: 'GB', name: 'Reino Unido', flag: 'gb', currency: 'GBP' },
    { code: 'NL', name: 'Holanda', flag: 'nl', currency: 'EUR' },
    { code: 'BE', name: 'Bélgica', flag: 'be', currency: 'EUR' },
    { code: 'CH', name: 'Suíça', flag: 'ch', currency: 'CHF' },
    { code: 'AT', name: 'Áustria', flag: 'at', currency: 'EUR' },
    { code: 'CA', name: 'Canadá', flag: 'ca', currency: 'CAD' },
    { code: 'AU', name: 'Austrália', flag: 'au', currency: 'AUD' },
    { code: 'MX', name: 'México', flag: 'mx', currency: 'MXN' },
    { code: 'AR', name: 'Argentina', flag: 'ar', currency: 'ARS' },
    { code: 'CL', name: 'Chile', flag: 'cl', currency: 'CLP' },
    { code: 'CO', name: 'Colômbia', flag: 'co', currency: 'COP' },
  ];
};