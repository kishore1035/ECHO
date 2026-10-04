import { access, readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import ts from '../node_modules/typescript/lib/typescript.js';

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (error?.code !== 'ERR_MODULE_NOT_FOUND' || !context.parentURL || !specifier.startsWith('.')) throw error;
    const base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    for (const extension of ['.ts', '.tsx', '.js']) {
      const candidate = `${base}${extension}`;
      try {
        await access(candidate);
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
      } catch {}
    }
    throw error;
  }
}

export async function load(url, context, nextLoad) {
  if (!url.endsWith('.tsx')) return nextLoad(url, context);
  const source = await readFile(fileURLToPath(url), 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2023,
    },
    fileName: fileURLToPath(url),
  });
  return { format: 'module', source: result.outputText, shortCircuit: true };
}
