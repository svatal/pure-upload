declare module pu {
    function castFiles(fileList: File[] | Object, status?: IUploadStatus): IUploadFile[];
    function decorateSimpleFunction(origFn: () => void, newFn: () => void, newFirst?: boolean): () => void;
    var getUploadCore: (options: IUploadOptions, callbacks: IUploadCallbacks) => UploadCore;
    var getUploader: (options: IUploadQueueOptions, callbacks: IUploadQueueCallbacks) => Uploader;
    function newGuid(): string;
    interface FileExt extends File {
        kind: string;
        webkitGetAsEntry: () => File;
        getAsFile: () => File;
        file: (file: any) => void;
        isFile: boolean;
        isDirectory: boolean;
    }
    interface IUploadAreaOptions extends IUploadOptions {
        maxFileSize?: number;
        allowDragDrop?: boolean;
        clickable?: boolean;
        accept?: string;
        multiple?: boolean;
    }
    interface IUploadCallbacks {
        onProgressCallback?: (file: IUploadFile) => void;
        onCancelledCallback?: (file: IUploadFile) => void;
        onFinishedCallback?: (file: IUploadFile) => void;
        onUploadedCallback?: (file: IUploadFile) => void;
        onErrorCallback?: (file: IUploadFile) => void;
        onUploadStartedCallback?: (file: IUploadFile) => void;
    }
    interface IUploadCallbacksExt extends IUploadCallbacks {
        onFileStateChangedCallback?: (file: IUploadFile) => void;
    }
    interface IUploadFile extends File {
        guid: string;
        uploadStatus: IUploadStatus;
        responseCode: number;
        responseText: string;
        progress: number;
        sentBytes: number;
        cancel: () => void;
        remove: () => void;
        start: () => void;
    }
    interface IUploadOptions {
        url: string;
        method: string;
        withCredentials?: boolean;
        headers?: {
            [key: string]: any;
        };
        params?: {
            [key: string]: any;
        };
    }
    interface IUploadQueueCallbacks extends IUploadCallbacks {
        onFileAddedCallback?: (file: IUploadFile) => void;
        onFileRemovedCallback?: (file: IUploadFile) => void;
        onAllFinishedCallback?: () => void;
        onQueueChangedCallback?: (queue: IUploadFile[]) => void;
        onFilesAddedErrorCallback?: (files: IUploadFile[]) => void;
    }
    interface IUploadQueueCallbacksExt extends IUploadQueueCallbacks, IUploadCallbacksExt {
    }
    interface IUploadQueueOptions {
        maxParallelUploads?: number;
        autoStart?: boolean;
        autoRemove?: boolean;
    }
    interface IUploadStatus {
        queued: IUploadStatus;
        uploading: IUploadStatus;
        uploaded: IUploadStatus;
        failed: IUploadStatus;
        canceled: IUploadStatus;
        removed: IUploadStatus;
    }
    class UploadArea {
        targetElement: Element;
        options: IUploadAreaOptions;
        uploader: Uploader;
        private uploadCore;
        private fileInput;
        private validationFailedInputFiles;
        private unregisterOnClick;
        private unregisterOnDrop;
        private unregisterOnDragOver;
        private unregisterOnChange;
        constructor(targetElement: Element, options: IUploadAreaOptions, uploader: Uploader);
        private setFullOptions(options);
        private putFilesToQueue(fileList);
        private callbackOnFilesErrors();
        private validateFile(file);
        private putFileToQueue(file);
        private setupHiddenInput();
        private onChange(e);
        private onDrag(e);
        private onDrop(e);
        private onClick();
        private addFilesFromItems(items);
        private processDirectory(directory, path);
        private handleFiles(files);
        private isFileSizeValid(file);
        private stopEventPropagation(e);
        destroy(): void;
    }
    class UploadCore {
        options: IUploadOptions;
        callbacks: IUploadCallbacksExt;
        constructor(options: IUploadOptions, callbacks: IUploadCallbacksExt);
        upload(fileList: File[] | Object): void;
        private processFile(file);
        private createRequest();
        private setHeaders(xhr);
        private setCallbacks(xhr, file);
        private send(xhr, file);
        private createFormData(file);
        private handleError(file, xhr);
        private updateProgress(file, e?);
        private onload(file, xhr);
        private finished(file, xhr);
        private setResponse(file, xhr);
        private setFullOptions(options);
        private setFullCallbacks(callbacks);
    }
    class Uploader {
        uploadAreas: UploadArea[];
        queue: UploadQueue;
        options: IUploadQueueOptions;
        constructor(options: IUploadQueueOptions, callbacks: IUploadQueueCallbacks);
        setOptions(options: IUploadQueueOptions): void;
        registerArea(element: Element, options: IUploadAreaOptions): UploadArea;
        unregisterArea(area: UploadArea): void;
    }
    class UploadQueue {
        options: IUploadQueueOptions;
        callbacks: IUploadQueueCallbacksExt;
        queuedFiles: IUploadFile[];
        constructor(options: IUploadQueueOptions, callbacks: IUploadQueueCallbacksExt);
        addFiles(files: IUploadFile[]): void;
        removeFile(file: IUploadFile, blockRecursive?: boolean): void;
        clearFiles(): void;
        private filesChanged();
        private checkAllFinished();
        private setFullOptions();
        private setFullCallbacks();
        private startWaitingFiles();
        private removeFinishedFiles();
        private deactivateFile(file);
        private getWaitingFiles();
    }
    class UploadStatusStatic {
        static queued: string;
        static uploading: string;
        static uploaded: string;
        static failed: string;
        static canceled: string;
        static removed: string;
    }
    var uploadStatus: IUploadStatus;
}