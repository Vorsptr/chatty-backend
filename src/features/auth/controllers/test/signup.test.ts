import { Request, Response } from "express";
import * as cloudinaryUploads from "@global/helpers/cloudinary-upload";
import { authMockRequest, authMockResponse } from "@root/mocks/auth.mock";
import { SignUp } from "../signup";
import { CustomError } from "@global/helpers/error-handler";
import Logger from "bunyan";
import { config } from "@root/config";

const log: Logger = config.createLogger("signUpTestError");

jest.mock("@service/queues/base.queue");
jest.mock("@service/redis/user.cache");
jest.mock("@service/queues/user.queue");
jest.mock("@service/queues/auth.queue");
jest.mock("@global/helpers/cloudinary-upload");

describe("SignUp", () => {
  it("should throw an error if username is not available", () => {
    const req: Request = authMockRequest(
      {},
      {
        username: "",
        email: "peti@gmail.com",
        password: "1234",
        avatarColor: "red",
        avatarImage: "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==",
      }
    ) as Request;
    const res: Response = authMockResponse();
    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeError().message).toEqual(
        "Username is a required field"
      );
      log.error(error);
    });
  });
});

describe("SignUp", () => {
  it("should throw an error if password is empty", () => {
    const req: Request = authMockRequest(
      {},
      {
        username: "peti",
        email: "peti@gmail.com",
        password: "",
        avatarColor: "red",
        avatarImage: "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==",
      }
    ) as Request;
    const res: Response = authMockResponse();
    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      log.error(error);
    });
  });
});

describe("SignUp", () => {
  it("should log in user", () => {
    const req: Request = authMockRequest(
      {},
      {
        username: "peti",
        email: "peti@gmail.com",
        password: "1234",
        avatarColor: "red",
        avatarImage: "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==",
      }
    ) as Request;
    const res: Response = authMockResponse();
    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      log.error(error);
    });
  });
});
