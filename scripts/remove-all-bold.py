#!/usr/bin/env python3
"""
Script para remover TODAS as classes font-bold, font-semibold e font-medium
de TODOS os arquivos .tsx do projeto Ethertron, sem exceção.
"""

import os
import re
from pathlib import Path

def remove_bold_classes(content: str) -> tuple[str, int]:
    """
    Remove todas as classes font-bold, font-semibold e font-medium do conteúdo.
    Retorna o conteúdo modificado e o número de substituições feitas.
    """
    count = 0
    
    # Padrões para remover (com possíveis espaços antes/depois)
    patterns = [
        (r'\s*font-bold\s*', ' '),
        (r'\s*font-semibold\s*', ' '),
        (r'\s*font-medium\s*', ' '),
    ]
    
    for pattern, replacement in patterns:
        content, n = re.subn(pattern, replacement, content)
        count += n
    
    # Limpar espaços duplicados dentro de className
    content = re.sub(r'className="([^"]*)"', lambda m: f'className="{" ".join(m.group(1).split())}"', content)
    content = re.sub(r"className='([^']*)'", lambda m: f"className='{' '.join(m.group(1).split())}'", content)
    content = re.sub(r'className=\{`([^`]*)`\}', lambda m: f'className={{`{" ".join(m.group(1).split())}`}}', content)
    
    return content, count

def process_file(file_path: Path) -> dict:
    """
    Processa um arquivo .tsx removendo todas as classes bold.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        modified_content, count = remove_bold_classes(original_content)
        
        if count > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(modified_content)
            
            return {
                'file': str(file_path),
                'count': count,
                'status': 'modified'
            }
        else:
            return {
                'file': str(file_path),
                'count': 0,
                'status': 'unchanged'
            }
    
    except Exception as e:
        return {
            'file': str(file_path),
            'count': 0,
            'status': 'error',
            'error': str(e)
        }

def main():
    """
    Função principal que processa todos os arquivos .tsx do projeto.
    """
    # Diretório raiz do projeto (assumindo que o script está em /scripts)
    root_dir = Path(__file__).parent.parent
    
    print("=" * 80)
    print("🔍 REMOVENDO TODAS AS CLASSES BOLD DO ETHERTRON")
    print("=" * 80)
    print()
    
    # Encontrar todos os arquivos .tsx
    tsx_files = list(root_dir.rglob('*.tsx'))
    
    print(f"📁 Encontrados {len(tsx_files)} arquivos .tsx")
    print()
    
    # Processar cada arquivo
    results = []
    for file_path in sorted(tsx_files):
        result = process_file(file_path)
        results.append(result)
        
        # Mostrar progresso
        if result['status'] == 'modified':
            print(f"✅ {result['file']}: {result['count']} classes removidas")
        elif result['status'] == 'error':
            print(f"❌ {result['file']}: ERRO - {result.get('error', 'Unknown')}")
    
    print()
    print("=" * 80)
    print("📊 RESUMO")
    print("=" * 80)
    
    # Estatísticas
    modified_count = sum(1 for r in results if r['status'] == 'modified')
    total_removals = sum(r['count'] for r in results)
    error_count = sum(1 for r in results if r['status'] == 'error')
    
    print(f"✅ Arquivos modificados: {modified_count}")
    print(f"🔢 Total de classes bold removidas: {total_removals}")
    print(f"❌ Erros: {error_count}")
    print()
    
    if modified_count > 0:
        print("🎉 TODOS OS TEXTOS BOLD FORAM REMOVIDOS COM SUCESSO!")
    else:
        print("ℹ️ Nenhum arquivo precisou ser modificado.")
    
    print("=" * 80)

if __name__ == '__main__':
    main()
