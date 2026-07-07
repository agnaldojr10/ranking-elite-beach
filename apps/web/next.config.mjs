import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@reb/contracts'],
  // Build autossuficiente para Docker: gera .next/standalone com server.js e apenas
  // as dependências usadas. Na Vercel (VERCEL=1) o build é nativo — standalone atrapalha.
  output: process.env.VERCEL ? undefined : 'standalone',
  // Em monorepo, garante que o rastreamento de arquivos parta da raiz (workspaces).
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
