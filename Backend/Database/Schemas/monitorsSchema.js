const { Schema, model, default: mongoose } = require("mongoose");

function formatMonitors(ret) {
  return {
    userId: ret.userId,
    monitorId: ret.monitorId,
    name: ret.name,
    url: ret.url,
    interval: ret.interval,
    status: ret.status,
    lastCheckedAt: ret.lastCheckedAt,
    lastResponseTime: ret.lastResponseTime,
    consecutiveFails: ret.consecutiveFails,
    history: ret.history,
  };
}

const monitors = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    monitorId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    interval: {
      type: Number,
      required: true,
      default: 60
    },
    status: {
      type: String,
      enum: ["Up", "Down", "Unknown"],
      default: "Unknown",
    },
    lastCheckedAt: {
      type: Date,
      default: null,
    },
    lastResponseTime: {
      type: Number,
      default: 0,
    },
    consecutiveFails: {
      type: Number,
      default: 0,
    },
    history: [
      {
        status: String,
        date: Date,
        message: String,
        responseTime: Number,
      },
    ],
    insertionOrder: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        delete ret.insertionOrder;
        delete ret.createdAt;
        delete ret.updatedAt;

        return formatMonitors(ret);
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.insertionOrder;
        delete ret.createdAt;
        delete ret.updatedAt;

        return formatMonitors(ret);
      },
    },
  }
);

monitors.index({ userId: 1, monitorId: 1 });

module.exports = {
  MonitorsModel: model("monitors", monitors),
  formatMonitors,
};
