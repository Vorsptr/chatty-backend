import Logger from "bunyan";
import { ServerError } from "@global/helpers/error-handler";
import { config } from "@root/config";
import { BaseCache } from "./base.cache";
import { IFollowerData } from "@follower/interfaces/follower.interface";
import { UserCache } from "./user.cache";
import { IUserDocument } from "@user/interfaces/user.interface";
import mongoose from "mongoose";
import { Helpers } from "@global/helpers/helpers";

const log: Logger = config.createLogger("followerCache");

const userCache: UserCache = new UserCache();
export class FollowerCache extends BaseCache {
  constructor() {
    super("followerCache");
  }
  public async saveFollowerToCache(key: string, value: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      await this.client.LPUSH(key, value);
    } catch (error) {
      throw new ServerError("Something went wrong");
    }
  }
  public async removeFollowerFromCache(
    key: string,
    value: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      await this.client.LREM(key, 1, value);
    } catch (error) {
      throw new ServerError("Something went wrong");
    }
  }
  public async updateFollowersCountInCache(
    key: string,
    prop: string,
    value: number
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      await this.client.HINCRBY(`users:${key}`, prop, value);
    } catch (error) {
      throw new ServerError("Something went wrong");
    }
  }
  public async getFollowersFromCache(key: string): Promise<IFollowerData[]> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const response: string[] = await this.client.LRANGE(key, 0, -1);
      const list: IFollowerData[] = [];
      for (const value of response) {
        const user: IUserDocument = (await userCache.getUserFromCache(
          value
        )) as IUserDocument;
        const data: IFollowerData = {
          _id: new mongoose.Types.ObjectId(user._id),
          username: user.username!,
          avatarColor: user.avatarColor!,
          postCount: user.postsCount!,
          followersCount: user.followersCount!,
          followingCount: user.followingCount!,
          profilePicture: user.profilePicture!,
          uId: user.uId!,
          userProfile: user,
        };
        list.push(data);
      }
      return list;
    } catch (error) {
      this.log.error(error);
      throw new ServerError("Something went wrong, try again.");
    }
  }
  public async updateBlockedUserPropInCache(
    key: string,
    prop: string,
    value: string,
    type: "block" | "unblock"
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const response: string = (await this.client.HGET(
        `users:${key}`,
        prop
      )) as string;
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      let blocked: string[] = Helpers.parseJson(response) as string[];
      if (type === "block") {
        blocked = [...blocked, value];
      } else {
        const user = blocked.indexOf(value);
        blocked.splice(user);
        blocked = [...blocked];
      }
      multi.HSET(`users:${key}`, `${prop}`, JSON.stringify(blocked));
      await multi.exec();
    } catch (error) {
      this.log.error(error);
      throw new ServerError("Something went wrong, try again.");
    }
  }
}
