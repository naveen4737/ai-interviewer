const mongoose = require("mongoose");

const transcriptSchema = new mongoose.Schema(
  {
    userid: {
      type: String,
      required: [true, "userid is required"],
      unique: true,      
    },
    username: {
      type: String,
      required: [true, "username is required"],
    },
    transcript: {
      type: String,
      required: [true, "transcript is required"],
    },
  },
  { timestamps: true }
);

const transcriptModel = mongoose.model("transcript", transcriptSchema);
module.exports = transcriptModel;