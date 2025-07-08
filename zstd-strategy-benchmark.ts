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
interface ITransaction {
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

// Decompress and parse JSON
function zstdDecompress(buffer: Buffer): any {
  return JSON.parse(zlib.zstdDecompressSync(buffer).toString());
}

// Zstd strategies (see Node.js zlib ZSTD_c_strategy docs)
const zstdStrategies = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const zstdStrategyNames = [
  "FAST",
  "DFAST",
  "GREEDY",
  "LAZY",
  "LAZY2",
  "BTLAZY2",
  "BTOPT",
  "BTULTRA",
  "BTULTRA2",
];

// Main benchmark function
async function benchmark() {
  // Generate test data
  const transactions = generateTransactions(10000);

  const results = zstdStrategies.map((strategy, i) => {
    // Start CPU usage and wall time
    const cpuStart = process.cpuUsage();
    const start = process.hrtime.bigint();

    // Compress with zstd, using strategy and compression level 3
    const compressed = zlib.zstdCompressSync(
      Buffer.from(JSON.stringify(transactions)),
      {
        params: {
          [zlib.constants.ZSTD_c_compressionLevel]: 3, // Compression level (default: 3)
          [zlib.constants.ZSTD_c_strategy]: strategy, // Compression strategy (1-9)
          // [zlib.constants.ZSTD_c_enableLongDistanceMatching]: false, // Enable/disable long distance matching (optional)
        },
      }
    );
    const compressTime = Number(process.hrtime.bigint() - start) / 1e6;
    const cpuEnd = process.cpuUsage(cpuStart);
    const cpuDeltaMs = (cpuEnd.user + cpuEnd.system) / 1000;

    // Decompress and measure time
    const decompressStart = process.hrtime.bigint();
    const decompressed = zstdDecompress(compressed);
    const decompressTime =
      Number(process.hrtime.bigint() - decompressStart) / 1e6;

    // Check if decompressed data matches original
    const isCorrect =
      JSON.stringify(decompressed) === JSON.stringify(transactions);

    return {
      strategy: zstdStrategyNames[i],
      compressTimeMs: compressTime.toFixed(2), // Wall time for compression
      cpuDeltaMs: cpuDeltaMs.toFixed(2), // CPU time for compression
      decompressTimeMs: decompressTime.toFixed(2),
      compressedSize: compressed.byteLength,
      correct: isCorrect,
    };
  });

  console.table(results);
}

benchmark();
