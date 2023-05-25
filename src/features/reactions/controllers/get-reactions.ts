import { IPostDocument } from "@posts/interfaces/post.interface";
import {
  IQueryReaction,
  IReactionDocument,
} from "@reactions/interfaces/reaction.interface";
import { postService } from "@service/db/post.service";
import { reactionService } from "@service/db/reaction.service";
import { ReactionCache } from "@service/redis/reaction.cache";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

const reactionCache: ReactionCache = new ReactionCache();
export class Get {
  public async getReactions(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const reactions: [IReactionDocument[], number] | [] =
      await reactionCache.getReactionsFromCache(postId);
    const reactionData: [IReactionDocument[], number] | [] = reactions[0].length
      ? reactions
      : await reactionService.getPostReactions(
          { postId: new mongoose.Types.ObjectId(postId) },
          { createdAt: -1 }
        );
    res.status(StatusCodes.OK).json({ message: "reactions", reactionData });
  }
  public async getSinglePostReactionsByUsername(
    req: Request,
    res: Response
  ): Promise<void> {
    const { postId, username } = req.params;
    const cachedReactions: [IPostDocument[], number] | [] =
      (await reactionCache.getReactionsFromCacheByUsername(
        postId,
        username
      )) as [IPostDocument[], number] | [];
    const reactions: [IPostDocument[], number] | [] = cachedReactions[0]?.length
      ? cachedReactions
      : ((await reactionService.getSinglePostReactionByUsername(
          postId,
          username
        )) as [IPostDocument[], number] | []);

    res
      .status(StatusCodes.OK)
      .json({ message: "Single user reactions", reactions });
  }
  public async getUserReactions(req: Request, res: Response): Promise<void> {
    const { username } = req.params;
    const reactions: IReactionDocument[] =
      await reactionService.getReactionsByUsername(username);
    res.status(StatusCodes.OK).json({ message: "User reactions", reactions });
  }
}
