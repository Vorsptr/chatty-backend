import { IBlockedUserJobData } from "@follower/interfaces/follower.interface";
import { BaseQueue } from "./base.queue";
import { blockUserWorker } from "@worker/block-user.worker";

class BlockUserQueue extends BaseQueue {
  constructor() {
    super("blockUserQueue");
    this.processJob("blockUser", 5, blockUserWorker.blockUser);
    this.processJob("unblockUser", 5, blockUserWorker.blockUser);
  }
  public addBlockJob(name: string, data: IBlockedUserJobData) {
    this.addJob(name, data);
  }
}
export const blockUserQueue: BlockUserQueue = new BlockUserQueue();
