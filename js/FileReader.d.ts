/// <reference types="node" />
declare class FileReader {
    path: string;
    fileDef: number;
    index: number;
    buffer: Buffer;
    bufferLen: number;
    bufferIndex: number;
    done: boolean;
    constructor(path: any);
    getBuffer(minLen?: number): Buffer;
    readUInt8(): number;
    readUInt16(): number;
    readUInt32(): number;
    readString(): any;
    skip(offset: number): void;
}
export default FileReader;
