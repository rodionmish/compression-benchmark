# Compression Benchmark: Gzip vs Zstd (Node.js)

This project benchmarks and compares the performance and compression efficiency of Gzip and Zstandard (zstd) algorithms using the native Node.js `zlib` module (Node.js v24+ required).

## Features

- **Compare Gzip and Zstd**: Speed, compression ratio, and decompression speed.
- **Test different zstd compression levels and strategies**.
- **Resource usage**: CPU time measurement for each compression.
- **Randomized, realistic transaction data for benchmarking.**

## Requirements

- **Node.js v24.0.0 or newer** (zstd support is experimental and only available in Node.js 24+)
- `npm` (for installing dependencies, if any)

## Files

- `compression-benchmark.ts` — Main benchmark: compares Gzip and Zstd at different compression levels.
- `zstd-strategy-benchmark.ts` — Advanced: compares all zstd compression strategies at a fixed level.

## How to Run

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd compression-benchmark
   ```
2. **Install dependencies (if any):**
   ```sh
   npm install
   ```
3. **Run the benchmarks:**
   - With ts-node (recommended for TypeScript):
     ```sh
     npx ts-node compression-benchmark.ts
     npx ts-node zstd-strategy-benchmark.ts
     ```
   - Or compile to JS and run with node:
     ```sh
     tsc compression-benchmark.ts
     tsc zstd-strategy-benchmark.ts
     node compression-benchmark.js
     node zstd-strategy-benchmark.js
     ```

## Example Output

```
┌─────────┬──────────────────────┬─────────────┬────────────────┬──────────────────┬────────────────┬─────────┐
│ (index) │ algo                 │ library     │ compressTimeMs │ decompressTimeMs │ compressedSize │ correct │
├─────────┼──────────────────────┼─────────────┼────────────────┼──────────────────┼────────────────┼─────────┤
│ 0       │ 'gzip'               │ 'node:zlib' │ '20.85'        │ '9.56'           │ 219633         │ true    │
│ 1       │ 'zstd (level 1)'     │ 'node:zlib' │ '8.97'         │ '8.36'           │ 198138         │ true    │
│ 2       │ 'zstd (level 3)'     │ 'node:zlib' │ '8.55'         │ '21.48'          │ 198138         │ true    │
│ ...     │ ...                  │ ...         │ ...            │ ...              │ ...            │ ...     │
└─────────┴──────────────────────┴─────────────┴────────────────┴──────────────────┴────────────────┴─────────┘
```

## How it works

- **Random transaction data** is generated to simulate real-world payloads.
- **Compression and decompression** are performed for each algorithm/parameter set.
- **Metrics measured:**
  - Compression time (ms)
  - Decompression time (ms)
  - Compressed size (bytes)
  - CPU time (for strategy benchmark)
  - Correctness (data integrity after decompression)

## Customization

- You can change the number of transactions or the structure in the scripts.
- You can add more zstd parameters (see [Node.js zlib zstd constants](https://nodejs.org/api/zlib.html#zstd-constants)).

## License

MIT
