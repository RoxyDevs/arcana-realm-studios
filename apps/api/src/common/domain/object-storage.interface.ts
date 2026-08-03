export const OBJECT_STORAGE = Symbol("OBJECT_STORAGE");

export interface UploadedObject {
  key: string;
  publicUrl: string;
}

export interface IObjectStorage {
  upload(params: { key: string; body: Buffer; contentType: string }): Promise<UploadedObject>;
  delete(key: string): Promise<void>;
}
