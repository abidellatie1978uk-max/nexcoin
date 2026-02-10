/**
 * API do ViaCEP - Busca endereço pelo CEP
 * Documentação: https://viacep.com.br/
 */

export interface ViaCepResponse {
  cep: string;
  logradouro: string; // Rua
  complemento: string;
  bairro: string;
  localidade: string; // Cidade
  uf: string; // Estado
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export async function searchCep(cep: string): Promise<ViaCepResponse | null> {
  try {
    // Remove formatação do CEP (apenas números)
    const cleanCep = cep.replace(/\D/g, '');
    
    // Validar se tem 8 dígitos
    if (cleanCep.length !== 8) {
      return null;
    }

    // Fazer requisição para API do ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar CEP');
    }

    const data: ViaCepResponse = await response.json();
    
    // Verificar se o CEP existe
    if (data.erro) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar CEP:', error);
    return null;
  }
}
