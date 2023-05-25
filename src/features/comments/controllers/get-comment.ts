import { ICommentDocument } from "@comment/interfaces/comment.interface";
import { commentService } from "@service/db/comment.service";
import { CommentCache } from "@service/redis/comment.cache";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose, { mongo } from "mongoose";

const commentCache: CommentCache = new CommentCache();
export class Get {
  public async getComments(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const commentsFromCache: ICommentDocument[] =
      await commentCache.getCommentsFromCache(postId);
    const comments = commentsFromCache.length
      ? commentsFromCache
      : await commentService.getPostComments(
          { postId: new mongoose.Types.ObjectId(postId) },
          { createdAt: -1 }
        );
    res.status(StatusCodes.OK).json({ comments });
  }
  public async getCommentsNames(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const commentsNamesCache: ICommentDocument[] | [] =
      (await commentCache.getCommentsNamesFromCache(postId)) as
        | ICommentDocument[]
        | [];
    const commentsNames: ICommentDocument[] | [] = commentsNamesCache.length
      ? commentsNamesCache
      : ((await commentService.getPostCommentNames(
          { postId: new mongoose.Types.ObjectId(postId) },
          { createdAt: -1 }
        )) as ICommentDocument[] | []);
    res.status(StatusCodes.OK).json({ commentsNames });
  }
  public async getSingleComment(req: Request, res: Response): Promise<void> {
    const { postId, commentId } = req.params;

    const commentsCache: ICommentDocument[] =
      await commentCache.getSingleComment(postId, commentId);
    const comment: ICommentDocument[] = commentsCache.length
      ? commentsCache
      : await commentService.getPostComments(
          { _id: new mongoose.Types.ObjectId(commentId) },
          { createdAt: -1 }
        );
    res.status(StatusCodes.OK).json({ message: "Single comment", comment });
  }
}
