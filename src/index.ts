import { createApp } from "./app";
import { requireSessionEnv, requirePort } from "./env";
import { createVoyagerClient } from "./voyager/client";
import { createAxiosTransport } from "./voyager/transport";

async function main(): Promise<void> {
  const session = requireSessionEnv();

  const client = createVoyagerClient({
    transport: createAxiosTransport(session),
  });
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
