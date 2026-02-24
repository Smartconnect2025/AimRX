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

  // Refill eligibility check — runs daily at 4:23 AM UTC (1:23 AM Argentina GMT-3)
  cron.schedule(
    "10 13 * * *",
    () => {
      console.log("[cron] Running refill-check...");
      checkRefills();
    },
    { timezone: "UTC" },
  );
}
