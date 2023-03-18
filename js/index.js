"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FileReader_1 = require("./FileReader");
const PATH = require('path');
const FS = require('fs');
const CRC = require('crc');
const HEADER_LENGTH_MAP = {
    1: 12,
    2: 28,
};

async function writeFileWithDirectories(output, filePath, buffer) {
    const directories = PATH.dirname(filePath).split(PATH.sep);
    let currentDirectory = output;
  
    for (const directory of directories) {
      currentDirectory = PATH.join(currentDirectory, directory);
      if (!FS.existsSync(currentDirectory)) {
        FS.mkdirSync(currentDirectory, {recursive: true});
      }
    }
  
    FS.writeFileSync(output + '/' + filePath, buffer);
}

class VPK {
    constructor(path) {
        this.files = {};
        this.fileDefCache = {};
        this.path = PATH.normalize(path);
        this.fileReader = new FileReader_1.default(this.path);
    }
    async load() {
        await this.loadHeader();
        await this.loadTree();
    }
    async loadHeader() {
        const signature = this.fileReader.readUInt32();
        if (signature !== 0x55aa1234) {
            throw 'Not a VPK file';
        }
        this.version = this.fileReader.readUInt32();
        if (this.version !== 1 && this.version !== 2) {
            throw `VPK Version not support: ${this.version}`;
        }
        this.treeSize = this.fileReader.readUInt32();
        if (this.version === 2) {
            this.fileDataSectionSize = this.fileReader.readUInt32();
            this.archiveMD5SectionSize = this.fileReader.readUInt32();
            this.otherMD5SectionSize = this.fileReader.readUInt32();
            this.signatureSectionSize = this.fileReader.readUInt32();
        }
    }
    async loadTree() {
        while (true) {
            const extension = this.fileReader.readString();
            if (!extension)
                break;
            while (true) {
                const path = this.fileReader.readString();
                if (!path)
                    break;
                while (true) {
                    const fileName = this.fileReader.readString();
                    if (!fileName)
                        break;
                    const fullName = `${path}/${fileName}.${extension}`;
                    this.files[fullName] = this.loadFileInfo();
                }
            }
        }
    }
    loadFileInfo() {
        const fileInfo = {
            crc: this.fileReader.readUInt32(),
            preloadBytes: this.fileReader.readUInt16(),
            archiveIndex: this.fileReader.readUInt16(),
            entryOffset: this.fileReader.readUInt32(),
            entryLength: this.fileReader.readUInt32(),
            end: this.fileReader.readUInt16() === 0xffff,
            preloadOffset: this.fileReader.index,
        };
        this.fileReader.skip(fileInfo.preloadBytes);
        return fileInfo;
    }
    get fileList() {
        if (!this.cacheFileList) {
            this.cacheFileList = Object.keys(this.files);
        }
        return this.cacheFileList;
    }
    readFile(filePath) {
        return new Promise((resolve, reject) => {
            const fileInfo = this.files[filePath];
            if (!fileInfo)
                return reject(null);
            const buffer = new Buffer(fileInfo.preloadBytes || fileInfo.entryLength);
            const callback = err => {
                if (err)
                    throw err;
                if (CRC.crc32(buffer) !== fileInfo.crc) {
                    throw `CRC not match: ${filePath}`;
                }
                resolve(buffer);
            };
            if (fileInfo.preloadBytes) {
                FS.read(this.fileReader.fileDef, buffer, 0, fileInfo.preloadBytes, fileInfo.entryOffset, callback);
            }
            else if (fileInfo.entryLength) {
                if (fileInfo.archiveIndex === 0x7fff) {
                    const offset = this.treeSize + HEADER_LENGTH_MAP[this.version];
                    FS.read(this.fileReader.fileDef, buffer, 0, fileInfo.entryLength, offset + fileInfo.entryOffset, callback);
                }
                else {
                    const filePath = this.path.replace('_dir.vpk', `_${String(fileInfo.archiveIndex).padStart(3, '0')}.vpk`);
                    let fileDef = this.fileDefCache[filePath];
                    if (!fileDef) {
                        fileDef = this.fileDefCache[filePath] = FS.openSync(filePath, 'r');
                    }
                    FS.read(fileDef, buffer, fileInfo.preloadBytes, fileInfo.entryLength, fileInfo.entryOffset, callback);
                }
            }
        });
    }
    readFileSync(filePath) {
        const fileInfo = this.files[filePath];
        if (!fileInfo)
            return null;
        const buffer = new Buffer(fileInfo.preloadBytes || fileInfo.entryLength);
        if (fileInfo.preloadBytes) {
            FS.readSync(this.fileReader.fileDef, buffer, 0, fileInfo.preloadBytes, fileInfo.entryOffset);
        }
        else if (fileInfo.entryLength) {
            if (fileInfo.archiveIndex === 0x7fff) {
                const offset = this.treeSize + HEADER_LENGTH_MAP[this.version];
                FS.readSync(this.fileReader.fileDef, buffer, 0, fileInfo.entryLength, offset + fileInfo.entryOffset);
            }
            else {
                const filePath = this.path.replace('_dir.vpk', `_${String(fileInfo.archiveIndex).padStart(3, '0')}.vpk`);
                let fileDef = this.fileDefCache[filePath];
                if (!fileDef) {
                    fileDef = this.fileDefCache[filePath] = FS.openSync(filePath, 'r');
                }
                FS.readSync(fileDef, buffer, fileInfo.preloadBytes, fileInfo.entryLength, fileInfo.entryOffset);
            }
        }
        if (CRC.crc32(buffer) !== fileInfo.crc) {
            throw `CRC not match: ${filePath}`;
        }
        return buffer;
    }
    destroy() {
        Object.values(this.fileDefCache).forEach((fileDef) => {
            FS.closeSync(fileDef);
        });
    }
    async extract(path) {
        const files = this.fileList;
        const name = this.path.split('\\')[this.path.split('\\').length - 1].replace('.vpk', '');
        FS.mkdirSync(path + '/' + name);
        for (const file of files) {
            await writeFileWithDirectories(path + '/' + name, file, this.readFileSync(file));
        }
    }
}
module.exports = VPK;
