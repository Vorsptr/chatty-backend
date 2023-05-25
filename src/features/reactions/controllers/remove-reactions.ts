import { StatusCodes } from "http-status-codes";
import { IReactionJob } from "@reactions/interfaces/reaction.interface";
import { reactionQueue } from "@service/queues/reaction.queue";
import { ReactionCache } from "@service/redis/reaction.cache";
import { Request, Response } from "express";
const reactionCache: ReactionCache = new ReactionCache();
export class Remove {
  public async reaction(req: Request, res: Response) {
    const { postId, previousReaction, postReactions } = req.params;
    await reactionCache.removePostReactionFromCache(
      `${postId}`,
      `${req.currentUser!.username}`,
      JSON.parse(postReactions)
    );
    console.log(postReactions);
    const databaseReactionData: IReactionJob = {
      postId,
      username: req.currentUser!.username,
      previousReaction,
    };
    reactionQueue.addReaction("removeReactionFromDB", databaseReactionData);
    res.status(StatusCodes.OK).json({ message: "reaction removed" });
  }
}
