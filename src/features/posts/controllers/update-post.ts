import HTTP_STATUS, { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { PostCache } from "@service/redis/post.cache";
import { IPostDocument } from "@posts/interfaces/post.interface";
import { socketIOPostObject } from "@sockets/post";
import { postQueue } from "@service/queues/post.queue";
import { joiValidation } from "@global/decorators/joi-validation.decorators";
import { postSchema, postWithImageSchema } from "@posts/schemes/post.schemes";
import { UploadApiResponse } from "cloudinary";
import { upload } from "@global/helpers/cloudinary-upload";
import { BadRequestError } from "@global/helpers/error-handler";

const postCache: PostCache = new PostCache();
export class Update {
  @joiValidation(postSchema)
  public async update(req: Request, res: Response): Promise<void> {
    const {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      imgVersion,
      imgId,
      profilePicture,
    } = req.body;
    const { postId } = req.params;
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      imgVersion,
      imgId,
      profilePicture,
    } as IPostDocument;
    const postUpdated: IPostDocument = await postCache.updatePostInCache(
      `${postId}`,
      updatedPost
    );
    socketIOPostObject.emit("update post", postUpdated, "posts");
    postQueue.addPostJob("updatePostInDB", {
      key: postId,
      value: updatedPost,
    });
    res
      .status(HTTP_STATUS.OK)
      .json({ message: "Post has been updated", postUpdated });
  }
  @joiValidation(postWithImageSchema)
  public async updateWithImage(req: Request, res: Response): Promise<void> {
    const { imgId, imgVersion } = req.body;

    if (imgId && imgVersion) {
      Update.prototype.updatePostWithImage(req);
    } else {
      const result: UploadApiResponse =
        await Update.prototype.addImageToExistingPost(req);
      if (!result.public_id) {
        throw new BadRequestError("Upload not successfull");
      }
    }
    res.status(HTTP_STATUS.OK).json({ message: "Post has been updated" });
  }

  private async updatePostWithImage(req: Request): Promise<void> {
    const {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      imgVersion,
      imgId,
      profilePicture,
    } = req.body;
    const { postId } = req.params;
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      imgVersion,
      imgId,
      profilePicture,
    } as IPostDocument;
    const postUpdated: IPostDocument = await postCache.updatePostInCache(
      `${postId}`,
      updatedPost
    );
    socketIOPostObject.emit("update post", postUpdated, "posts");
    postQueue.addPostJob("updatePostInDB", {
      key: postId,
      value: updatedPost,
    });
  }
  private async addImageToExistingPost(
    req: Request
  ): Promise<UploadApiResponse> {
    const { post, bgColor, feelings, privacy, gifUrl, profilePicture, image } =
      req.body;
    const { postId } = req.params;
    const result: UploadApiResponse = (await upload(
      image,
      {}
    )) as UploadApiResponse;
    if (!result?.public_id) {
      return result;
    }
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      imgVersion: result.version.toString(),
      imgId: result.public_id,
      profilePicture,
    } as IPostDocument;
    const postUpdated: IPostDocument = await postCache.updatePostInCache(
      `${postId}`,
      updatedPost
    );
    socketIOPostObject.emit("update post", postUpdated, "posts");
    postQueue.addPostJob("updatePostInDB", {
      key: postId,
      value: updatedPost,
    });
    return result;
  }
}
