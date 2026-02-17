
import { supabase } from './supabaseClient';
import { Certificate } from '../types';

const HCTI_ID = import.meta.env.VITE_HCTI_ID;
const HCTI_KEY = import.meta.env.VITE_HCTI_KEY;

export const generateCertificate = async (userName: string, courseTitle: string, userId: string, industry: string): Promise<Certificate | null> => {
  try {
    console.log("Step 1: Checking for existing certificate...");
    // 1. Check existing certificate to prevent duplicates/costs
    const { data: existing } = await supabase
      .from('user_certificates')
      .select('*')
      .eq('user_id', userId)
      .eq('course_title', courseTitle)
      .single();

    if (existing) {
        console.log("Certificate already exists:", existing);
        return existing as Certificate;
    }

    // Generate ID client-side so we can display it on the image
    const certificateId = crypto.randomUUID();

    // 2. Generate HTML for the certificate
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; font-family: 'Lato', sans-serif; background: #fff; }
          .cert-container {
            width: 1860px;
            height: 1200px;
            background-image: url('https://oxksmvkuimqvagazbove.supabase.co/storage/v1/object/public/Assets/New%20Cert%20(2).png');
            background-size: 100% 100%;
            background-repeat: no-repeat;
            position: relative;
            box-sizing: border-box;
          }
          
          .content-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: flex-start; /* Left align items */
            padding-left: 182px; /* Adjusted to 182px */
            padding-right: 120px; 
            padding-top: 380px; 
            box-sizing: border-box;
            text-align: left; /* Left align text */
          }

          .cert-header {
            font-family: 'Lato', sans-serif;
            font-size: 32px;
            color: #FFF;
            font-weight: 400;
            margin-bottom: 25px;
            letter-spacing: 1px; /* Reduced spacing slightly since it's not uppercase */
          }

          .student-name { 
            font-family: 'Lato', sans-serif; 
            font-size: 80px; 
            color: #FFF; 
            font-weight: 700; /* Lato Bold */
            letter-spacing: 1px;
            text-transform: capitalize;
            margin-bottom: 25px;
            line-height: 1.1;
          }
          
          .cert-body {
            font-family: 'Lato', sans-serif;
            font-size: 28px;
            color: #FFF;
            font-weight: 300;
            margin-bottom: 25px;
          }
          
          .course-title { 
            font-family: 'Lato', sans-serif; 
            font-size: 48px; 
            color: #FFF; 
            font-weight: 700; 
            margin-bottom: 35px;
            /* Ensure long titles wrap nicely */
            white-space: normal; 
            line-height: 1.2;
            max-width: 90%;
          }
          
          .date { 
            font-family: 'Lato', sans-serif; 
            font-size: 24px; 
            color: #FFF; 
            font-weight: 400;
            margin-top: 10px;
          }

          .cert-id {
            position: absolute;
            top: 120px;
            right: 160px;
            font-family: 'Lato', sans-serif;
            font-size: 24px;
            color: #FFF;
            font-weight: 400;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="cert-container">
          <div class="cert-id">Certificate ID: ${certificateId}</div>
          <div class="content-layer">
            <div class="cert-header">${dateStr}</div>
            <div class="student-name">${userName}</div>
            <div class="cert-body">has successfully completed </div>
            <div class="course-title">${courseTitle}</div>
            <div class="date">The holder of this certificate has successfully completed ${courseTitle}, a hands-on, industry-driven <br> 
            program in ${industry}, demonstrating practical expertise through real-world projects and challenges.</div>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("Step 2: Sending HTML to HCTI API...");
    // 3. Call HCTI API
    const response = await fetch('https://hcti.io/v1/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(HCTI_ID + ':' + HCTI_KEY)
      },
      body: JSON.stringify({ 
        html, 
        css: "", 
        google_fonts: "Lato",
        device_scale_factor: 1, // Set to 1 as requested for exact pixel mapping
        selector: ".cert-container", // Crops exactly to the certificate div
        ms_delay: 500 // Ensures background image loads
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HCTI API Failed: ${response.status} ${response.statusText} - ${errText}`);
    }

    const hctiData = await response.json();
    if (!hctiData.url) throw new Error("Failed to generate image from HCTI: No URL returned");
    console.log("HCTI Image generated:", hctiData.url);

    // 4. Download Image from HCTI to upload to Supabase
    console.log("Step 3: Downloading image for upload...");
    const imgRes = await fetch(hctiData.url);
    if (!imgRes.ok) throw new Error("Failed to download generated image.");
    const blob = await imgRes.blob();

    // 5. Upload to Supabase 'Certificates' bucket
    const fileName = `${userId}_${Date.now()}.png`;
    console.log(`Step 4: Uploading to Supabase bucket 'Certificates' as ${fileName}...`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('Certificates') 
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
        console.error("Supabase Storage Upload Error:", uploadError);
        throw new Error(`Storage Upload Failed: ${uploadError.message}`);
    }

    // 6. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('Certificates')
      .getPublicUrl(fileName);
    
    console.log("Public URL generated:", publicUrl);

    // 7. Insert Record into DB
    console.log("Step 5: Inserting record into database...");
    const { data: cert, error: dbError } = await supabase
      .from('user_certificates')
      .insert([{
        id: certificateId,
        user_id: userId,
        course_title: courseTitle,
        certificate_url: publicUrl
      }])
      .select()
      .single();

    if (dbError) {
        console.error("Database Insert Error:", dbError);
        throw new Error(`Database Insert Failed: ${dbError.message}`);
    }
    
    console.log("Certificate process complete:", cert);
    return cert as Certificate;

  } catch (err) {
    console.error("Certificate Generation Error Details:", err);
    return null;
  }
};
