import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import Intl from "intl";

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
    status: data?.status || "",
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
