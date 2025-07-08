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

function zstdDecompress(buffer: Buffer): any {
  return JSON.parse(zlib.zstdDecompressSync(buffer).toString());
}

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
const zstdLevels = [3, 9, 15];

async function benchmark() {
  const transactions = generateTransactions(10000);
  const results: any[] = [];

  // Add the result for default zstd (no params) at the top
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

  results.unshift({
    strategy: "DEFAULT",
    level: 3,
    compressTimeMs: zstdDefaultCompressTime.toFixed(2),
    cpuDeltaMs: "",
    decompressTimeMs: zstdDefaultDecompressTime.toFixed(2),
    compressedSizeMB: (
      zstdDefaultCompressed.byteLength /
      (1024 * 1024)
    ).toFixed(2),
    correct: zstdDefaultCorrect,
  });

  /*
    Zstd default parameters in Node.js (zstdCompressSync without params):
    - Compression level: 3 (zlib.constants.ZSTD_c_compressionLevel)
    - Strategy: FAST (zlib.constants.ZSTD_c_strategy = 1)
    - All other advanced params: library defaults (see Node.js zlib docs)
    See: https://nodejs.org/api/zlib.html#zstd-constants
  */

  for (const level of zstdLevels) {
    for (let i = 0; i < zstdStrategies.length; ++i) {
      const strategy = zstdStrategies[i];
      const cpuStart = process.cpuUsage();
      const start = process.hrtime.bigint();
      const compressed = zlib.zstdCompressSync(
        Buffer.from(JSON.stringify(transactions)),
        {
          params: {
            [zlib.constants.ZSTD_c_compressionLevel]: level,
            [zlib.constants.ZSTD_c_strategy]: strategy,
          },
        }
      );
      const compressTime = Number(process.hrtime.bigint() - start) / 1e6;
      const cpuEnd = process.cpuUsage(cpuStart);
      const cpuDeltaMs = (cpuEnd.user + cpuEnd.system) / 1000;

      const decompressStart = process.hrtime.bigint();
      const decompressed = zstdDecompress(compressed);
      const decompressTime =
        Number(process.hrtime.bigint() - decompressStart) / 1e6;
      const isCorrect =
        JSON.stringify(decompressed) === JSON.stringify(transactions);

      results.push({
        strategy: zstdStrategyNames[i],
        level,
        compressTimeMs: compressTime.toFixed(2),
        cpuDeltaMs: cpuDeltaMs.toFixed(2),
        decompressTimeMs: decompressTime.toFixed(2),
        compressedSizeMB: (compressed.byteLength / (1024 * 1024)).toFixed(2),
        correct: isCorrect,
      });
    }
  }

  console.table(results);
}

benchmark();
