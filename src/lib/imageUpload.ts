import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Faz upload de uma imagem para o Firebase Storage e retorna a URL de download
 * @param file - Arquivo da imagem
 * @param userId - ID do usuário (para organizar as pastas)
 * @param folder - Pasta onde salvar (ex: 'profile-photos')
 * @returns URL de download da imagem
 */
export async function uploadImage(
  file: File,
  userId: string,
  folder: string = 'profile-photos'
): Promise<string> {
  try {
    // Gerar nome único para o arquivo usando timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}_${timestamp}.${fileExtension}`;
    
    // Criar referência no Storage
    const storageRef = ref(storage, `${folder}/${fileName}`);
    
    // Fazer upload do arquivo
    console.log('📤 Fazendo upload da imagem...');
    const snapshot = await uploadBytes(storageRef, file);
    console.log('✅ Upload concluído:', snapshot.metadata.fullPath);
    
    // Obter URL de download
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ URL de download obtida:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('❌ Erro ao fazer upload da imagem:', error);
    throw new Error('Erro ao fazer upload da imagem. Tente novamente.');
  }
}

/**
 * Deleta uma imagem do Firebase Storage usando a URL
 * @param imageUrl - URL completa da imagem no Firebase Storage
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extrair o caminho da imagem da URL
    // Formato: https://firebasestorage.googleapis.com/v0/b/PROJECT/o/FOLDER%2FFILENAME?alt=media&token=TOKEN
    const urlParts = imageUrl.split('/o/');
    if (urlParts.length < 2) {
      console.warn('⚠️ URL inválida, não é possível deletar');
      return;
    }
    
    const pathWithToken = urlParts[1].split('?')[0];
    const filePath = decodeURIComponent(pathWithToken);
    
    // Criar referência e deletar
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    console.log('✅ Imagem deletada:', filePath);
  } catch (error) {
    console.error('❌ Erro ao deletar imagem:', error);
    // Não propagar erro - não é crítico se a imagem antiga não for deletada
  }
}

/**
 * Comprime uma imagem antes de fazer upload
 * @param file - Arquivo da imagem
 * @param maxWidth - Largura máxima (padrão: 800px)
 * @param maxHeight - Altura máxima (padrão: 800px)
 * @param quality - Qualidade da compressão (0-1, padrão: 0.8)
 * @returns Arquivo comprimido
 */
export async function compressImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calcular dimensões mantendo aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
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
        
        // Converter para blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erro ao comprimir imagem'));
              return;
            }
            
            // Criar novo arquivo a partir do blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            console.log('✅ Imagem comprimida:');
            console.log('   Original:', (file.size / 1024).toFixed(2), 'KB');
            console.log('   Comprimida:', (compressedFile.size / 1024).toFixed(2), 'KB');
            
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
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
