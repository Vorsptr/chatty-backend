import { Helpers } from "@global/helpers/helpers";
import { IPostDocument } from "@posts/interfaces/post.interface";
import { PostModel } from "@posts/models/post.schema";
import {
  IQueryReaction,
  IReactionDocument,
  IReactionJob,
} from "@reactions/interfaces/reaction.interface";
import { ReactionModel } from "@reactions/models/reaction.model";
import { config } from "@root/config";
import { UserCache } from "@service/redis/user.cache";
import { IUserDocument } from "@user/interfaces/user.interface";
import { omit } from "lodash";
import Logger from "bunyan";
import mongoose from "mongoose";
const userCache: UserCache = new UserCache();
const log: Logger = config.createLogger("reactionService");
class ReactionService {
  public async addReactionDataToDB(reactionData: IReactionJob): Promise<void> {
    const {
      postId,
      userTo,
      userFrom,
      username,
      type,
      previousReaction,
      reactionObject,
    } = reactionData;
    let updatedReactionObject: IReactionDocument =
      reactionObject as IReactionDocument;
    if (previousReaction.length) {
      updatedReactionObject = omit(reactionObject, ["_id"]);
    }
    const updatedReaction: [IUserDocument, IReactionDocument, IPostDocument] =
      (await Promise.all([
        userCache.getUserFromCache(`${userTo}`),
        ReactionModel.findOneAndReplace(
          { postId, type: previousReaction, username },
          updatedReactionObject,
          { upsert: true }
        ),
        PostModel.findOneAndUpdate(
          { _id: postId },
          {
            $inc: {
              [`reactions.${previousReaction}`]: -1,
              [`reactions.${type}`]: 1,
            },
          },
          { new: true }
        ),
      ])) as unknown as [IUserDocument, IReactionDocument, IPostDocument];
  }
  public async removeReactionFromDB(reaction: IReactionJob): Promise<void> {
    const { postId, username, previousReaction } = reaction;
    await Promise.all([
      ReactionModel.deleteOne({ postId, username, type: previousReaction }),
      PostModel.updateOne(
        { _id: postId },
        {
          $inc: {
            [`reactions.${previousReaction}`]: -1,
          },
        }
      ),
    ]);
  }
  public async getPostReactions(
    query: IQueryReaction,
    sort: Record<string, 1 | -1>
  ): Promise<[IReactionDocument[], number]> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: query },
      { $sort: sort },
    ]);
    return [reactions, reactions.length];
  }
  public async getSinglePostReactionByUsername(
    postId: string,
    username: string
  ): Promise<[IReactionDocument, number] | []> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      {
        $match: {
          postId: new mongoose.Types.ObjectId(postId),
          username: Helpers.firstLetterUppercase(username),
        },
      },
    ]);
    return reactions.length ? [reactions[0], 1] : [];
  }
  public async getReactionsByUsername(
    username: string
  ): Promise<IReactionDocument[]> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: { username: Helpers.firstLetterUppercase(username) } },
    ]);
    return reactions;
  }
}
export const reactionService: ReactionService = new ReactionService();
