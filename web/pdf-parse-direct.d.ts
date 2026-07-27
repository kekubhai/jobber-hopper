declare module "pdf-parse/lib/pdf-parse.js" {
  type PdfParseResult = {
    text: string;
    numpages: number;
  };

  function parsePdf(data: Buffer): Promise<PdfParseResult>;

  export default parsePdf;
}
