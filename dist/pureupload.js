function decorateSimpleFunction(origFn, newFn, newFirst) {
    if (newFirst === void 0) { newFirst = false; }
    if (!origFn)
        return newFn;
    return newFirst
        ? function () { newFn(); origFn(); }
        : function () { origFn(); newFn(); };
}

function castFiles(fileList, status) {
    var files;
    if (typeof fileList === 'object') {
        files = Object.keys(fileList).map(function (key) { return fileList[key]; });
    }
    else {
        files = fileList;
    }
    files.forEach(function (file) {
        file.uploadStatus = status || file.uploadStatus;
        file.responseCode = file.responseCode || 0;
        file.responseText = file.responseText || '';
        file.progress = file.progress || 0;
        file.sentBytes = file.sentBytes || 0;
        file.cancel = file.cancel || (function () { });
    });
    return files;
}

var UploadStatusStatic = (function () {
    function UploadStatusStatic() {
    }
    UploadStatusStatic.queued = 'queued';
    UploadStatusStatic.uploading = 'uploading';
    UploadStatusStatic.uploaded = 'uploaded';
    UploadStatusStatic.failed = 'failed';
    UploadStatusStatic.canceled = 'canceled';
    UploadStatusStatic.removed = 'removed';
    return UploadStatusStatic;
})();
var uploadStatus = UploadStatusStatic;

var getUploadCore = function (options, callbacks) {
    return new UploaderCore(options, callbacks);
};
var UploaderCore = (function () {
    function UploaderCore(options, callbacks) {
        this.options = options;
        this.callbacks = callbacks;
        this.setFullOptions(options);
        this.setFullCallbacks(callbacks);
    }
    UploaderCore.prototype.upload = function (fileList) {
        var _this = this;
        var files = castFiles(fileList, uploadStatus.uploading);
        files.forEach(function (file) { return _this.processFile(file); });
    };
    UploaderCore.prototype.processFile = function (file) {
        var xhr = this.createRequest();
        this.setCallbacks(xhr, file);
        this.send(xhr, file);
    };
    UploaderCore.prototype.createRequest = function () {
        var xhr = new XMLHttpRequest();
        xhr.open(this.options.method, this.options.url, true);
        xhr.withCredentials = !!this.options.withCredentials;
        this.setHeaders(xhr);
        return xhr;
    };
    UploaderCore.prototype.setHeaders = function (xhr) {
        var _this = this;
        this.options.headers['Accept'] = this.options.headers['Accept'] || 'application/json';
        this.options.headers['Cache-Control'] = this.options.headers['Cache-Control'] || 'no-cache';
        this.options.headers['X-Requested-With'] = this.options.headers['X-Requested-With'] || 'XMLHttpRequest';
        Object.keys(this.options.headers).forEach(function (headerName) {
            var headerValue = _this.options.headers[headerName];
            if (headerValue != undefined)
                xhr.setRequestHeader(headerName, headerValue);
        });
    };
    UploaderCore.prototype.setCallbacks = function (xhr, file) {
        var _this = this;
        var originalCancelFn = file.cancel;
        file.cancel = decorateSimpleFunction(file.cancel, function () {
            xhr.abort();
            file.uploadStatus = uploadStatus.canceled;
            _this.callbacks.onCancelledCallback(file);
            _this.callbacks.onFileStateChangedCallback(file);
            _this.callbacks.onFinishedCallback(file);
        }, true);
        xhr.onload = function (e) { return _this.onload(file, xhr); };
        xhr.onerror = function () { return _this.handleError(file, xhr); };
        xhr.upload.onprogress = function (e) { return _this.updateProgress(file, e); };
    };
    UploaderCore.prototype.send = function (xhr, file) {
        var formData = this.createFormData(file);
        this.callbacks.onUploadStartedCallback(file);
        this.callbacks.onFileStateChangedCallback(file);
        xhr.send(formData);
    };
    UploaderCore.prototype.createFormData = function (file) {
        var _this = this;
        var formData = new FormData();
        Object.keys(this.options.params).forEach(function (paramName) {
            var paramValue = _this.options.params[paramName];
            if (paramValue != undefined)
                formData.append(paramName, paramValue);
        });
        formData.append('file', file, file.name);
        return formData;
    };
    UploaderCore.prototype.handleError = function (file, xhr) {
        file.uploadStatus = uploadStatus.failed;
        this.setResponse(file, xhr);
        this.callbacks.onErrorCallback(file);
        this.callbacks.onFileStateChangedCallback(file);
        this.callbacks.onFinishedCallback(file);
    };
    UploaderCore.prototype.updateProgress = function (file, e) {
        if (e != null) {
            file.progress = Math.round(100 * (e.loaded / e.total));
            file.sentBytes = e.loaded;
        }
        else {
            file.progress = 100;
            file.sentBytes = file.size;
        }
        file.uploadStatus = file.progress === 100 ? uploadStatus.uploaded : uploadStatus.uploading;
        this.callbacks.onProgressCallback(file);
    };
    UploaderCore.prototype.onload = function (file, xhr) {
        if (xhr.readyState !== 4)
            return;
        if (file.progress != 100)
            this.updateProgress(file);
        if (xhr.status === 200)
            this.finished(file, xhr);
        else
            this.handleError(file, xhr);
    };
    UploaderCore.prototype.finished = function (file, xhr) {
        file.uploadStatus = uploadStatus.uploaded;
        this.setResponse(file, xhr);
        this.callbacks.onUploadedCallback(file);
        this.callbacks.onFileStateChangedCallback(file);
        this.callbacks.onFinishedCallback(file);
    };
    ;
    UploaderCore.prototype.setResponse = function (file, xhr) {
        file.responseCode = xhr.status;
        file.responseText = (xhr.statusText || xhr.status ? xhr.status.toString() : '' || 'Invalid response from server');
    };
    UploaderCore.prototype.setFullOptions = function (options) {
        this.options.url = options.url,
            this.options.method = options.method,
            this.options.headers = options.headers || {},
            this.options.params = options.params || {},
            this.options.withCredentials = options.withCredentials || false;
    };
    UploaderCore.prototype.setFullCallbacks = function (callbacks) {
        this.callbacks.onProgressCallback = callbacks.onProgressCallback || (function () { }),
            this.callbacks.onCancelledCallback = callbacks.onCancelledCallback || (function () { }),
            this.callbacks.onFinishedCallback = callbacks.onFinishedCallback || (function () { }),
            this.callbacks.onUploadedCallback = callbacks.onUploadedCallback || (function () { }),
            this.callbacks.onErrorCallback = callbacks.onErrorCallback || (function () { }),
            this.callbacks.onUploadStartedCallback = callbacks.onUploadStartedCallback || (function () { });
        this.callbacks.onFileStateChangedCallback = callbacks.onFileStateChangedCallback || (function () { });
    };
    return UploaderCore;
})();

