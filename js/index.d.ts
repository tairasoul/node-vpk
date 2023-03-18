/// <reference types="node" />
import FileReader from './FileReader';
export interface FileInfo {
    crc: number;
    preloadBytes: number;
    preloadOffset: number;
    archiveIndex: number;
    entryOffset: number;
    entryLength: number;
    end: boolean;
}
declare class VPK {
    path: string;
    fileReader: FileReader;
    version: number;
    treeSize: number;
    files: object;
    cacheFileList: Array<string>;
    fileDefCache: Object;
    fileDataSectionSize: number;
    archiveMD5SectionSize: number;
    otherMD5SectionSize: number;
    signatureSectionSize: number;
    constructor(path: any);
    load(): Promise<void>;
    loadHeader(): Promise<void>;
    loadTree(): Promise<void>;
    loadFileInfo(): FileInfo;
    readonly fileList: Array<string>;
    readFile(filePath: any): Promise<Buffer>;
    readFileSync(filePath: any): Buffer;
    destroy(): void;
    extract(path): void;
}
export default VPK;
