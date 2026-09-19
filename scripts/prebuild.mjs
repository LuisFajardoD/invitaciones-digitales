import { rm } from "fs/promises";
import path from "path";

const NEXT_DIR = path.join(process.cwd(), ".next");

async function main() {
  try {
    await rm(NEXT_DIR, { recursive: true, force: true });
    process.stdout.write("Cleaned .next before build.\n");
  } catch {
    // Ignore cleanup locks if any
  }
}

main().catch(() => {});
