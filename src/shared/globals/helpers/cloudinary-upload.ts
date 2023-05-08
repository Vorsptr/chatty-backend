import cloudinary, {
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";
import { FileUploadError } from "@global/helpers/error-handler";

export interface IOptions {
  public_id?: string;
  overwrite?: boolean;
  invalidate?: boolean;
}

export async function upload(
  file: string,
  options: IOptions
): Promise<UploadApiResponse | UploadApiErrorResponse | undefined> {
  const { public_id, overwrite, invalidate } = options;
  try {
    return await cloudinary.v2.uploader.upload(file, {
      public_id,
      overwrite,
      invalidate,
    });
  } catch (error) {
    throw new FileUploadError("File upload error");
  }
}

export function uploads(
  file: string,
  public_id?: string,
  overwrite?: boolean,
  invalidate?: boolean
): Promise<UploadApiResponse | UploadApiErrorResponse | undefined> {
  return new Promise((resolve) => {
    cloudinary.v2.uploader.upload(
      file,
      {
        public_id,
        overwrite,
        invalidate,
      },
      (
        error: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined
      ) => {
        if (error) resolve(error);
        resolve(result);
      }
    );
  });
}
