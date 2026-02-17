export interface IUploadService {
  uploadImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
  }>;
  uploadVideo(
    file: Express.Multer.File,
    userId: string,
    type?: string,
  ): Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
  }>;
  uploadImages(
    files: Express.Multer.File[],
    userId: string,
  ): Promise<
    Array<{
      url: string;
      publicId: string;
      width: number;
      height: number;
      format: string;
    }>
  >;
  deleteImage(publicId: string): Promise<{ result: string }>;
}
