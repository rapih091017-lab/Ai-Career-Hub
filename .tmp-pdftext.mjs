import { readFileSync } from "fs";
import { PDFParse } from "pdf-parse";

const file = process.argv[2];
const buf = readFileSync(file);
const parser = new PDFParse({ data: new Uint8Array(buf) });
const res = await parser.getText();
console.log("=== pages:", res.pages?.length ?? res.total);
console.log(res.text);
