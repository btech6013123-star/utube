import comment from "../Modals/comment.js";
import mongoose from "mongoose";
import { isSpam } from "../utils/moderation.js";
import { getLocationFromIp } from "../utils/geoip.js";
import { translateText } from "../utils/translate.js";

// A comment auto-hides once it has BOTH enough total votes and enough net
// dislikes. Requiring a minimum vote count (not just "2 dislikes") means two
// accounts can't brigade a comment into oblivion by themselves.
const MIN_VOTES_TO_HIDE = 5;
const NET_DISLIKES_TO_HIDE = 5;

export const postcomment = async (req, res) => {
  const commentdata = req.body;

  if (isSpam(commentdata.commentbody)) {
    return res
      .status(400)
      .json({ message: "Comment blocked by moderation filter" });
  }

  // Derive location server-side from the request IP — never trust a
  // location sent by the client, since that can be spoofed.
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress;
  const { country, city } = getLocationFromIp(ip);

  const postcomment = new comment({
    ...commentdata,
    location: { country, city },
  });
  try {
    await postcomment.save();
    return res.status(200).json({ comment: true, data: postcomment });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    const commentvideo = await comment.find({
      videoid: videoid,
      status: { $ne: "hidden" },
    });
    return res.status(200).json(commentvideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    await comment.findByIdAndDelete(_id);
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    const updatecomment = await comment.findByIdAndUpdate(_id, {
      $set: { commentbody: commentbody },
    });
    res.status(200).json(updatecomment);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const handlecommentlike = async (req, res) => {
  const { userId } = req.body;
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    const targetcomment = await comment.findById(id);
    if (!targetcomment) {
      return res.status(404).json({ message: "comment not found" });
    }

    targetcomment.dislikes.pull(userId);
    const alreadyLiked = targetcomment.likes.some(
      (u) => u.toString() === userId
    );
    alreadyLiked
      ? targetcomment.likes.pull(userId)
      : targetcomment.likes.push(userId);

    await targetcomment.save();
    return res.status(200).json(targetcomment);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const handlecommentdislike = async (req, res) => {
  const { userId } = req.body;
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    const targetcomment = await comment.findById(id);
    if (!targetcomment) {
      return res.status(404).json({ message: "comment not found" });
    }

    targetcomment.likes.pull(userId);
    const alreadyDisliked = targetcomment.dislikes.some(
      (u) => u.toString() === userId
    );
    alreadyDisliked
      ? targetcomment.dislikes.pull(userId)
      : targetcomment.dislikes.push(userId);

    const totalVotes =
      targetcomment.likes.length + targetcomment.dislikes.length;
    const netDislikes =
      targetcomment.dislikes.length - targetcomment.likes.length;
    if (totalVotes >= MIN_VOTES_TO_HIDE && netDislikes >= NET_DISLIKES_TO_HIDE) {
      targetcomment.status = "hidden";
    }

    await targetcomment.save();
    return res.status(200).json(targetcomment);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const translatecomment = async (req, res) => {
  const { id } = req.params;
  const { targetLang } = req.body;
  try {
    const targetcomment = await comment.findById(id);
    if (!targetcomment) {
      return res.status(404).json({ message: "comment not found" });
    }
    const { translatedText, detectedLang } = await translateText(
      targetcomment.commentbody,
      targetLang
    );
    return res.status(200).json({ translatedText, detectedLang });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Translation failed" });
  }
};
