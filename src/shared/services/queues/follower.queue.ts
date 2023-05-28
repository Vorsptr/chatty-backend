import { IFollowerJobData } from "@follower/interfaces/follower.interface";
import { BaseQueue } from "./base.queue";
import { followerWorker } from "@worker/follower.worker";

class FollowerQueue extends BaseQueue {
  constructor() {
    super("followerQueue");
    this.processJob("addFollowerToDB", 5, followerWorker.addFollowToDB);
    this.processJob(
      "removeFollowerFromDB",
      5,
      followerWorker.removeFollowerFromDB
    );
  }
  public addFollowerJob(name: string, data: IFollowerJobData) {
    this.addJob(name, data);
  }
}
export const followerQueue: FollowerQueue = new FollowerQueue();
