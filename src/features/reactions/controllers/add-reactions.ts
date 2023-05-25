import HTTP_STATUS from "http-status-codes";
import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { joiValidation } from "@global/decorators/joi-validation.decorators";
import { addReactionSchema } from "@reactions/schemes/reaction.scheme";
import {
  IReactionDocument,
  IReactionJob,
} from "@reactions/interfaces/reaction.interface";
import { ReactionCache } from "@service/redis/reaction.cache";
import { reactionQueue } from "@service/queues/reaction.queue";

const reactionCache: ReactionCache = new ReactionCache();
export class Reactions {
  @joiValidation(addReactionSchema)
  public async postReaction(req: Request, res: Response): Promise<void> {
    const {
      userTo,
      postId,
      type,
      previousReaction,
      postReactions,
      profilePicture,
    } = req.body;
    const reactionObject: IReactionDocument = {
      _id: new ObjectId(),
      postId,
      type,
      avatarColor: req.currentUser!.avatarColor,
      username: req.currentUser!.username,
      profilePicture,
    } as IReactionDocument;
    await reactionCache.savePostReactionToCache(
      postId,
      reactionObject,
      postReactions,
      type,
      previousReaction
    );
    const reactionData: IReactionJob = {
      postId,
      userTo,
      userFrom: req.currentUser!.userId,
      username: req.currentUser!.username,
      previousReaction,
      reactionObject,
      type,
    };
    await reactionQueue.addReaction("addReactionToDB", reactionData);
    res.status(HTTP_STATUS.OK).json({ message: "Reaction added successfully" });
  }
}
