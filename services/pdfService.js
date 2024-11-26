import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import Intl from "intl";
import PDFMerger from 'pdf-merger-js';

export async function generatePDF(outputFile, data) {
  try {
    const rootPath = process.cwd();
  
    const templatePath = path.resolve(path.join(rootPath,'templates','inurancedetails.template.html'));
    const templateHTML = fs.readFileSync(templatePath, 'utf8'); 
    const outputPath =  path.resolve(path.join(rootPath, "assets", "pdf", outputFile));
    let phoneNoString = "";
    // Compile template with Handlebars

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const currentTime = timeFormatter.format(now);

    const compiledTemplate = Handlebars.compile(templateHTML);
    const imagePaths = process.env.BACKEND_URL + data.InsuranceProvider.logo_location;

    if(data.InsuranceProvider?.phone_no_1){
       phoneNoString = data.InsuranceProvider.phone_no_1;
    }

    if(data.InsuranceProvider?.phone_no_2){
      if(phoneNoString.length){
          phoneNoString = phoneNoString + " or " +data.InsuranceProvider.phone_no_2;
      }else{
          phoneNoString = data.InsuranceProvider.phone_no_2;
      }
   }

   const settings = {
    logo : imagePaths,
    sender_name:data.InsuranceProvider.provider_name,
    date:formattedDate,
    time:currentTime,
    phone_number: phoneNoString,
    provider_name: data.InsuranceProvider.provider_name,
    provider_number: data.InsuranceProvider.provider_code,
    recipient_name:data.InsuranceReceipient.name,
    recipient_ma_number:data.InsuranceReceipient.receipient_ma,
    doctor_name:data.DoctorDetail.doctor_name,
    doctor_phone_number:data.DoctorDetail.doctor_phone_no,
    prsrp_prov_number:data.prsrb_prov,
    from_date: data.from_service_date,
    to_date: data.to_service_date,
    new:  data.pa == "NEW" ? "checked":"",
    renewal: data.pa == "RENEWAL" ? "checked":"",
    other: data.pa == "OTHERS" ? "checked":"",
    mw:data.recipient_is == "MW" ? "checked":"",
    rem:data.recipient_is == "REM" ? "checked":"",
    remOpt:data.recipient_is == "REM OPT MODEL WAIVER" ? "checked":"",
    t1003 : data.procedure_code == 'TI003' ? "checked":"",
    t1002 : data.procedure_code == 'TI002' ? "checked":"",
    t1004 : data.procedure_code == 'TI004' ? "checked":"",
    t1003_units : data.procedure_code == 'TI003' ? data.units:"0",
    t1002_units : data.procedure_code == 'TI002' ? data.units:"0",
    t1004_units : data.procedure_code == 'TI004' ? data.units:"0",
    plan_of_care:data.plan_of_care,
    number_of_days : data.number_of_days,
    max_per_day : data.max_per_day,
    units : data.max_per_day_unit,
    comments:data.comment ? data.comment:"",
    status: data?.insurance_status || "",
    mmis_entry_number: data.mmis_entry,
    rsn: data.rsn,
    pa_number: data.comment_pa,
  }


  console.log(settings);
  
    const html = compiledTemplate(settings);

    // Launch browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set content and generate PDF
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ 
      path: outputPath, 
      format: 'A4',
      printBackground: true 
    });
    await browser.close();
    console.log(`PDF generated successfully at ${outputPath}`);
    return path.join("assets", "pdf", outputFile);
  } catch (error) {
    console.error('PDF generation error:', error);
    return false;
  }
}


export const generateBulkPDF = async (req, res, next) => {
  try {
    const { pdfRoutes } = req; // Retrieve PDF routes from the previous middleware
    const rootPath = process.cwd();
    // Ensure the 'combined' folder exists
    const combinedFolderPath = path.resolve(path.join(rootPath, 'assets', 'combined'));
    if (!fs.existsSync(combinedFolderPath)) {
      fs.mkdirSync(combinedFolderPath, { recursive: true });
    }

    // Generate a timestamped filename
    const timestamp = new Date().toISOString().replace(/:/g, '-'); // Replace ':' to avoid issues in file names
    const outputFilename = `combined_pdf_${timestamp}.pdf`;
    const outputPath = path.join(combinedFolderPath, outputFilename);

    // Initialize the PDF merger
    const merger = new PDFMerger();

    // Add each PDF file to the merger
    for (const pdfPath of pdfRoutes) {
      console.log(pdfPath);
      await merger.add(pdfPath);
    }

    // Save the merged PDF to the output path
    await merger.save(outputPath);

    // Attach the new PDF path to the request object for the next middleware
    req.combinedPdfPath = outputPath;

    // Proceed to the next middleware
    next();

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      message: "Error occurred while generating PDF",
      success: false
    });
  }
};

export const deleteFile = async (filePath) => {
  try {

    const rootPath = process.cwd();
    // Resolve the absolute path of the file
    const absolutePath = path.resolve(rootPath, filePath);

    // Check if the file exists before attempting to delete it
    if (fs.existsSync(absolutePath)) {
      // Delete the file
      fs.unlink(absolutePath, (err) => {
        if (err) throw err;
        console.log(`File deleted successfully: ${absolutePath}`);
      });
    } else {
      console.log('File not found, nothing to delete.');
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};