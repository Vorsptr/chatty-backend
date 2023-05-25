import { Add } from "@comment/controllers/add-comment";
import { Get } from "@comment/controllers/get-comment";
import { authMiddleware } from "@global/helpers/auth-middleware";
import routes from "@root/routes";
import express, { Router } from "express";

class CommentRouter {
  router: Router;
  constructor() {
    this.router = express.Router();
  }
  public routes = () => {
    this.router.post(
      "/post/comments",
      authMiddleware.checkAuthentication,
      Add.prototype.comment
    );
    this.router.get(
      "/post/comments/:postId",
      authMiddleware.checkAuthentication,
      Get.prototype.getComments
    );
    this.router.get(
      "/post/commentsnames/:postId",
      authMiddleware.checkAuthentication,
      Get.prototype.getCommentsNames
    );
    this.router.get(
      "/post/single/comment/:postId/:commentId",
      authMiddleware.checkAuthentication,
      Get.prototype.getSingleComment
    );
    return this.router;
  };
}
export const commentRouter: CommentRouter = new CommentRouter();
