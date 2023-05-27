import { ServerError } from "@global/helpers/error-handler";
import { DoneCallback, Job } from "bull";
import { reactionService } from "@service/db/reaction.service";
import Logger from "bunyan";
import { config } from "@root/config";

const log: Logger = config.createLogger("reactionWorker");
class ReactionWorker {
  public async addReactionToDB(job: Job, done: DoneCallback) {
    try {
      const { data } = job;
      reactionService.addReactionDataToDB(data);
      job.progress(100);
      done(null, data);
    } catch (error) {
      log.error(error);
      done(error as Error);
      throw new ServerError("Something went wrong");
    }
  }
  public async removeReactionFromDB(job: Job, done: DoneCallback) {
    try {
      const { data } = job;
      reactionService.removeReactionFromDB(data);
      job.progress(100);
      done(null, data);
    } catch (error) {
      done(error as Error);
      throw new ServerError("Something went wrong");
    }
  }
}
export const reactionWorker: ReactionWorker = new ReactionWorker();
