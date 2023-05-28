import { ServerError } from "@global/helpers/error-handler";
import { config } from "@root/config";
import { blockUserService } from "@service/db/block-user.service";
import { DoneCallback, Job } from "bull";
import Logger from "bunyan";

const log: Logger = config.createLogger("blockUser");
class BlockUserWorker {
  public async blockUser(job: Job, done: DoneCallback) {
    try {
      const { keyOne, keyTwo, type } = job.data;
      if (type === "block") {
        await blockUserService.blockUser(keyOne, keyTwo);
      } else {
        await blockUserService.unblockUser(keyOne, keyTwo);
      }
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      done(error as Error);
      log.error(error);
      throw new ServerError("Something went wrong");
    }
  }
}
export const blockUserWorker: BlockUserWorker = new BlockUserWorker();
