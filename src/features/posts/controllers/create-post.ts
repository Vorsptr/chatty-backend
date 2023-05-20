import { joiValidation } from "@global/decorators/joi-validation.decorators";
import HTTP_STATUS from "http-status-codes";
import { Request, Response } from "express";
import { postSchema, postWithImageSchema } from "@posts/schemes/post.schemes";
import { ObjectId } from "mongodb";
import { IPostDocument } from "@posts/interfaces/post.interface";
import { PostCache } from "@service/redis/post.cache";
import { postQueue } from "@service/queues/post.queue";
import { socketIOPostObject } from "@sockets/post";
import { UploadApiResponse } from "cloudinary";
import { upload } from "@global/helpers/cloudinary-upload";
import { BadRequestError } from "@global/helpers/error-handler";

const postCache: PostCache = new PostCache();

export class Create {
  @joiValidation(postSchema)
  public async post(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings } =
      req.body;
    const postObjectId: ObjectId = new ObjectId();
    const createPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: "",
      imgId: "",
      createdAt: new Date(),
      reactions: { like: 0, love: 0, haha: 0, sad: 0, wow: 0, angry: 0 },
    } as IPostDocument;

    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId: `${req.currentUser!.uId}`,
      createdPost: createPost,
    });
    socketIOPostObject.emit("add post", createPost);
    await postQueue.addPostJob("createPost", { value: createPost });
    res.status(HTTP_STATUS.OK).json({ message: "Post created successfully" });
  }
  @joiValidation(postWithImageSchema)
  public async postWithImage(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings, image } =
      req.body;
    const result: UploadApiResponse = (await upload(
      image,
      {}
    )) as UploadApiResponse;
    if (!result?.public_id) {
      throw new BadRequestError(result.message);
    }
    const postObjectId: ObjectId = new ObjectId();
    const createPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: result.version.toString(),
      imgId: result?.public_id,
      createdAt: new Date(),
      reactions: { like: 0, love: 0, haha: 0, sad: 0, wow: 0, angry: 0 },
    } as IPostDocument;

    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId: `${req.currentUser!.uId}`,
      createdPost: createPost,
    });
    socketIOPostObject.emit("add post", createPost);
    await postQueue.addPostJob("createPost", { value: createPost });
    res.status(HTTP_STATUS.OK).json({ message: "Post created successfully" });
  }
}
