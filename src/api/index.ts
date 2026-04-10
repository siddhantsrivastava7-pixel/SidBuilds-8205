import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface LicenseRecord {
  createdAt: string;
  expiresAt: string;
  activated: boolean;
}

type Bindings = {
  RECALL_LICENSES: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('api');

app.use(cors({ origin: '*' }));

app.get('/ping', (c) => c.json({ message: `Pong! ${Date.now()}` }));

// ─── Rate limit helpers ────────────────────────────────────────────────────────

const RATE_WINDOW_MS  = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT      = 3;              // max 3 keys per IP per hour

async function isRateLimited(kv: KVNamespace, ip: string): Promise<boolean> {
  const rateKey = `rate:${ip}`;
  const raw = await kv.get(rateKey);
  const count = raw ? parseInt(raw, 10) : 0;
  return count >= RATE_LIMIT;
}

async function incrementRate(kv: KVNamespace, ip: string): Promise<void> {
  const rateKey = `rate:${ip}`;
  const raw = await kv.get(rateKey);
  const count = raw ? parseInt(raw, 10) : 0;
  await kv.put(rateKey, String(count + 1), { expirationTtl: Math.floor(RATE_WINDOW_MS / 1000) });
}

// ─── Key generation ────────────────────────────────────────────────────────────

function generateSegment(): string {
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0').toUpperCase()).join('').slice(0, 4);
}

async function generateUniqueKey(kv: KVNamespace): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const key = `RC-TRIAL-${generateSegment()}-${generateSegment()}`;
    const existing = await kv.get(`license:${key}`);
    if (!existing) return key;
  }
  throw new Error('Failed to generate unique key');
}

// ─── POST /api/generate-trial ──────────────────────────────────────────────────

app.post('/generate-trial', async (c) => {
  const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown';

  if (await isRateLimited(c.env.RECALL_LICENSES, ip)) {
    return c.json({ error: 'Too many requests. Try again later.' }, 429);
  }

  const key = await generateUniqueKey(c.env.RECALL_LICENSES);
  const now = Date.now();
  const record: LicenseRecord = {
    createdAt:  new Date(now).toISOString(),
    expiresAt:  new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
    activated:  false,
  };

  await c.env.RECALL_LICENSES.put(`license:${key}`, JSON.stringify(record));
  await incrementRate(c.env.RECALL_LICENSES, ip);

  return c.json({ key });
});

// ─── POST /api/validate-key ────────────────────────────────────────────────────

app.post('/validate-key', async (c) => {
  const body = await c.req.json<{ key?: string }>();
  const key = body?.key?.trim().toUpperCase();

  if (!key) {
    return c.json({ valid: false, expired: false, error: 'Key is required.' }, 400);
  }

  const raw = await c.env.RECALL_LICENSES.get(`license:${key}`);
  if (!raw) {
    return c.json({ valid: false, expired: false });
  }

  const record: LicenseRecord = JSON.parse(raw);
  const expired = Date.now() > new Date(record.expiresAt).getTime();

  return c.json({ valid: !expired, expired });
});

export default app;
