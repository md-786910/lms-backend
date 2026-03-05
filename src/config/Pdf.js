const ejs = require("ejs");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// Read the SVG file and convert it to base64
const svgFilePath = path.resolve(path.join(__dirname, "../logo/leanport.png")); // Replace with your SVG file path
const svgContent = fs.readFileSync(svgFilePath);
const base64Svg = Buffer.from(svgContent).toString("base64");

class Pdf {
  static async initBrowser() {
    if (!Pdf.browser) {
      console.log("launching puppeteer...");
      Pdf.browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      });
    }
    return Pdf.browser;
  }
  static async generatePdf(viewPath, data, options) {
    const browser = await Pdf.initBrowser();
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    try {
      viewPath = path.join(__dirname, `../views/${viewPath}`);
      const html = await ejs.renderFile(`${viewPath}`, {
        ...data,
        logo: base64Svg,
      });
      await page.setContent(html);
      const pdfOptions = {
        format: "A4",
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `<div style="font-size: 10px;">&nbsp;</div>`,
        footerTemplate: `<div style="font-size: 10px;">&nbsp;</div>`,
        preferCSSPageSize: true, // Ensure PDF respects CSS page size
        margin: {
          top: "40px",
          bottom: "44px",
          left: "0",
          right: "0",
        },
        ...options,
      };
      console.log("generaing pdf");
      const pdfBuffer = await page.pdf(pdfOptions);
      return pdfBuffer;
    } finally {
      await page.close(); // Ensure the page is closed after PDF generation
    }
  }

  static async create(viewPath, data, folder, name) {
    try {
      console.log({ folder });
      fs.mkdir(folder, { recursive: true }, (err) => {
        if (err) {
          console.error("Error creating directory:", err);
          return;
        }
        console.log("Directory created successfully");
      });

      const pdfBuffer = await Pdf.generatePdf(viewPath, data, {
        path: `${folder}${name}`,
      });

      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  static async launch(viewPath, data, folder) {
    try {
      console.log({ launch_folder: folder });
      fs.mkdir(folder, { recursive: true }, (err) => {
        if (err) {
          console.error("Error creating directory:", err);
          return;
        }
        console.log("Directory created successfully");
      });
      const pdfBuffer = await Pdf.generatePdf(viewPath, data);
      return pdfBuffer;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}

module.exports = Pdf;
