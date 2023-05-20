import { postWorker } from "@worker/post.worker";
import { BaseQueue } from "./base.queue";
import { IPostJobData } from "@posts/interfaces/post.interface";

class PostQueues extends BaseQueue {
  constructor() {
    super("postQueue");
    this.processJob("createPost", 5, postWorker.savePostToDB);
    this.processJob("deletePostFromDB", 5, postWorker.deletePostFromDB);
    this.processJob("updatePostInDB", 5, postWorker.updatePostInDB);
  }
  public addPostJob(jobName: string, data: IPostJobData) {
    this.addJob(jobName, data);
  }
}

export const postQueue: PostQueues = new PostQueues();
