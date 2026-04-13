#!/usr/bin/env node
/**
 * Script para corregir comillas dobles a simples en archivos TypeScript
 * Preserva comillas en JSX (atributos) y template literals (backticks)
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SRC_DIR = './src';

function getAllFiles(dir, files = []) {
  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (!item.startsWith('.') && !['node_modules', '.next', 'dist', 'coverage'].includes(item)) {
        getAllFiles(fullPath, files);
      }
    } else if (['.ts', '.tsx'].includes(extname(item))) {
      files.push(fullPath);
    }
  }
  return files;
}

function fixQuotes(content) {
  let result = '';
  let i = 0;

  while (i < content.length) {
    const char = content[i];
    const nextChar = content[i + 1];
    const prevChar = content[i - 1];

    // Preservar template literals (backticks)
    if (char === '`') {
      let j = i + 1;
      while (j < content.length && content[j] !== '`') {
        if (content[j] === '\\') j++;
        j++;
      }
      result += content.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    // Preservar JSX (comillas dentro de < ... >)
    // Detectar si estamos en un atributo JSX
    const isJSXAttribute = /\s[a-zA-Z-]+[=]$/.test(content.slice(0, i));

    // Si es comilla doble y no es JSX attribute, reemplazar
    if (char === '"' && !isJSXAttribute) {
      // Verificar que no sea un import con nombre entre comillas
      const lineStart = content.lastIndexOf('\n', i) + 1;
      const line = content.slice(lineStart, i);

      // Preservar imports de CSS/modules
      if (/import\s+.*\s+from\s+$/.test(line)) {
        result += '"';
      } else {
        result += "'";
      }
    } else {
      result += char;
    }

    i++;
  }

  return result;
}

// Procesar archivos
const files = getAllFiles(SRC_DIR);
let fixed = 0;

for (const file of files) {
  try {
    const content = readFileSync(file, 'utf-8');
    const fixedContent = fixQuotes(content);

    if (content !== fixedContent) {
      writeFileSync(file, fixedContent, 'utf-8');
      fixed++;
      console.log(`✓ ${file}`);
    }
  } catch (e) {
    console.error(`✗ ${file}: ${e.message}`);
  }
}

console.log(`\n${fixed} archivos corregidos`);
