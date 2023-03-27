class NewVPK {
    constructor(outputFilePath, version = 2) {
      this.fileData = Buffer.alloc(0);
      this.entries = [];
      this.version = version;
      this.header = {
        signature: 0x55aa1234,
        version: version,
        treeLength: 0,
        dataLength: 0,
        archiveMD5: Buffer.alloc(16),
        entries: 0,
      };
      this.outputFilePath = outputFilePath;
    }
  
    writeHeader() {
      const headerBuffer = Buffer.alloc(32);
      headerBuffer.writeUInt32LE(this.header.signature, 0);
      headerBuffer.writeUInt32LE(this.header.version, 4);
      headerBuffer.writeUInt32LE(this.header.treeLength, 8);
      headerBuffer.writeUInt32LE(this.header.dataLength, 12);
      this.header.archiveMD5.copy(headerBuffer, 16);
      headerBuffer.writeUInt32LE(this.header.entries, 32);
      this.fileData = Buffer.concat([this.fileData, headerBuffer]);
    }
  
    writeTree() {
      const treeBuffer = Buffer.alloc(0);
      for (let i = 0; i < this.entries.length; i++) {
        const entry = this.entries[i];
        const nameBuffer = Buffer.from(entry.name + '\0', 'utf-8');
        const crcBuffer = Buffer.alloc(4);
        crcBuffer.writeUInt32LE(entry.crc32, 0);
        const offsetBuffer = Buffer.alloc(8);
        offsetBuffer.writeUInt32LE(entry.offset, 0);
        offsetBuffer.writeUInt32LE(entry.length, 4);
        treeBuffer = Buffer.concat([treeBuffer, nameBuffer, crcBuffer, offsetBuffer]);
      }
      this.fileData = Buffer.concat([this.fileData, treeBuffer]);
      this.header.treeLength = treeBuffer.length;
    }
  
    writeFileInfo(entry) {
      const fileInfoBuffer = Buffer.alloc(0);
      const fileNameBuffer = Buffer.from(entry.name, 'utf-8');
      fileInfoBuffer.writeUInt32LE(fileNameBuffer.length, 0);
      fileInfoBuffer.writeUInt32LE(entry.crc32, 4);
      fileInfoBuffer.writeUInt32LE(entry.preloadBytes, 8);
      fileInfoBuffer.writeUInt32LE(entry.archiveIndex, 12);
      fileInfoBuffer.writeUInt32LE(entry.entryOffset, 16);
      fileInfoBuffer.writeUInt32LE(entry.entryLength, 20);
      const paddingLength = Math.ceil(fileNameBuffer.length / 4) * 4 - fileNameBuffer.length;
      const paddingBuffer = Buffer.alloc(paddingLength);
      fileInfoBuffer = Buffer.concat([fileInfoBuffer, fileNameBuffer, paddingBuffer]);
      this.fileData = Buffer.concat([this.fileData, fileInfoBuffer]);
      this.header.entries++;
      this.header.dataLength += fileInfoBuffer.length;
    }
  
    writeFile(entry, filePath) {
      const fileBuffer = FS.readFileSync(filePath);
      const paddingLength = 2048 - (fileBuffer.length % 2048);
      const paddingBuffer = Buffer.alloc(paddingLength);
      const dataBuffer = Buffer.concat([fileBuffer, paddingBuffer]);
      entry.preloadBytes = fileBuffer.length;
      entry.length = dataBuffer.length;
      entry.offset = this.fileData.length;
      this.entries.push(entry);
      this.fileData = Buffer.concat([this.fileData, dataBuffer]);
    }
}

// i still don't understand half of this, it was taken from chatgpt and i need help understanding it. preferrably through comments, but anything else should work
