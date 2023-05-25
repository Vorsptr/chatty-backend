import { IReactionJob } from "@reactions/interfaces/reaction.interface";
import { BaseQueue } from "./base.queue";
import { reactionWorker } from "@worker/reaction.worker";

class ReactionQueue extends BaseQueue {
  constructor() {
    super("reactionQueue");
    this.processJob("addReactionToDB", 5, reactionWorker.addReactionToDB);
    this.processJob(
      "removeReactionFromDB",
      5,
      reactionWorker.removeReactionFromDB
    );
  }
  public async addReaction(name: string, data: IReactionJob) {
    this.addJob(name, data);
  }
}

export const reactionQueue: ReactionQueue = new ReactionQueue();
