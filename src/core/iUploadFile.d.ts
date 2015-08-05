interface IUploadFile extends File {
    uploadStatus: IUploadStatus;
    responseCode: number;
    responseText: string;
    progress: number;
    sentBytes: number;
    cancel: () => void;
}
