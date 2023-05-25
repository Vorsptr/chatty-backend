import { authRoutes } from "@auth/routes/authRoutes";
import { currentUserRoutes } from "@auth/routes/currentRoutes";
import { commentRouter } from "@comment/routes/comment.routes";
import { authMiddleware } from "@global/helpers/auth-middleware";
import { postRoute } from "@posts/routes/postRoute";
import { reactionRouter } from "@reactions/routes/reaction.route";
import { serverAdapter } from "@service/queues/base.queue";
import { Application } from "express";
const BASE_PATH = "/api/v1";
export default (app: Application) => {
  const routes = () => {
    app.use("/queues", serverAdapter.getRouter());
    app.use(BASE_PATH, authRoutes.routes());
    app.use(BASE_PATH, authRoutes.signOutRoute());
    app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, postRoute.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, reactionRouter.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, commentRouter.routes());
  };
  routes();
};
