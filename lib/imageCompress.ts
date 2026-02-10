/**
 * Comprime uma imagem para um tamanho muito pequeno adequado para salvar no Firestore
 * @param file - Arquivo da imagem
 * @param maxSize - Tamanho máximo em pixels (padrão: 200x200 para avatares)
 * @param quality - Qualidade da compressão (0-1, padrão: 0.7)
 * @returns String base64 da imagem comprimida
 */
export async function compressImageToBase64(
  file: File,
  maxSize: number = 200,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calcular dimensões mantendo aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        // Criar canvas para redimensionar
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'));
          return;
        }
        
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para base64 com compressão
        const base64 = canvas.toDataURL('image/jpeg', quality);
        
        // Verificar tamanho (base64 = ~4/3 do tamanho em bytes)
        const sizeInBytes = (base64.length * 3) / 4;
        const sizeInKB = sizeInBytes / 1024;
        
        console.log('✅ Imagem comprimida:');
        console.log(`   Original: ${(file.size / 1024).toFixed(2)} KB`);
        console.log(`   Comprimida: ${sizeInKB.toFixed(2)} KB`);
        console.log(`   Dimensões: ${width}x${height}`);
        
        // Se ainda estiver muito grande, comprimir mais
        if (sizeInKB > 100 && quality > 0.3) {
          console.log('⚠️ Imagem ainda muito grande, comprimindo mais...');
          compressImageToBase64(file, maxSize * 0.8, quality * 0.7)
            .then(resolve)
            .catch(reject);
          return;
        }
        
        resolve(base64);
      };
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Valida se uma imagem base64 está dentro do limite de tamanho do Firestore
 * @param base64 - String base64 da imagem
 * @param maxSizeKB - Tamanho máximo em KB (padrão: 100KB)
 * @returns true se está dentro do limite
 */
export function validateImageSize(base64: string, maxSizeKB: number = 100): boolean {
  const sizeInBytes = (base64.length * 3) / 4;
  const sizeInKB = sizeInBytes / 1024;
  return sizeInKB <= maxSizeKB;
}
