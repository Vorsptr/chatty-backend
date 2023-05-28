import { IFollowerData } from "@follower/interfaces/follower.interface";
import { followerService } from "@service/db/follower.service";
import { FollowerCache } from "@service/redis/follower.cache";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { StatusCodes } from "http-status-codes";

const followerCache: FollowerCache = new FollowerCache();
export class GetFollowers {
  public async userFollowing(req: Request, res: Response): Promise<void> {
    const userObjectId: ObjectId = new mongoose.Types.ObjectId(
      req.currentUser!.userId
    );
    const chachedFollowees: IFollowerData[] =
      await followerCache.getFollowersFromCache(
        `following:${req.currentUser!.userId}`
      );
    const following: IFollowerData[] = chachedFollowees.length
      ? chachedFollowees
      : await followerService.getFolloweeDataFromDB(userObjectId);
    res.status(StatusCodes.OK).json({ message: "User following", following });
  }
  public async userFollowers(req: Request, res: Response): Promise<void> {
    const userObjectId: ObjectId = new mongoose.Types.ObjectId(
      req.params.userId
    );
    const cachedFollowers: IFollowerData[] =
      await followerCache.getFollowersFromCache(
        `followers:${req.currentUser!.userId}`
      );
    const followers: IFollowerData[] = cachedFollowers.length
      ? cachedFollowers
      : await followerService.getFollowerDataFromDB(userObjectId);
    res.status(StatusCodes.OK).json({ message: "User followers", followers });
  }
}