var UploadQueue = (function () {
    function UploadQueue(options, callbacks) {
        this.options = options;
        this.callbacks = callbacks;
        this.queuedFiles = [];
        this.setFullOptions();
        this.setFullCallbacks();
    }
    UploadQueue.prototype.addFiles = function (files) {
        var _this = this;
        files.forEach(function (file) {
            _this.queuedFiles.push(file);
            file.uploadStatus = uploadStatus.queued;
            file.remove = decorateSimpleFunction(file.remove, function () {
                _this.removeFile(file);
            });
            _this.callbacks.onFileAddedCallback(file);
        });
        this.filesChanged();
    };
    UploadQueue.prototype.removeFile = function (file, blockRecursive) {
        if (blockRecursive === void 0) { blockRecursive = false; }
        var index = this.queuedFiles.indexOf(file);
        if (index < 0)
            return;
        this.deactivateFile(file);
        this.queuedFiles.splice(index, 1);
        this.callbacks.onFileRemovedCallback(file);
        if (!blockRecursive)
            this.filesChanged();
    };
    UploadQueue.prototype.clearFiles = function () {
        var _this = this;
        this.queuedFiles.forEach(function (file) { return _this.deactivateFile(file); });
        this.queuedFiles = [];
    };
    UploadQueue.prototype.filesChanged = function () {
        this.callbacks.onQueueChangedCallback(this.queuedFiles);
        if (this.options.autoRemove)
            this.removeFinishedFiles();
        if (this.options.autoStart)
            this.startWaitingFiles();
        this.checkAllFinished();
    };
    UploadQueue.prototype.checkAllFinished = function () {
        var unfinishedFiles = this.queuedFiles
            .filter(function (file) { return [uploadStatus.queued, uploadStatus.uploading]
            .indexOf(file.uploadStatus) >= 0; });
        if (unfinishedFiles.length == 0) {
            this.callbacks.onAllFinishedCallback();
        }
    };
    UploadQueue.prototype.setFullOptions = function () {
        this.options.maxParallelUploads = this.options.maxParallelUploads || 0;
        this.options.autoStart = this.options.autoStart || false;
        this.options.autoRemove = this.options.autoRemove || false;
    };
    UploadQueue.prototype.setFullCallbacks = function () {
        var _this = this;
        this.callbacks.onFileAddedCallback = this.callbacks.onFileAddedCallback || (function () { });
        this.callbacks.onFileRemovedCallback = this.callbacks.onFileRemovedCallback || (function () { });
        this.callbacks.onAllFinishedCallback = this.callbacks.onAllFinishedCallback || (function () { });
        this.callbacks.onQueueChangedCallback = this.callbacks.onQueueChangedCallback || (function () { });
        this.callbacks.onFileStateChangedCallback = function () { return _this.filesChanged(); };
    };
    UploadQueue.prototype.startWaitingFiles = function () {
        var files = this.getWaitingFiles().forEach(function (file) { return file.start(); });
    };
    UploadQueue.prototype.removeFinishedFiles = function () {
        var _this = this;
        this.queuedFiles
            .filter(function (file) { return [
            uploadStatus.uploaded,
            uploadStatus.failed,
            uploadStatus.canceled
        ].indexOf(file.uploadStatus) >= 0; })
            .forEach(function (file) { return _this.removeFile(file, true); });
    };
    UploadQueue.prototype.deactivateFile = function (file) {
        if (file.uploadStatus == uploadStatus.uploading)
            file.cancel();
        file.uploadStatus = uploadStatus.removed;
        file.cancel = function () { };
        file.remove = function () { };
        file.start = function () { };
    };
    UploadQueue.prototype.getWaitingFiles = function () {
        if (!this.options.autoStart)
            return [];
        var result = this.queuedFiles
            .filter(function (file) { return file.uploadStatus == uploadStatus.queued; });
        if (this.options.maxParallelUploads > 0) {
            var uploadingFilesCount = this.queuedFiles
                .filter(function (file) { return file.uploadStatus == uploadStatus.uploading; })
                .length;
            var count = this.options.maxParallelUploads - uploadingFilesCount;
            if (count <= 0) {
                return [];
            }
            result = result.slice(0, count);
        }
        return result;
    };
    return UploadQueue;
})();

