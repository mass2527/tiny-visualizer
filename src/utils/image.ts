import invariant from "tiny-invariant";
import { Size } from "./resize";

export const createImageDataURL = (
  canvasImageSource: CanvasImageSource,
  size: Size
) => {
  const canvasElement = document.createElement("canvas");
  const ctx = canvasElement.getContext("2d");
  invariant(ctx);

  canvasElement.width = size.width;
  canvasElement.height = size.height;
  ctx.drawImage(canvasImageSource, 0, 0, size.width, size.height);

  const imageDataURL = canvasElement.toDataURL();
  canvasElement.remove();

  return imageDataURL;
};

type DataURL = string;
export const loadImageElement = (dataURL: DataURL) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.src = dataURL;

    image.onload = () => {
      resolve(image);
    };
    image.onerror = (error) => {
      reject(error);
    };
  });
};

export const readAsDataURL = (blob: Blob) => {
  return new Promise<ProgressEvent<FileReader>>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);

    reader.onload = (event) => {
      resolve(event);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

export const readAsArrayBuffer = (blob: Blob) => {
  return new Promise<ProgressEvent<FileReader>>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(blob);

    reader.onload = (event) => {
      resolve(event);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

export const createFileId = async (file: File) => {
  const { target } = await readAsArrayBuffer(file);
  invariant(target);

  const arrayBuffer = target.result as ArrayBuffer;
  const buffer = await crypto.subtle.digest("SHA-256", arrayBuffer);

  const hashArray = Array.from(new Uint8Array(buffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
};
