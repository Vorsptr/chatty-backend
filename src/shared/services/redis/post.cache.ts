import { BaseCache } from "./base.cache";
import Logger from "bunyan";
import { config } from "@root/config";
import { ServerError } from "@global/helpers/error-handler";
import { Helpers } from "@global/helpers/helpers";
import {
  IPostDocument,
  IReactions,
  ISavePostToCache,
} from "@posts/interfaces/post.interface";
import { RedisCommandRawReply } from "@redis/client/dist/lib/commands";

export type PostCacheMultiType =
  | string
  | number
  | Buffer
  | RedisCommandRawReply[]
  | IPostDocument
  | IPostDocument[];

export class PostCache extends BaseCache {
  constructor() {
    super("postCache");
  }

  public async savePostToCache(data: ISavePostToCache): Promise<void> {
    const { key, currentUserId, uId, createdPost } = data;
    const {
      _id,
      userId,
      username,
      email,
      avatarColor,
      profilePicture,
      post,
      bgColor,
      imgVersion,
      imgId,
      feelings,
      gifUrl,
      privacy,
      commentsCount,
      reactions,
      createdAt,
    } = createdPost;
    const dataToSave = {
      _id: `${_id}`,
      userId: `${userId}`,
      username: `${username}`,
      email: `${email}`,
      avatarColor: `${avatarColor}`,
      profilePicture: `${profilePicture}`,
      post: `${post}`,
      bgColor: `${bgColor}`,
      imgVersion: `${imgVersion}`,
      imgId: `${imgId}`,
      feelings: `${feelings}`,
      gifUrl: `${gifUrl}`,
      privacy: `${privacy}`,
      commentsCount: `${commentsCount}`,
      reactions: JSON.stringify(reactions),
      createdAt: `${createdAt}`,
    };

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.ZADD("post", { score: parseInt(uId, 10), value: `${key}` });
      for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
        multi.HSET(`posts:${key}`, `${itemKey}`, `${itemValue}`);
      }
      multi.HINCRBY(`users:${currentUserId}`, "postCount", 1);
      multi.exec();
    } catch (error) {
      this.log.error(error);
      throw new ServerError("Something went wrong!");
    }
  }
  public async getPostsFromCache(
    key: string,
    start: number,
    end: number
  ): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const reply: string[] = await this.client.ZRANGE(key, start, end, {
        REV: true,
      });
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }
      const replies: PostCacheMultiType = await multi.exec();
      const postReplies: IPostDocument[] = [];
      replies.forEach((post: any) => {
        post.commentsCount = Helpers.parseJson(post.commentsCount) as number;
        post.reactions = Helpers.parseJson(post.reactions) as IReactions;
        post.createdAt = new Date(Helpers.parseJson(post.createdAt));
        postReplies.push(post);
      });

      return postReplies;
    } catch (error) {
      this.log.error(error);
      throw new ServerError("Server error. Try again.");
    }
  }

  public async getTotalPostsFromCache(): Promise<number> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const count: number = await this.client.ZCARD("post");
      return count;
    } catch (error) {
      this.log.error(error);
      throw new ServerError("Server error. Try again.");
    }
  }
  public async getPostsWithImagesFromCache(
    key: string,
    start: number,
    end: number
  ): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const reply: string[] = await this.client.ZRANGE(key, start, end, {
        REV: true,
      });
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }
      const replies: PostCacheMultiType = await multi.exec();
      const postwithImages: IPostDocument[] = [];
      replies.forEach((post: any) => {
        if ((post.imgId && post.imgVersion) || post.gifUrl) {
          post.commentsCount = Helpers.parseJson(post.commentsCount) as number;
          post.reactions = Helpers.parseJson(post.reactions) as IReactions;
          post.createdAt = new Date(Helpers.parseJson(post.createdAt));
          postwithImages.push(post);
        }
      });

      return postwithImages;
    } catch (error) {
      this.log.error(error);
      throw new ServerError("Server error. Try again.");
    }
  }
  public async getUserPostsFromCache(
    key: string,
    uId: number
  ): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const reply: string[] = await this.client.ZRANGE(key, uId, uId, {
        REV: true,
        BY: "SCORE",
      });
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }
      const replies: PostCacheMultiType = await multi.exec();
      const postReplies: IPostDocument[] = [];
      replies.forEach((post: any) => {
        post.commentsCount = Helpers.parseJson(post.commentsCount) as number;
        post.reactions = Helpers.parseJson(post.reactions) as IReactions;
        post.createdAt = new Date(Helpers.parseJson(post.createdAt));
        postReplies.push(post);
      });

      return postReplies;
    } catch (error) {
      this.log.error(error);
      throw new ServerError("Server error. Try again.");
    }
  }
  public async getTotalUserPostsFromCache(uId: number): Promise<number> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const count: number = await this.client.ZCOUNT("post", uId, uId);
      return count;
    } catch (error) {
      this.log.error(error);
      throw new ServerError("Server error. Try again.");
    }
  }
  public async deletePostFromCache(
    key: string,
    currentUser: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.ZREM("post", `${key}`);
      multi.DEL(`posts:${key}`);
      multi.DEL(`comments:${key}`);
      multi.DEL(`reactions:${key}`);
      multi.HINCRBY(`users:${currentUser}`, "postCount", -1);
      await multi.exec();
      const userPostsCount = await this.client.HMGET(
        `users:${currentUser}`,
        "postCount"
      );
      const postCount = parseInt(userPostsCount[0], 10);
      if (postCount < 0) {
        await this.client.HSET(`users:${currentUser}`, "postCount", 0);
      }
    } catch (error) {
      this.log.error(error);
      throw new ServerError("Server error. Try again.");
    }
  }
  public async updatePostInCache(
    key: string,
    updatedPost: IPostDocument
  ): Promise<IPostDocument> {
    const {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      imgVersion,
      imgId,
      profilePicture,
    } = updatedPost;

    const dataToSave = {
      post: `${post}`,
      bgColor: `${bgColor}`,
      feelings: `${feelings}`,
      privacy: `${privacy}`,
      gifUrl: `${gifUrl}`,
      profilePicture: `${profilePicture}`,
      imgVersion: `${imgVersion}`,
      imgId: `${imgId}`,
    };
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
        await this.client.HSET(`posts:${key}`, `${itemKey}`, `${itemValue}`);
      }
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.hGetAll(`posts:${key}`);
      const reply: PostCacheMultiType =
        (await multi.exec()) as PostCacheMultiType;
      const postReply = reply as IPostDocument[];
      postReply[0].commentsCount = Helpers.parseJson(
        `${postReply[0].commentsCount}`
      ) as number;
      postReply[0].reactions = Helpers.parseJson(
        `${postReply[0].reactions}`
      ) as IReactions;
      postReply[0].createdAt = Helpers.parseJson(
        `${postReply[0].createdAt}`
      ) as Date;

      return postReply[0];
    } catch (error) {
      this.log.error(error);
      throw new ServerError("Server error. Try again.");
    }
  }
}
