import { Request, Response } from "express";
import { FollowerCache } from "@service/redis/follower.cache";
import { followerQueue } from "@service/queues/follower.queue";
import { StatusCodes } from "http-status-codes";

const followerCache: FollowerCache = new FollowerCache();
export class RemoveFollower {
  public async remove(req: Request, res: Response): Promise<void> {
    const { followeeId, followerId } = req.params;

    const followersCount: Promise<void> =
      followerCache.updateFollowersCountInCache(
        `${followeeId}`,
        "followersCount",
        -1
      );
    const followingCount: Promise<void> =
      followerCache.updateFollowersCountInCache(
        followerId,
        "followingCount",
        -1
      );

    await Promise.all([followersCount, followingCount]);
    await followerCache.removeFollowerFromCache(
      `following:${followeeId}`,
      followerId
    );
    await followerCache.removeFollowerFromCache(
      `followers:${followerId}`,
      `${followeeId}`
    );
    followerQueue.addFollowerJob("removeFollowerFromDB", {
      keyOne: followerId,
      keyTwo: followeeId,
    });
    res.status(StatusCodes.OK).json({ message: "Unfollowed user" });
  }
}
