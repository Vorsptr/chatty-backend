import { authMiddleware } from "@global/helpers/auth-middleware";
import { Reactions } from "@reactions/controllers/add-reactions";
import { Get } from "@reactions/controllers/get-reactions";
import { Remove } from "@reactions/controllers/remove-reactions";
import express, { Router } from "express";

class ReactionRouter {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }
  public routes(): Router {
    this.router.delete(
      "/post/reaction/:postId/:previousReaction/:postReactions",
      authMiddleware.checkAuthentication,
      Remove.prototype.reaction
    );
    this.router.post(
      "/post/reaction",
      authMiddleware.checkAuthentication,
      Reactions.prototype.postReaction
    );
    this.router.get(
      "/post/reaction/username/:username",
      authMiddleware.checkAuthentication,
      Get.prototype.getUserReactions
    );
    this.router.get(
      "/post/reaction/:postId",
      authMiddleware.checkAuthentication,
      Get.prototype.getReactions
    );
    this.router.get(
      "/post/single/reaction/username/:username/:postId",
      authMiddleware.checkAuthentication,
      Get.prototype.getSinglePostReactionsByUsername
    );
    return this.router;
  }
}
export const reactionRouter: ReactionRouter = new ReactionRouter();
