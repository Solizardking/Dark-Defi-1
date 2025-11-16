import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap: true,
      inlineDynamicImports: true,
    },
    {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true,
    },
  ],
  external: [
    '@coral-xyz/anchor',
    '@solana/web3.js',
    '@solana/spl-token',
    'helius-sdk',
    '@solana/kit',
    'bs58',
    'buffer',
    'tweetnacl',
    'bip39',
    'bip32',
    'eventemitter3',
    '@noble/hashes',
    '@noble/hashes/blake3',
    '@noble/hashes/sha256',
    '@noble/ciphers',
    '@noble/ciphers/chacha',
    'react',
    'react-dom',
    'react/jsx-runtime',
    'jupiverse-kit',
  ],
  plugins: [
    resolve({
      preferBuiltins: true,
      browser: true,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
      outDir: './dist',
    }),
    json(),
  ],
};
