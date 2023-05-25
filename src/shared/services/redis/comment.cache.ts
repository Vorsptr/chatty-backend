import Logger from "bunyan";
import { BaseCache } from "./base.cache";
import {
  ICommentDocument,
  ICommentNameList,
} from "@comment/interfaces/comment.interface";
import { ServerError } from "@global/helpers/error-handler";
import { Server } from "socket.io";
import { Helpers } from "@global/helpers/helpers";

export class CommentCache extends BaseCache {
  constructor() {
    super("commentCache");
  }
  public async savePostCommentToCache(postId: string, value: string) {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      await this.client.LPUSH(`comments:${postId}`, value);
      await this.client.HINCRBY(`posts:${postId}`, "commentsCount", 1);
    } catch (error) {
      throw new ServerError("Something went wrong try again.");
    }
  }
  public async getCommentsFromCache(
    postId: string
  ): Promise<ICommentDocument[]> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }

      const reply: string[] = await this.client.LRANGE(
        `comments:${postId}`,
        0,
        -1
      );
      const commentsList: ICommentDocument[] = [];
      for (const value of reply) {
        commentsList.push(Helpers.parseJson(value));
      }
      return commentsList;
    } catch (error) {
      throw new ServerError("Something went wrong try again.");
    }
  }
  public async getCommentsNamesFromCache(
    postId: string
  ): Promise<ICommentNameList[] | []> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const reply: number = await this.client.LLEN(`comments:${postId}`);
      const comments: string[] = await this.client.LRANGE(
        `comments:${postId}`,
        0,
        -1
      );
      const list: string[] = [];
      for (const value of comments) {
        const comment: ICommentDocument = Helpers.parseJson(value);
        list.push(comment.username);
      }
      const response: ICommentNameList = {
        count: reply,
        names: list,
      };
      return [response];
    } catch (error) {
      throw new ServerError("Something went wrong try again.");
    }
  }
  public async getSingleComment(
    postId: string,
    commentId: string
  ): Promise<[ICommentDocument]> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const reply: string[] = await this.client.LRANGE(
        `comments:${postId}`,
        0,
        -1
      );
      const comments: ICommentDocument[] = [];
      for (const value of reply) {
        comments.push(Helpers.parseJson(value));
      }
      let singleComment: ICommentDocument;
      singleComment = comments.find((comment) => {
        comment._id === commentId;
      }) as ICommentDocument;
      return [singleComment];
    } catch (error) {
      throw new ServerError("Something went wrong try again.");
    }
  }
}
