/**
 * Utilitários para formatação de telefones PIX
 * PIX no Brasil não aceita código do país (+55)
 */

/**
 * Remove o código do país (+55) de um número de telefone brasileiro
 * e retorna apenas os dígitos para uso como chave PIX
 * 
 * Exemplos:
 * - "+5511999887766" → "11999887766"
 * - "+55 11 99988-7766" → "11999887766"
 * - "11999887766" → "11999887766"
 * - "(11) 99988-7766" → "11999887766"
 * 
 * @param phone - Número de telefone em qualquer formato
 * @returns Número de telefone formatado para PIX (apenas dígitos, sem +55)
 */
export function formatPhoneForPix(phone: string): string {
  if (!phone) return '';

  // 1. Remover todos os caracteres não numéricos exceto o +
  let cleaned = phone.trim();
  
  // 2. Remover código do país +55 se existir
  if (cleaned.startsWith('+55')) {
    cleaned = cleaned.substring(3); // Remove os primeiros 3 caracteres (+55)
  } else if (cleaned.startsWith('55')) {
    // Se começar com 55 (sem o +), também remover
    // Validar se realmente é código do país (deve ter 11 ou 12 dígitos depois)
    const onlyDigits = cleaned.replace(/\D/g, '');
    if (onlyDigits.length === 13 || onlyDigits.length === 14) {
      // 55 + 11 (DDD+telefone) ou 55 + 12 (DDD+9+telefone)
      cleaned = cleaned.substring(2);
    }
  }

  // 3. Remover todos os caracteres não numéricos
  const onlyDigits = cleaned.replace(/\D/g, '');

  // 4. Validar formato brasileiro (deve ter 10 ou 11 dígitos)
  // 10 dígitos: fixo (11) 3333-4444 → 1133334444
  // 11 dígitos: celular (11) 99988-7766 → 11999887766
  if (onlyDigits.length !== 10 && onlyDigits.length !== 11) {
    console.warn(`⚠️ Telefone com formato inválido para PIX: ${phone} (${onlyDigits.length} dígitos)`);
  }

  return onlyDigits;
}

/**
 * Valida se um número de telefone está no formato correto para PIX
 * 
 * @param phone - Número de telefone
 * @returns true se o formato é válido para PIX brasileiro
 */
export function isValidPixPhone(phone: string): boolean {
  if (!phone) return false;

  const cleaned = formatPhoneForPix(phone);
  
  // Deve ter 10 ou 11 dígitos
  if (cleaned.length !== 10 && cleaned.length !== 11) {
    return false;
  }

  // Deve começar com DDD válido (11-99)
  const ddd = parseInt(cleaned.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return false;
  }

  // Se tem 11 dígitos, o terceiro dígito deve ser 9 (celular)
  if (cleaned.length === 11) {
    const thirdDigit = cleaned.charAt(2);
    if (thirdDigit !== '9') {
      return false;
    }
  }

  return true;
}

/**
 * Formata um telefone para exibição (mantém formato original se já formatado)
 * Usado apenas para exibição, não para chave PIX
 * 
 * Exemplo:
 * - "11999887766" → "(11) 99988-7766"
 * 
 * @param phone - Número de telefone (apenas dígitos)
 * @returns Telefone formatado para exibição
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11) {
    // Formato: (11) 99988-7766
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  } else if (cleaned.length === 10) {
    // Formato: (11) 3333-4444
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  }

  return phone; // Retornar original se formato inválido
}

/**
 * Converte um número de telefone internacional para formato PIX
 * Se já estiver no formato correto, retorna como está
 * 
 * @param phone - Telefone em qualquer formato
 * @returns Telefone formatado para PIX
 */
export function normalizePhoneForPix(phone: string): string {
  if (!phone) return '';
  
  const formatted = formatPhoneForPix(phone);
  
  if (!isValidPixPhone(formatted)) {
    console.warn(`⚠️ Telefone não pôde ser normalizado para PIX: ${phone}`);
    return formatted; // Retornar mesmo assim (melhor que falhar)
  }

  return formatted;
}
