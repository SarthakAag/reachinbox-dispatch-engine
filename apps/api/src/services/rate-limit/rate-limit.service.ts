import redis from "../../lib/redis.js";

export interface RateLimitReservation {
  allowed: boolean;
  slot: number;
  retryAt: number;
}


const RESERVE_SLOT_SCRIPT = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local now = tonumber(ARGV[2])
local ttl = tonumber(ARGV[3])

local current = redis.call("INCR", key)

if current == 1 then
  redis.call("EXPIRE", key, ttl)
end

if current <= limit then
  return {1, current, 0}
end

redis.call("DECR", key)

local nextHour = math.floor(now / 3600) * 3600 + 3600

return {0, current - 1, nextHour}
`;

export async function reserveSenderSlot(
  senderId: string,
  hourlyLimit: number,
  now = Date.now(),
): Promise<RateLimitReservation> {
  const hour = Math.floor(now / 3_600_000);
  const key = `rate-limit:sender:${senderId}:hour:${hour}`;

  const currentSecond = Math.floor(now / 1000);
  const secondsUntilExpiry = 3_601 - (currentSecond % 3_600);

  const result = (await redis.eval(
    RESERVE_SLOT_SCRIPT,
    1,
    key,
    hourlyLimit,
    Math.floor(now / 1000),
    secondsUntilExpiry,
  )) as [number, number, number];

  const [allowed, slot, retryAtSeconds] = result;

  return {
    allowed: allowed === 1,
    slot,
    retryAt:
      retryAtSeconds > 0
        ? retryAtSeconds * 1000
        : now,
  };
}
