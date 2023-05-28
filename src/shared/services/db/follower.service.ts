import { IFollowerData } from "@follower/interfaces/follower.interface";
import { FollowerModel } from "@follower/models/follower.model";
import { UserModel } from "@user/models/user.schema";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
class FollowerService {
  public async addFollowerToDB(
    userId: string,
    followeeId: string,
    username: string,
    followerDocumentId: ObjectId
  ): Promise<void> {
    const followeeObjectId: ObjectId = new mongoose.Types.ObjectId(followeeId);
    const userObjectId: ObjectId = new mongoose.Types.ObjectId(userId);

    await FollowerModel.create({
      _id: followerDocumentId,
      followeeId: followeeObjectId,
      followerId: userObjectId,
    });
    const user = UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: userId },
          update: { $inc: { followingCount: 1 } },
        },
      },
      {
        updateOne: {
          filter: { _id: followeeId },
          update: { $inc: { followersCount: 1 } },
        },
      },
    ]);
    await Promise.all([user, UserModel.findOne({ _id: followeeId })]);
  }
  public async removeFollowerFromDB(
    followerId: string,
    followeeId: string
  ): Promise<void> {
    const followeeObjectId: ObjectId = new mongoose.Types.ObjectId(followeeId);
    const followerObjectId: ObjectId = new mongoose.Types.ObjectId(followerId);

    const unfollow = FollowerModel.deleteOne({ followeeId, followerId });
    const user = UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: followerId },
          update: { $inc: { followingCount: -1 } },
        },
      },
      {
        updateOne: {
          filter: { _id: followeeId },
          update: { $inc: { followersCount: -1 } },
        },
      },
    ]);
    await Promise.all([unfollow, user]);
  }
  public async getFolloweeDataFromDB(
    userObjectId: ObjectId
  ): Promise<IFollowerData[]> {
    const followee = await FollowerModel.aggregate([
      { $match: { followerId: userObjectId } },
      {
        $lookup: {
          from: "User",
          localField: "followeeId",
          foreignField: "_id",
          as: "followeeId",
        },
      },
      { $unwind: "$followeeId" },
      {
        $lookup: {
          from: "Auth",
          localField: "followeeId.authId",
          foreignField: "_id",
          as: "authId",
        },
      },
      { $unwind: "$authId" },
      {
        $addFields: {
          _id: "$followeeId._id",
          username: "$authId.username",
          avatarColor: "$authId.avatarColor",
          postCount: "$followeeId.postsCount",
          uId: "$authId.uId",
          followersCount: "$followeeId.followersCount",
          followingCount: "$followeeId.followingCount",
          profilePicture: "$followeeId.profilePicture",
          userProfile: "$followeeId",
        },
      },
      {
        $project: {
          authId: 0,
          followerId: 0,
          followeeId: 0,
          createdAt: 0,
          __v: 0,
        },
      },
    ]);
    return followee;
  }
  public async getFollowerDataFromDB(
    userObjectId: ObjectId
  ): Promise<IFollowerData[]> {
    const follower = await FollowerModel.aggregate([
      { $match: { followeeId: userObjectId } },
      {
        $lookup: {
          from: "User",
          localField: "followerId",
          foreignField: "_id",
          as: "followerId",
        },
      },
      { $unwind: "$followerId" },
      {
        $lookup: {
          from: "Auth",
          localField: "followerId.authId",
          foreignField: "_id",
          as: "authId",
        },
      },
      { $unwind: "$authId" },
      {
        $addFields: {
          _id: "$followerId._id",
          username: "$authId.username",
          avatarColor: "$authId.avatarColor",
          postCount: "$followerId.postsCount",
          uId: "$authId.uId",
          followersCount: "$followerId.followersCount",
          followingCount: "$followerId.followingCount",
          profilePicture: "$followerId.profilePicture",
          userProfile: "$followerId",
        },
      },
      {
        $project: {
          authId: 0,
          followerId: 0,
          followeeId: 0,
          createdAt: 0,
          __v: 0,
        },
      },
    ]);
    return follower;
  }
}

export const followerService: FollowerService = new FollowerService();
