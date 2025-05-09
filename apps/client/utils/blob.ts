export const blobToBase64 = (blob: Blob) =>
  new Promise<string>((res) => {
    const reader = new FileReader();
    reader.onloadend = () => res(reader.result as string);
    reader.readAsDataURL(blob);
  });
