import { createCronClient } from "./supabase";

/**
 * Logs cron job execution to the cron_job_runs table.
 * Returns helpers to mark the run as success or error when done.
 */
export async function logCronRun(jobName: string) {
  const supabase = createCronClient();
  const startedAt = new Date();

  const { data } = await supabase
    .from("cron_job_runs")
    .insert({
      job_name: jobName,
      status: "running",
      started_at: startedAt.toISOString(),
    })
    .select("id")
    .single();

  const runId = data?.id;

  return {
    async success(recordsProcessed = 0) {
      if (!runId) return;
      const finishedAt = new Date();
      await supabase
        .from("cron_job_runs")
        .update({
          status: "success",
          records_processed: recordsProcessed,
          finished_at: finishedAt.toISOString(),
          duration_ms: finishedAt.getTime() - startedAt.getTime(),
        })
        .eq("id", runId);
    },
    async error(message: string) {
      if (!runId) return;
      const finishedAt = new Date();
      await supabase
        .from("cron_job_runs")
        .update({
          status: "error",
          error_message: message,
          finished_at: finishedAt.toISOString(),
          duration_ms: finishedAt.getTime() - startedAt.getTime(),
        })
        .eq("id", runId);
    },
  };
}
