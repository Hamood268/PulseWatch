const { MonitorsModel } = require("../Database/Schemas/monitorsSchema");
const cron = require("node-cron");

function startSchedulerForMonitor(monitor) {
  const task = cron.schedule(
    convertIntervalToCron(monitor.interval),
    async () => {
      const start = Date.now();
      try {
        let status;
        let response;
        let statusMessage;
        let responseTime;

        console.log(`🔍 Checking: ${monitor.name} (${monitor.url})`);

        try {
          response = await fetch(monitor.url);
          responseTime = Date.now() - start;
          console.log(`API response time: ${responseTime}ms`);

          if (response.status >= 400) {
            status = "Down";
          } else {
            status = "Up";
          }
        } catch (fetchError) {
          console.log(
            `error fetching endpoint: ${monitor.url}`,
            "Error: ",
            fetchError
          );
          statusMessage = fetchError.message;
          status = "Down";
        }

        const fresh = await MonitorsModel.findById(monitor._id);

        await MonitorsModel.findOneAndUpdate(
          monitor._id,
          {
            $set: {
              status: status,
              lastCheckedAt: new Date(),
              lastResponseTime: responseTime,
              consecutiveFails:
                status === "Down" ? (monitor.consecutiveFails || 0) + 1 : 0,
            },
            $push: {
              history: {
                $each: [
                  {
                    status: status,
                    timestamp: new Date(),
                    message: statusMessage,
                    responseTime: responseTime,
                  },
                ],
                $slice: -100,
              },
            },
          },
          { new: true }
        );

        console.log("Scheduler ran successfully!");
      } catch (error) {
        console.log("error in scheduler: ", error);
      }
    }
  );
  return task;
}

let activeTasks = [];

async function restartScheduler(monitor) {
  try {
    console.log("Restarting scheduler for:", monitor.monitorId);

    if (activeTasks[monitor.monitorId]) {
      activeTasks[monitor.monitorId].stop();
      delete activeTasks[monitor.monitorId];
    }

    const fresh = await MonitorsModel.findOne({monitorId: monitor.monitorId});
    if (!fresh) return;

    const task = startSchedulerForMonitor(fresh);
    activeTasks[monitor.monitorId] = task;

    console.log("Scheduler restarted successfully!");
  } catch (error) {
    console.log("Error restarting scheduler:", error);
  }
}

function convertIntervalToCron(intervalSeconds) {
  // Common intervals
  switch (intervalSeconds) {
    case 30:
      return "*/30 * * * * *"; // Every 30 seconds
    case 60:
      return "* * * * *"; // Every 1 minute
    case 300:
      return "*/5 * * * *"; // Every 5 minutes
    case 600:
      return "*/10 * * * *"; // Every 10 minutes
    case 900:
      return "*/15 * * * *"; // Every 15 minutes
    case 1800:
      return "*/30 * * * *"; // Every 30 minutes
    case 2700:
      return "*/45 * * * *"; // Every 45 minutes
    case 3600:
      return "0 * * * *"; // Every hour
    case 7200:
      return "0 */2 * * *"; // Every 2 hours
    default:
      // For custom intervals, use minutes (rounded)
      const minutes = Math.floor(intervalSeconds / 60);
      if (minutes < 1) return "* * * * *"; // Default to 1 minute if less
      return `*/${minutes} * * * *`;
  }
}

module.exports = { startSchedulerForMonitor, restartScheduler };
