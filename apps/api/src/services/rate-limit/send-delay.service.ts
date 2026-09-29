import redis from "../../lib/redis.js";

const RESERVE_DELAY_SLOT_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local delay = tonumber(ARGV[2])
local ttl = tonumber(ARGV[3])

local previous = redis.call("GET", key)

if not previous then
  local nextAllowed = now + delay
  redis.call("SET", key, nextAllowed, "PX", ttl)
  return now
end

local previousTime = tonumber(previous)
local sendAt = math.max(now, previousTime)

local nextAllowed = sendAt + delay

redis.call("SET", key, nextAllowed, "PX", ttl)

return sendAt
`;

export async function reserveSendDelay(
  senderId: string,
  delayMs: number,
  now = Date.now(),
): Promise<number> {
  const key = `send-delay:sender:${senderId}`;

  const ttl = Math.max(
    delayMs * 2,
    60_000,
  );

  const result = await redis.eval(
    RESERVE_DELAY_SLOT_SCRIPT,
    1,
    key,
    now,
    delayMs,
    ttl,
  );

  return Number(result);
}
