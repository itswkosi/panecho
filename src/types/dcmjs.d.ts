declare module 'dcmjs' {
  export class DicomMessage {
    static readFile(buffer: Uint8Array, options?: any): DicomDict;
  }

  export interface DicomDict {
    dict: Record<string, any>;
    meta: Record<string, any>;
  }
}
