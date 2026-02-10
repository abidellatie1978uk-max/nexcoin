/**
 * Capitaliza corretamente nomes próprios e endereços
 * Primeira letra de cada palavra em maiúscula, resto em minúscula
 * Exceções: preposições comuns ficam em minúscula (de, da, do, dos, das, e, etc.)
 */
export function capitalizeText(text: string): string {
  if (!text) return '';
  
  // Preposições e artigos que devem ficar em minúscula (exceto no início)
  const lowercaseWords = new Set([
    'de', 'da', 'do', 'dos', 'das', 'e', 'em', 'para', 'com', 'sem',
    'of', 'the', 'and', 'in', 'on', 'at', 'to', 'for', 'with',
    'del', 'la', 'el', 'los', 'las', 'y', 'en', 'por', 'con',
    'le', 'les', 'du', 'des', 'et', 'au', 'aux',
    'di', 'della', 'degli', 'delle',
  ]);

  return text
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Sempre capitalizar a primeira palavra
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      
      // Manter preposições em minúscula
      if (lowercaseWords.has(word)) {
        return word;
      }
      
      // Capitalizar outras palavras
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Capitaliza apenas a primeira letra da frase inteira
 * Usado para frases completas
 */
export function capitalizeSentence(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
