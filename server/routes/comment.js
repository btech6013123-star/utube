import express from "express";
import {
  deletecomment,
  getallcomment,
  postcomment,
  editcomment,
  handlecommentlike,
  handlecommentdislike,
  translatecomment,
} from "../controllers/comment.js";


const routes = express.Router();
routes.get("/:videoid", getallcomment);
routes.post("/postcomment", postcomment);
routes.delete("/deletecomment/:id", deletecomment);
routes.post("/editcomment/:id", editcomment);
routes.post("/like/:id", handlecommentlike);
routes.post("/dislike/:id", handlecommentdislike);
routes.post("/translate/:id", translatecomment);
export default routes;
