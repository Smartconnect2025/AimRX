import cron from "node-cron";
import { checkRefills } from "./jobs/refill-check";

let started = false;

/**
 * Register and start all cron jobs.
 * Called once from instrumentation.ts on server startup.
 */
export function startCronJobs() {
  if (started) return;
  started = true;

  // Refill eligibility check — runs daily at 8:00 AM UTC
  cron.schedule("0 8 * * *", () => {
    checkRefills();
  });

  console.log("[cron] Jobs registered");
}
