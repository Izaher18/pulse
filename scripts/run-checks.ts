import "dotenv/config";
import { runDueChecks } from "../src/lib/checker";

const TICK_MS = 10_000;
const watch = process.argv.includes("--watch");

async function tick() {
  const summary = await runDueChecks();
  console.log(new Date().toISOString(), summary);
}

async function main() {
  if (!watch) {
    await tick();
    return;
  }

  let stopping = false;

  const stop = () => {
    stopping = true;
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  console.log(`Watching monitors; polling for due checks every ${TICK_MS / 1000}s`);

  while (!stopping) {
    const started = Date.now();
    try {
      await tick();
    } catch (error) {
      console.error(error);
    }

    const wait = TICK_MS - (Date.now() - started);
    if (wait > 0 && !stopping) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
