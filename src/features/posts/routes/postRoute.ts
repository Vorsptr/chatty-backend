import { authMiddleware } from "@global/helpers/auth-middleware";
import { Create } from "@posts/controllers/create-post";
import { Delete } from "@posts/controllers/delete-post";
import { Get } from "@posts/controllers/get-post";
import { Update } from "@posts/controllers/update-post";
import express, { Router } from "express";

class PostRoutes {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }
  public routes(): Router {
    this.router.get(
      "/post/all/:page",
      authMiddleware.checkAuthentication,
      Get.prototype.posts
    );
    this.router.get(
      "/post/images/:page",
      authMiddleware.checkAuthentication,
      Get.prototype.postsWithImages
    );
    this.router.post(
      "/post",
      authMiddleware.checkAuthentication,
      Create.prototype.post
    );
    this.router.post(
      "/post/image/post",
      authMiddleware.checkAuthentication,
      Create.prototype.postWithImage
    );
    this.router.delete(
      "/post/:post",
      authMiddleware.checkAuthentication,
      Delete.prototype.deletePost
    );
    this.router.put(
      "/post/:postId",
      authMiddleware.checkAuthentication,
      Update.prototype.update
    );
    this.router.put(
      "/post/image/:postId",
      authMiddleware.checkAuthentication,
      Update.prototype.updateWithImage
    );
    return this.router;
  }
}

export const postRoute: PostRoutes = new PostRoutes();
