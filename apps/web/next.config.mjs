import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@reb/contracts'],
  // Build autossuficiente para Docker: gera .next/standalone com server.js
  // e apenas as dependências efetivamente usadas (imagem enxuta).
  output: 'standalone',
  // Em monorepo, garante que o rastreamento de arquivos do standalone
  // parta da raiz (inclui os pacotes workspace corretamente).
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
