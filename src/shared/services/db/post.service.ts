import { IQueryDeleted } from "./../../../features/posts/interfaces/post.interface";
import {
  IGetPostsQuery,
  IPostDocument,
  IQueryComplete,
} from "@posts/interfaces/post.interface";
import { PostModel } from "@posts/models/post.schema";
import { postQueue } from "@service/queues/post.queue";
import { IUserDocument } from "@user/interfaces/user.interface";
import { UserModel } from "@user/models/user.schema";
import { Query, UpdateQuery } from "mongoose";

class PostService {
  public async createPost(userId: string, data: IPostDocument): Promise<void> {
    const post: Promise<IPostDocument> = PostModel.create(data);
    const user: UpdateQuery<IUserDocument> = UserModel.findByIdAndUpdate(
      userId,
      {
        $inc: { postsCount: 1 },
      }
    );

    await Promise.all([post, user]);
  }

  public async getPosts(
    query: IGetPostsQuery,
    skip = 0,
    limit = 0,
    sort: Record<string, 1 | -1>
  ): Promise<IPostDocument[]> {
    let postQery = {};
    if (query?.imgId && query.gifUrl) {
      postQery = { $or: [{ imgId: { $ne: "" } }, { gifUrl: { $ne: "" } }] };
    } else {
      postQery = query;
    }
    const posts: IPostDocument[] = await PostModel.aggregate([
      { $match: postQery },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ]);
    return posts;
  }

  public async postsCount(): Promise<number> {
    const count: number = await PostModel.find({}).countDocuments();
    return count;
  }
  public async deletePost(userid: string, postId: string): Promise<void> {
    const deletePost: Query<IQueryComplete & IQueryDeleted, IPostDocument> =
      PostModel.deleteOne({ _id: postId });
    const decreasePosts: UpdateQuery<IUserDocument> = UserModel.updateOne(
      { _id: userid, postsCount: { $gte: 1 } },

      {
        $inc: { postsCount: -1 },
      }
    );

    await Promise.all([deletePost, decreasePosts]);
  }
  public async editPost(
    postId: string,
    updatedPost: IPostDocument
  ): Promise<void> {
    const updatePost: UpdateQuery<IPostDocument> = PostModel.updateOne(
      { _id: postId },
      { $set: updatedPost }
    );
    await Promise.all([updatePost]);
  }
}
export const postService: PostService = new PostService();
