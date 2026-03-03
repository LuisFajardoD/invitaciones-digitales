import { rm } from "fs/promises";
import path from "path";

const NEXT_DIR = path.join(process.cwd(), ".next");

async function main() {
  await rm(NEXT_DIR, { recursive: true, force: true });
  process.stdout.write("Cleaned .next before build.\n");
}

main().catch((error) => {
  process.stderr.write(`Failed to clean .next before build: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
