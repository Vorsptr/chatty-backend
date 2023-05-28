import { IFollowerData } from "@follower/interfaces/follower.interface";
import { IPostDocument } from "@posts/interfaces/post.interface";
import { FollowerCache } from "@service/redis/follower.cache";
import { UserCache } from "@service/redis/user.cache";
import { IUserDocument } from "@user/interfaces/user.interface";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { StatusCodes } from "http-status-codes";
import { socketIOFollowerObject } from "@sockets/follower";
import { followerQueue } from "@service/queues/follower.queue";

const followerCache: FollowerCache = new FollowerCache();
const userCache: UserCache = new UserCache();

export class Follower {
  public async addFollower(req: Request, res: Response): Promise<void> {
    const { followeeId } = req.params;
    //update count in cache
    const followersCount: Promise<void> =
      followerCache.updateFollowersCountInCache(
        followeeId,
        "followersCount",
        1
      );
    const followeeCount: Promise<void> =
      followerCache.updateFollowersCountInCache(
        `${req.currentUser!.userId}`,
        "followingCount",
        1
      );
    await Promise.all([followersCount, followeeCount]);

    const cachedFollowee: Promise<IUserDocument> = userCache.getUserFromCache(
      followeeId
    ) as Promise<IUserDocument>;
    const cachedFollower: Promise<IUserDocument> = userCache.getUserFromCache(
      `${req.currentUser!.userId}`
    ) as Promise<IUserDocument>;
    const response: [IUserDocument, IUserDocument] = await Promise.all([
      cachedFollower,
      cachedFollowee,
    ]);
    const followerObjectId: ObjectId = new ObjectId();
    const addFolloweeData: IFollowerData = Follower.prototype.userData(
      response[0]
    );
    //send data to client with socketio
    socketIOFollowerObject.emit("add follower", addFolloweeData);
    const addFollowerToCache: Promise<void> = followerCache.saveFollowerToCache(
      `followers:${req.currentUser!.userId}`,
      `${followeeId}`
    );
    const addFolloweeToCache: Promise<void> = followerCache.saveFollowerToCache(
      `following:${followeeId}`,
      `${req.currentUser!.userId}`
    );
    await Promise.all([addFollowerToCache, addFolloweeToCache]);
    followerQueue.addFollowerJob("addFollowerToDB", {
      keyOne: `${req.currentUser!.userId}`,
      keyTwo: followeeId,
      username: req.currentUser!.username,
      followerDocumentId: followerObjectId,
    });
    //send data to queue
    res.status(StatusCodes.OK).json({ message: "Following user now" });
  }
  private userData(user: IUserDocument): IFollowerData {
    return {
      _id: new mongoose.Types.ObjectId(user._id),
      username: user.username!,
      avatarColor: user.avatarColor!,
      postCount: user.postsCount,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      profilePicture: user.profilePicture,
      uId: user.uId!,
      userProfile: user,
    } as unknown as IFollowerData;
  }
}
