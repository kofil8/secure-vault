import { Document, Packer, Paragraph } from 'docx';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// Function to generate a blank DOCX file buffer
const generateBlankDocx = async (): Promise<Buffer> => {
  const paragraph = new Paragraph({ text: '' });
  const doc = new Document({
    sections: [
      {
        children: [paragraph],
      },
    ],
  });

  return await Packer.toBuffer(doc);
};

// Function to generate a blank XLSX file buffer
const generateBlankXlsx = async (): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet 1');
  sheet.addRow(['']); // Adding an empty row
  return (await workbook.xlsx.writeBuffer()) as Buffer;
};

// Function to generate a blank PDF file buffer
const generateBlankPdf = (): Buffer => {
  const doc = new PDFDocument();
  const buffers: Buffer[] = [];

  doc.on('data', (chunk: Buffer) => buffers.push(chunk));
  doc.text(''); // Blank PDF
  doc.end();

  return Buffer.concat(buffers);
};

export { generateBlankDocx, generateBlankXlsx, generateBlankPdf };
