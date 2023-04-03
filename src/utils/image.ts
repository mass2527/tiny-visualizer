import invariant from "tiny-invariant";
import { Size } from "./resize";

export const createImageUrl = (
  canvasImageSource: CanvasImageSource,
  size: Size
) => {
  const canvasElement = document.createElement("canvas");
  const ctx = canvasElement.getContext("2d");
  invariant(ctx);

  canvasElement.width = size.width;
  canvasElement.height = size.height;
  ctx.drawImage(canvasImageSource, 0, 0, size.width, size.height);

  const imageUrl = canvasElement.toDataURL();
  canvasElement.remove();

  return imageUrl;
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
