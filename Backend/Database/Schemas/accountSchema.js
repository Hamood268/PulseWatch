const { Schema, model, default: mongoose, version } = require("mongoose");

function formatCred(ret) {
  return {
    id: ret.id,
    username: ret.username,
    email: ret.email,
    role: ret.role,
  };
}

const credentials = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: [true, "username is required"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
      select: false,
      minlength: [6, "Password must be at least 6 characters long"],
    },
    role: {
      type: String,
      enum: ["Admin", "Owmer", "User"],
      default: "User",
    },
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
        delete ret.password;
        delete ret.insertionOrder;
        delete ret.createdAt;
        delete ret.updatedAt;

        return formatCred(ret);
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

        return formatCred(ret);
      },
    },
  }
);

credentials.index({ id: 1 });

module.exports = {
  AccountModel: model("accounts", credentials),
  formatCred,
};
