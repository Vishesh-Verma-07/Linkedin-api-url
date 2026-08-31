import { createApp } from "./app";
import { requireSessionEnv, requirePort } from "./env";
import type { VoyagerClient } from "./voyager/client";

async function main(): Promise<void> {
  requireSessionEnv();

  const client: VoyagerClient = { kind: "voyager-client" };
  const app = createApp(client);
  const port = requirePort();

  app.listen(port, () => {
    console.log(`LinkedIn companion service listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
