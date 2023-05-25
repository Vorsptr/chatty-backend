import {
  ICommentDocument,
  ICommentJob,
  ICommentNameList,
  IQueryComment,
} from "@comment/interfaces/comment.interface";
import { CommentsModel } from "@comment/models/comment.model";
import { IPostDocument } from "@posts/interfaces/post.interface";
import { PostModel } from "@posts/models/post.schema";
import { UserCache } from "@service/redis/user.cache";
import { IUserDocument } from "@user/interfaces/user.interface";
import { UserModel } from "@user/models/user.schema";

const userCache: UserCache = new UserCache();
class CommentService {
  public async saveCommentToDB(commentData: ICommentJob): Promise<void> {
    const { postId, userTo, userFrom, comment, username } = commentData;
    const comments: Promise<ICommentDocument> = CommentsModel.create(comment);
    const post = PostModel.findOneAndUpdate(
      { _id: postId },
      { $inc: { commentsCount: 1 } },
      { new: true }
    );
    const user: Promise<IUserDocument> = userCache.getUserFromCache(
      userTo
    ) as Promise<IUserDocument>;
    const response: [ICommentDocument, IPostDocument, IUserDocument] =
      (await Promise.all([comments, post, user])) as [
        ICommentDocument,
        IPostDocument,
        IUserDocument
      ];
  }
  public async getPostComments(
    query: IQueryComment,
    sort: Record<string, 1 | -1>
  ): Promise<ICommentDocument[]> {
    const comments: ICommentDocument[] = await CommentsModel.aggregate([
      { $match: query },
      { $sort: sort },
    ]);
    return comments;
  }
  public async getPostCommentNames(
    query: IQueryComment,
    sort: Record<string, 1 | -1>
  ): Promise<ICommentNameList[]> {
    const commentsNameList: ICommentNameList[] = await CommentsModel.aggregate([
      { $match: query },
      { $sort: sort },
      {
        $group: {
          _id: null,
          names: { $addToSet: "$username" },
          count: { $sum: 1 },
        },
      },
      {
        $project: { _id: 0 },
      },
    ]);
    return commentsNameList;
  }
}
export const commentService: CommentService = new CommentService();
