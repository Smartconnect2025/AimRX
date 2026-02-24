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

  // Refill eligibility check — runs daily at 00:00 CST (06:00 UTC)
  cron.schedule(
    "0 6 * * *",
    () => {
      console.log("[cron] Running refill-check...");
      checkRefills();
    },
    { timezone: "UTC" },
  );
}
