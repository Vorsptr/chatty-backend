import { blockUserQueue } from "@service/queues/block-user.queue";
import { FollowerCache } from "@service/redis/follower.cache";
import { UserCache } from "@service/redis/user.cache";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const followerCache: FollowerCache = new FollowerCache();

export class AddUser {
  public async block(req: Request, res: Response): Promise<void> {
    const { followerId } = req.params;
    AddUser.prototype.updateBlockedUser(
      followerId,
      req.currentUser!.userId,
      "block"
    );
    blockUserQueue.addBlockJob("blockUser", {
      keyOne: `${req.currentUser!.userId}`,
      keyTwo: `${followerId}`,
      type: "block",
    });
    res.status(StatusCodes.OK).json({ message: "User blocked" });
  }
  public async unblock(req: Request, res: Response): Promise<void> {
    const { followerId } = req.params;
    AddUser.prototype.updateBlockedUser(
      followerId,
      req.currentUser!.userId,
      "unblock"
    );
    blockUserQueue.addBlockJob("unblockUser", {
      keyOne: `${req.currentUser!.userId}`,
      keyTwo: `${followerId}`,
      type: "unblock",
    });
    res.status(StatusCodes.OK).json({ message: "User unblocked" });
  }
  private async updateBlockedUser(
    followerId: string,
    userId: string,
    type: "block" | "unblock"
  ): Promise<void> {
    const blockedBy: Promise<void> = followerCache.updateBlockedUserPropInCache(
      `${followerId}`,
      "blockedBy",
      `${userId}`,
      type
    );
    const blocked: Promise<void> = followerCache.updateBlockedUserPropInCache(
      `${userId}`,
      "blocked",
      `${followerId}`,
      type
    );
    await Promise.all([blockedBy, blocked]);
  }
}
