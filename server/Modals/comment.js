import mongoose from "mongoose";
const commentschema = mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    videoid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
      required: true,
    },
    commentbody: { type: String },
    usercommented: { type: String },
    commentedon: { type: Date, default: Date.now },
    language: { type: String, default: "auto" },
    location: {
      country: { type: String, default: null },
      city: { type: String, default: null },
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    status: { type: String, enum: ["visible", "hidden"], default: "visible" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("comment", commentschema);
