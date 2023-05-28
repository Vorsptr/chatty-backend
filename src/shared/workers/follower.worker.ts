import { ServerError } from "@global/helpers/error-handler";
import { config } from "@root/config";
import { followerService } from "@service/db/follower.service";
import { DoneCallback, Job } from "bull";
import Logger from "bunyan";

const log: Logger = config.createLogger("followerWorker");
class FollowerWorker {
  public async addFollowToDB(job: Job, done: DoneCallback) {
    try {
      const { keyOne, keyTwo, username, followerDocument } = job.data;
      await followerService.addFollowerToDB(
        keyOne,
        keyTwo,
        username,
        followerDocument
      );
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      done(error as Error);
      log.error(error);
      throw new ServerError("Something went wrong.");
    }
  }
  public async removeFollowerFromDB(job: Job, done: DoneCallback) {
    try {
      const { keyOne, keyTwo } = job.data;
      await followerService.removeFollowerFromDB(keyOne, keyTwo);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      done(error as Error);
      log.error(error);
      throw new ServerError("Something went wrong");
    }
  }
}

export const followerWorker: FollowerWorker = new FollowerWorker();