var UploadArea = (function () {
    function UploadArea(targetElement, options, uploader) {
        this.targetElement = targetElement;
        this.options = options;
        this.uploader = uploader;
        this.uploadCore = getUploadCore(this.options, this.uploader.queue.callbacks);
        this.setupHiddenInput();
    }
    UploadArea.prototype.putFilesToQueue = function (fileList) {
        var _this = this;
        var uploadFiles = castFiles(fileList);
        uploadFiles.forEach(function (file) {
            file.start = function () {
                _this.uploadCore.upload([file]);
                file.start = function () { };
            };
        });
        this.uploader.queue.addFiles(uploadFiles);
    };
    UploadArea.prototype.setupHiddenInput = function () {
        var _this = this;
        this.fileInput = document.createElement("input");
        this.fileInput.setAttribute("type", "file");
        this.fileInput.style.display = "none";
        this.fileInput.accept = this.options.accept;
        if (this.options.multiple) {
            this.fileInput.setAttribute("multiple", "");
        }
        if (this.uploader.uploaderOptions.autoStart) {
            this.fileInput.addEventListener("change", function (e) {
                console.log("changed");
                console.log(e);
                _this.putFilesToQueue(e.target.files);
            });
        }
        if (this.options.clickable) {
            this.targetElement.addEventListener("click", function (e) {
                _this.fileInput.click();
            });
        }
        if (this.options.allowDragDrop) {
            this.targetElement.addEventListener("dragover", function (e) {
                var efct;
                try {
                    efct = e.dataTransfer.effectAllowed;
                }
                catch (_error) { }
                e.dataTransfer.dropEffect = 'move' === efct || 'linkMove' === efct ? 'move' : 'copy';
                _this.stopEventPropagation(e);
            });
            this.targetElement.addEventListener("drop", function (e) {
                if (!e.dataTransfer) {
                    return;
                }
                var files = e.dataTransfer.files;
                if (files.length) {
                    var items = e.dataTransfer.files;
                    _this.putFilesToQueue(items);
                }
                _this.stopEventPropagation(e);
            });
        }
        // attach to body
        document.body.appendChild(this.fileInput);
    };
    UploadArea.prototype.stopEventPropagation = function (e) {
        e.stopPropagation();
        if (e.preventDefault) {
            e.preventDefault();
        }
    };
    UploadArea.prototype.destroy = function () {
        document.body.removeChild(this.fileInput);
    };
    return UploadArea;
})();

var getUploader = function (options, callbacks) {
    return new Uploader(options, callbacks);
};
var Uploader = (function () {
    function Uploader(options, callbacks) {
        this.setOptions(options);
        this.uploadAreas = [];
        this.queue = new UploadQueue(options, callbacks);
    }
    Uploader.prototype.setOptions = function (options) {
        this.uploaderOptions = options;
    };
    Uploader.prototype.registerArea = function (element, options) {
        var uploadArea = new UploadArea(element, options, this);
        this.uploadAreas.push(uploadArea);
    };
    Uploader.prototype.unregisterArea = function (area) {
        var areaIndex = this.uploadAreas.indexOf(area);
        if (areaIndex >= 0) {
            this.uploadAreas[areaIndex].destroy();
            this.uploadAreas.splice(areaIndex, 1);
        }
    };
    return Uploader;
})();