import { ServerError } from "@global/helpers/error-handler";
import { DoneCallback, Job } from "bull";
import { reactionService } from "@service/db/reaction.service";

class ReactionWorker {
  public async addReactionToDB(job: Job, done: DoneCallback) {
    try {
      const { data } = job;
      reactionService.addReactionDataToDB(data);
      job.progress(100);
      done(null, job);
    } catch (error) {
      done(error as Error);
      throw new ServerError("Something went wrong");
    }
  }
  public async removeReactionFromDB(job: Job, done: DoneCallback) {
    try {
      const { data } = job;
      reactionService.removeReactionFromDB(data);
      job.progress(100);
      done(null, job);
    } catch (error) {
      done(error as Error);
      throw new ServerError("Something went wrong");
    }
  }
}
export const reactionWorker: ReactionWorker = new ReactionWorker();
