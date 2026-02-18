#!/usr/bin/env node

/**
 * Script para remover TODAS as classes font-bold, font-semibold e font-medium
 * de TODOS os arquivos .tsx do projeto Ethertron, sem exceção.
 */

const fs = require('fs');
const path = require('path');

function removeBoldClasses(content) {
  let modified = content;
  let count = 0;

  // Substituir todas as classes bold
  const patterns = [
    { regex: /\s*font-bold\s*/g, replacement: ' ' },
    { regex: /\s*font-semibold\s*/g, replacement: ' ' },
    { regex: /\s*font-medium\s*/g, replacement: ' ' },
  ];

  patterns.forEach(({ regex, replacement }) => {
    const matches = (modified.match(regex) || []).length;
    count += matches;
    modified = modified.replace(regex, replacement);
  });

  // Limpar espaços duplicados em className
  modified = modified.replace(/className="([^"]*)"/g, (match, classes) => {
    return `className="${classes.split(/\s+/).filter(c => c).join(' ')}"`;
  });

  modified = modified.replace(/className='([^']*)'/g, (match, classes) => {
    return `className='${classes.split(/\s+/).filter(c => c).join(' ')}'`;
  });

  modified = modified.replace(/className=\{`([^`]*)`\}/g, (match, classes) => {
    return `className={\`${classes.split(/\s+/).filter(c => c).join(' ')}\`}`;
  });

  return { modified, count };
}

function findTsxFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results = results.concat(findTsxFiles(filePath));
    } else if (file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });

  return results;
}

function main() {
  console.log('='.repeat(80));
  console.log('🔍 REMOVENDO TODAS AS CLASSES BOLD DO ETHERTRON');
  console.log('='.repeat(80));
  console.log();

  const rootDir = path.join(__dirname, '..');
  const tsxFiles = findTsxFiles(rootDir);

  console.log(`📁 Encontrados ${tsxFiles.length} arquivos .tsx`);
  console.log();

  let totalModified = 0;
  let totalRemovals = 0;

  tsxFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { modified, count } = removeBoldClasses(content);

      if (count > 0) {
        fs.writeFileSync(filePath, modified, 'utf8');
        console.log(`✅ ${path.relative(rootDir, filePath)}: ${count} classes removidas`);
        totalModified++;
        totalRemovals += count;
      }
    } catch (error) {
      console.error(`❌ ${path.relative(rootDir, filePath)}: ${error.message}`);
    }
  });

  console.log();
  console.log('='.repeat(80));
  console.log('📊 RESUMO');
  console.log('='.repeat(80));
  console.log(`✅ Arquivos modificados: ${totalModified}`);
  console.log(`🔢 Total de classes bold removidas: ${totalRemovals}`);
  console.log();

  if (totalModified > 0) {
    console.log('🎉 TODOS OS TEXTOS BOLD FORAM REMOVIDOS COM SUCESSO!');
  } else {
    console.log('ℹ️  Nenhum arquivo precisou ser modificado.');
  }

  console.log('='.repeat(80));
}

main();
