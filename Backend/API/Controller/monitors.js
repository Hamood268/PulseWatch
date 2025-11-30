const { MonitorsModel } = require("../../Database/Schemas/monitorsSchema.js");
const {
  startSchedulerForMonitor,
} = require("../../Utilities/monitorScheduler.js");
const { generateID } = require("../../Utilities/generateRandomID.js");

const newMonitor = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, url, interval } = req.body;

    let urlRegex =
      /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

    if (!name) {
      return res.status(400).json({
        code: 400,
        status: "Bad Request",
        message: "API name is required",
      });
    }

    if (!urlRegex.test(url)) {
      return res.status(400).json({
        code: 400,
        status: "Bad Request",
        message: "Invalid url format",
      });
    }

    if (!interval) {
      return res.status(400).json({
        code: 400,
        status: "Bad Request",
        message: "Interval is required",
      });
    }
    if (isNaN(interval)) {
      return res.status(400).json({
        code: 400,
        status: "Bad Request",
        message: "Interval must be a number in seconds",
      });
    }

    const validIntervals = [30, 60, 300, 600, 1800, 3600];
    if (!validIntervals.includes(Number(interval))) {
      return res.status(400).json({
        code: 400,
        status: "Bad Request",
        message:
          "Interval must be one of: 30, 60, 300, 600, 1800, 3600 seconds",
      });
    }

    const newEndpoint = await MonitorsModel.create({
      userId: userId,
      monitorId: generateID(16),
      name: name,
      url: url.trim(),
      interval: Number(interval),
    });

    startSchedulerForMonitor(newEndpoint);

    res.status(201).json({
      code: 201,
      status: "Created",
      message: "Monitor created successfully",
      monitor: {
        monitorId: newEndpoint.monitorId,
        name: newEndpoint.name,
        url: newEndpoint.url,
        interval: newEndpoint.interval,
        status: newEndpoint.status,
      },
    });
  } catch (error) {
    console.log("error in POST /v1/monitors/new", error);
    res.status(500).json({
      code: 500,
      status: "Internal Server Error",
      message: "Server error try again later...",
    });
  }
};

const getAllMonitors = async (req, res) => {
  try {
    const userId = req.user.userId;

    const monitors = await MonitorsModel.find({ userId: userId });

    if (monitors.length === 0) {
      return res.status(200).json({
        code: 200,
        status: "Success",
        monitors: [],
      });
    }

    if (!userId) {
      return res.status(400).json({
        code: 400,
        status: "Bad Request",
        message: "userId is required",
      });
    }

    res.status(200).json({
      code: 200,
      status: "Success",
      monitors: monitors,
    });
  } catch (error) {
    console.log("error in GET /v1/monitors/get", error);
    res.status(500).json({
      code: 500,
      status: "Internal Server Error",
      message: "Server error try again later...",
    });
  }
};

const deleteMonitor = async (req, res) => {
  try {
    const { monitorId } = req.params;
    const userId = req.user.userId;

    const monitor = await MonitorsModel.findOne({
      monitorId: monitorId,
      userId,
    });

    if (!monitor) {
      return res.status(404).json({
        code: 404,
        status: "Not Found",
        message: "Monitor not found or unauthorized",
      });
    }

    await MonitorsModel.deleteOne({ monitorId: monitorId });

    res.status(200).json({
      code: 200,
      status: "Success",
      message: "Monitor deleted successfully",
    });
  } catch (error) {
    console.log("error in DELETE /v1/monitors/:monitorId", error);
    res.status(500).json({
      code: 500,
      status: "Internal Server Error",
      message: "Server error try again later...",
    });
  }
};

const updateMonitor = async (req, res) => {
  try {
    const { monitorId } = req.params;
    const userId = req.user.userId;

    const { name, url, interval } = req.body;

    const monitor = await MonitorsModel.findOne({
      monitorId: monitorId,
      userId,
    });

    if (!monitor) {
      return res.status(404).json({
        code: 404,
        status: "Not Found",
        message: "Monitor not found or unauthorized",
      });
    }

    const changes = {};
    let needsSchedulerRestart = false;

    if (name) {
      const trimmedName = name.trim();
      if (trimmedName !== monitor.name) {
        monitor.name = trimmedName;
        changes.name = trimmedName;
      }
    }

    if (url) {
      const urlRegex =
        /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;
      
      if (!urlRegex.test(url.trim())) {
        return res.status(400).json({
          code: 400,
          status: "Bad Request",
          message: "Invalid url format",
        });
      }

      const trimmedUrl = url.trim();
      if (trimmedUrl !== monitor.url) {
        monitor.url = trimmedUrl;
        changes.url = trimmedUrl;
        needsSchedulerRestart = true;
      }
    }

    if (interval !== undefined) {
      if (isNaN(interval)) {
        return res.status(400).json({
          code: 400,
          status: "Bad Request",
          message: "Interval must be a number in seconds",
        });
      }

      const validIntervals = [30, 60, 300, 600, 1800, 3600];
      if (!validIntervals.includes(Number(interval))) {
        return res.status(400).json({
          code: 400,
          status: "Bad Request",
          message:
            "Interval must be one of: 30, 60, 300, 600, 1800, 3600 seconds",
        });
      }

      const newInterval = Number(interval);
      if (newInterval !== monitor.interval) {
        monitor.interval = newInterval;
        changes.interval = newInterval;
        needsSchedulerRestart = true;
      }
    }

    await monitor.save();

    if (needsSchedulerRestart) {
      const { restartScheduler } = require("../../Utilities/monitorScheduler.js");
      restartScheduler(monitor);
    }

    res.status(200).json({
      code: 200,
      status: "Success",
      message: "Monitor updated successfully",
      monmitors: {
        monitorId: monitor.monitorId,
        ...changes
      }
    });

  } catch (error) {
    console.log("error in PATCH /v1/monitors/:monitorId", error);
    res.status(500).json({
      code: 500,
      status: "Internal Server Error",
      message: "Server error try again later...",
    });
  }
};

module.exports = { newMonitor, getAllMonitors, updateMonitor, deleteMonitor };
