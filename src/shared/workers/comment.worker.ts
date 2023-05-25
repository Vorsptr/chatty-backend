import { ServerError } from "@global/helpers/error-handler";
import { config } from "@root/config";
import { commentService } from "@service/db/comment.service";
import { DoneCallback, Job } from "bull";
import Logger from "bunyan";

const log: Logger = config.createLogger("commentWorker");
class CommentWorker {
  public async addCommentToDB(job: Job, done: DoneCallback) {
    try {
      const { data } = job;
      await commentService.saveCommentToDB(data);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      done(error as Error);
      log.error(error);
      throw new ServerError("Something went wrong, try again.");
    }
  }
}
export const commentWorker: CommentWorker = new CommentWorker();
