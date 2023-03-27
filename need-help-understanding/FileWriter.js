class FileWriter {
    constructor(path) {
      this.path = path;
      this.fileDef = FS.openSync(this.path, 'w');
    }
  
    writeUInt8(value) {
      const buffer = Buffer.alloc(1);
      buffer.writeUInt8(value);
      FS.writeSync(this.fileDef, buffer, 0, 1);
    }
  
    writeUInt16(value) {
      const buffer = Buffer.alloc(2);
      buffer.writeUInt16LE(value);
      FS.writeSync(this.fileDef, buffer, 0, 2);
    }
  
    writeUInt32(value) {
      const buffer = Buffer.alloc(4);
      buffer.writeUInt32LE(value);
      FS.writeSync(this.fileDef, buffer, 0, 4);
    }
  
    writeString(value) {
      const buffer = Buffer.from(value, 'utf-8');
      FS.writeSync(this.fileDef, buffer, 0, buffer.length);
      this.writeUInt8(0);
    }
  
    close() {
      FS.closeSync(this.fileDef);
    }
}
module.exports = FileWriter

// someone please help me understand how all of this works, i took it from chatgpt and im not even sure if it works i just want a native vpk creation feature
