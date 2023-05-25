import { BaseCache } from "@root/shared/services/redis/base.cache";
import { Helpers } from "@global/helpers/helpers";
import { ServerError } from "@global/helpers/error-handler";
import {
  IReaction,
  IReactionDocument,
  IReactions,
} from "@reactions/interfaces/reaction.interface";
export class ReactionCache extends BaseCache {
  constructor() {
    super("reactionCache");
  }

  public async savePostReactionToCache(
    key: string,
    reaction: IReactionDocument,
    postReactions: IReactions,
    type: string,
    previousReaction: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      //call remove reaction method
      if (previousReaction) {
        this.removePostReactionFromCache(key, reaction.username, postReactions);
      }
      if (type) {
        await this.client.LPUSH(`reactions:${key}`, JSON.stringify(reaction));
        await this.client.hSet(
          `posts:${key}`,
          "reactions",
          JSON.stringify(postReactions)
        );
      }
    } catch (error) {
      this.log.error(error);
      throw new ServerError("Something went wrong try again.");
    }
  }
  public async removePostReactionFromCache(
    key: string,
    username: string,
    postReactions: IReactions
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const response: string[] = await this.client.LRANGE(
        `reactions:${key}`,
        0,
        -1
      );
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      const userPreviousReactions: IReactionDocument = this.getPreviousReaction(
        response,
        username
      ) as IReactionDocument;

      multi.lRem(`reactions:${key}`, 1, JSON.stringify(userPreviousReactions));
      await multi.exec();
      await this.client.HSET(
        `posts:${key}`,
        "reactions",
        JSON.stringify(postReactions)
      );
    } catch (error) {
      this.log.error(error);
      throw new ServerError("Something went wrong try again.");
    }
  }
  public async getReactionsFromCache(
    key: string
  ): Promise<[IReactionDocument[], number]> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const reply: string[] = await this.client.LRANGE(
        `reactions:${key}`,
        0,
        -1
      );
      const reactions: IReactionDocument[] = [];
      for (const value of reply) {
        reactions.push(Helpers.parseJson(value));
      }
      const count: number = reactions.length;
      return reactions.length ? [reactions, count] : [[], 0];
    } catch (error) {
      throw new ServerError("Something went wrong try again.");
    }
  }
  public async getReactionsFromCacheByUsername(
    key: string,
    username: string
  ): Promise<[IReactionDocument, number] | []> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const reply: string[] = await this.client.LRANGE(
        `reactions:${key}`,
        0,
        -1
      );
      const reactions: IReactionDocument[] = [];
      for (const value of reply) {
        reactions.push(Helpers.parseJson(value));
      }
      const userReaction: IReactionDocument | undefined = reactions.find(
        (reaction) => reaction.username === username && reaction.postId === key
      );
      return userReaction ? [userReaction, 1] : [];
    } catch (error) {
      throw new ServerError("Something went wrong try again.");
    }
  }
  private getPreviousReaction(
    response: string[],
    username: string
  ): IReactionDocument | undefined {
    const list: IReactionDocument[] = [];
    response.forEach((item) => {
      list.push(Helpers.parseJson(item) as IReactionDocument);
    });
    return list.find((item) => item.username === username);

    // return find(list, (listItem: IReactionDocument) => {
    //   return listItem.username === username;
  }
}
