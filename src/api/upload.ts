import { apiClient } from "./client";

export interface ImageUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface FileUploadResult {
  url: string;
  publicId: string;
  originalName: string;
  size: number;
  format: string;
}

export const uploadApi = {
  image: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient
      .post<ImageUploadResult>("/upload/image", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  file: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient
      .post<FileUploadResult>("/upload/file", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
