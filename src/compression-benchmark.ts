import * as zlib from "node:zlib";

// Generate a random string of given length (for random transaction fields)
function randomString(length: number): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// Transaction interface (example structure)
export interface ITransaction {
  type: string;
  tx_hash: string;
  internal_tx_id: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  payway: string;
  contract_id?: string;
  result: string;
  expiration: number;
  extra?: string;
  tx_data?: any;
  tx_info?: any;
}

// Generate an array of random transactions
function generateTransactions(count: number): ITransaction[] {
  return Array.from({ length: count }, (_, i) => ({
    type: randomString(10),
    tx_hash: randomString(64),
    internal_tx_id: randomString(32),
    from: randomString(34),
    to: randomString(34),
    amount: (Math.random() * 1000000).toFixed(2),
    fee: (Math.random() * 1000).toFixed(4),
    payway: randomString(5),
    contract_id: i % 10 === 0 ? randomString(20) : undefined,
    result: randomString(7),
    expiration: Date.now() + i * 1000,
    extra: i % 5 === 0 ? randomString(50) : undefined,
    tx_data: i % 3 === 0 ? { raw: randomString(100) } : undefined,
    tx_info: i % 7 === 0 ? { info: randomString(100) } : undefined,
  }));
}

// Gzip compress/decompress helpers
function gzipCompress(data: any): Buffer {
  // Compress data using gzip (default level)
  return zlib.gzipSync(Buffer.from(JSON.stringify(data)));
}
function gzipDecompress(buffer: Buffer): any {
  // Decompress gzip buffer and parse JSON
  return JSON.parse(zlib.gunzipSync(buffer).toString());
}

// Zstd decompress helper
function zstdDecompress(buffer: Buffer): any {
  return JSON.parse(zlib.zstdDecompressSync(buffer).toString());
}

// Zstd compress helper (with params)
function zstdCompress(data: any, params: Record<number, number> = {}): Buffer {
  return zlib.zstdCompressSync(
    Buffer.from(JSON.stringify(data)),
    params && Object.keys(params).length > 0 ? { params } : undefined
  );
}

// Main benchmark function
async function benchmark() {
  // Generate test data
  const transactions = generateTransactions(10000);

  // Gzip benchmark
  const gzipStart = process.hrtime.bigint();
  const gzipCompressed = gzipCompress(transactions);
  const gzipCompressTime = Number(process.hrtime.bigint() - gzipStart) / 1e6;

  const gzipDecompressStart = process.hrtime.bigint();
  const gzipDecompressed = gzipDecompress(gzipCompressed);
  const gzipDecompressTime =
    Number(process.hrtime.bigint() - gzipDecompressStart) / 1e6;

  // Zstd benchmark for different levels
  const zstdLevels = [1, 3, 6, 15, 22];
  const zstdResults = zstdLevels.map((level) => {
    // You can add more params (e.g., strategy) if needed

    const params = { [zlib.constants.ZSTD_c_compressionLevel]: level };
    const start = process.hrtime.bigint();
    const compressed = zstdCompress(transactions, params);
    const compressTime = Number(process.hrtime.bigint() - start) / 1e6;

    const decompressStart = process.hrtime.bigint();
    const decompressed = zstdDecompress(compressed);
    const decompressTime =
      Number(process.hrtime.bigint() - decompressStart) / 1e6;

    const isCorrect =
      JSON.stringify(decompressed) === JSON.stringify(transactions);

    return {
      algo: `zstd (level ${level})`,
      library: "node:zlib",
      compressTimeMs: compressTime.toFixed(2),
      decompressTimeMs: decompressTime.toFixed(2),
      compressedSizeMB: (compressed.byteLength / (1024 * 1024)).toFixed(2),
      correct: isCorrect,
    };
  });

  // Zstd default benchmark (no params)
  const zstdDefaultStart = process.hrtime.bigint();
  const zstdDefaultCompressed = zlib.zstdCompressSync(
    Buffer.from(JSON.stringify(transactions))
  );
  const zstdDefaultCompressTime =
    Number(process.hrtime.bigint() - zstdDefaultStart) / 1e6;

  const zstdDefaultDecompressStart = process.hrtime.bigint();
  const zstdDefaultDecompressed = zstdDecompress(zstdDefaultCompressed);
  const zstdDefaultDecompressTime =
    Number(process.hrtime.bigint() - zstdDefaultDecompressStart) / 1e6;
  const zstdDefaultCorrect =
    JSON.stringify(zstdDefaultDecompressed) === JSON.stringify(transactions);

  console.table([
    {
      algo: "gzip",
      library: "node:zlib",
      compressTimeMs: gzipCompressTime.toFixed(2),
      decompressTimeMs: gzipDecompressTime.toFixed(2),
      compressedSizeMB: (gzipCompressed.byteLength / (1024 * 1024)).toFixed(2),
      correct:
        JSON.stringify(gzipDecompressed) === JSON.stringify(transactions),
    },
    {
      algo: "zstd (default)",
      library: "node:zlib",
      compressTimeMs: zstdDefaultCompressTime.toFixed(2),
      decompressTimeMs: zstdDefaultDecompressTime.toFixed(2),
      compressedSizeMB: (
        zstdDefaultCompressed.byteLength /
        (1024 * 1024)
      ).toFixed(2),
      correct: zstdDefaultCorrect,
    },
    ...zstdResults,
  ]);

  /*
    Zstd default parameters in Node.js (zstdCompressSync without params):
    - Compression level: 3 (zlib.constants.ZSTD_c_compressionLevel)
    - Strategy: FAST (zlib.constants.ZSTD_c_strategy = 1)
    - All other advanced params: library defaults (see Node.js zlib docs)
    See: https://nodejs.org/api/zlib.html#zstd-constants
  */
}

benchmark();
