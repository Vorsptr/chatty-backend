import HTTP_STATUS from "http-status-codes";
import { Response, Request } from "express";
import { postQueue } from "@service/queues/post.queue";
import { PostCache } from "@service/redis/post.cache";
import { socketIOPostObject } from "@sockets/post";

const postCache: PostCache = new PostCache();

export class Delete {
  public async deletePost(req: Request, res: Response): Promise<void> {
    const { post } = req.params;
    const user = req.currentUser!.userId;
    socketIOPostObject.emit("delete post", post);
    await postCache.deletePostFromCache(post, `${user}`);
    postQueue.addPostJob("deletePostFromDB", {
      keyOne: user,
      keyTwo: post,
    });
    res.status(HTTP_STATUS.OK).json({ message: "Post deleted" });
  }
}
