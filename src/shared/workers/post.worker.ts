import { ServerError } from "@global/helpers/error-handler";
import { config } from "@root/config";
import { postService } from "@service/db/post.service";
import { DoneCallback, Job } from "bull";
import Logger from "bunyan";

const log: Logger = config.createLogger("postWorker");
class PostWorker {
  public async savePostToDB(job: Job, done: DoneCallback) {
    try {
      const { value } = job.data;
      await postService.createPost(value.userId, value);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error("Something went wrong", error);
      done(error as Error);
      throw new ServerError("Worker failed to do the job.");
    }
  }
  public async deletePostFromDB(job: Job, done: DoneCallback) {
    try {
      const { keyOne, keyTwo } = job.data;
      await postService.deletePost(keyOne, keyTwo);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error("Something went wrong", error);
      done(error as Error);
      throw new ServerError("Worker failed to do the job.");
    }
  }
  public async updatePostInDB(job: Job, done: DoneCallback) {
    try {
      const { key, value } = job.data;
      await postService.editPost(key, value);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error("Something went wrong", error);
      done(error as Error);
      throw new ServerError("Worker failed to do the job.");
    }
  }
}
export const postWorker: PostWorker = new PostWorker();
