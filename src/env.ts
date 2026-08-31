export interface SessionEnv {
  liAt: string;
  jsessionid: string;
}

export function requireSessionEnv(env: NodeJS.ProcessEnv = process.env): SessionEnv {
  const liAt = env.LINKEDIN_LI_AT;
  const jsessionid = env.LINKEDIN_JSESSIONID;

  if (!liAt) {
    throw new Error("Missing required env var LINKEDIN_LI_AT. Set it to the LinkedIn 'li_at' session cookie.");
  }
  if (!jsessionid) {
    throw new Error("Missing required env var LINKEDIN_JSESSIONID. Set it to the LinkedIn 'JSESSIONID' session cookie.");
  }

  return { liAt, jsessionid };
}

export function requirePort(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.PORT;
  if (!raw) return 4000;
  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${raw}`);
  }
  return port;
}
