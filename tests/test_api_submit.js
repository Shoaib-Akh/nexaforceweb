/**
 * Test case script for NexaForce Career application submission.
 * This script runs in Node.js (v18+) and directly calls the Supabase API to:
 *   1. Upload a mock resume file to Supabase Storage
 *   2. Insert an application row into the public.applications table
 * 
 * Usage:
 *   node --env-file=.env tests/test_api_submit.js
 */

const fs = require('fs');
const path = require('path');

// Fallback values if env variables are not present
const SUPABASE_URL = process.env.SUPABASE_URL || "https://ysgcmtpmsezvdkbuwapj.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZ2NtdHBtc2V6dmRrYnV3YXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NDg1MjgsImV4cCI6MjEwMDAyNDUyOH0.3ZwmNOhhyxT75SwKpTH-AhAbngkY26mNxtsb9jpkdqA";

const NAME = "Shoib Akhtar";
const EMAIL = "asd@sdfasd.sad";
const PHONE = "213";
const ROLE = "App Development Intern";
const AVAILABILITY = "Part-time";
const MESSAGE = "asd";
const CV_FILE_NAME = "Shoib Akhtar — Resume.pdf";

async function run() {
  console.log(`Starting test submission directly to Supabase API...`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);

  // Create temporary mock PDF
  const tempPdfPath = path.join(__dirname, 'temp_resume.pdf');
  const dummyPdfContent = Buffer.from("%PDF-1.4 Dummy Resume Content for Testing");
  fs.writeFileSync(tempPdfPath, dummyPdfContent);

  try {
    // Generate unique storage path
    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 90000) + 10000}`;
    const storagePath = `${uniqueSuffix}_Shoib_Akhtar_Resume.pdf`;

    console.log(`\nStep 1: Uploading mock resume file to storage bucket 'cvs'...`);
    
    const fileBuffer = fs.readFileSync(tempPdfPath);
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/cvs/${storagePath}`;
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/pdf'
      },
      body: fileBuffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    console.log(`Upload successful. Response:`, uploadData);

    const cvUrl = `${SUPABASE_URL}/storage/v1/object/public/cvs/${storagePath}`;
    console.log(`Public CV URL: ${cvUrl}`);

    console.log(`\nStep 2: Inserting application record into 'applications' database table...`);
    
    const dbUrl = `${SUPABASE_URL}/rest/v1/applications`;
    const applicationPayload = {
      type: 'internship',
      name: NAME,
      email: EMAIL,
      phone: PHONE,
      role: ROLE,
      availability: AVAILABILITY,
      message: MESSAGE,
      cv_file_name: CV_FILE_NAME,
      cv_url: cvUrl
    };

    const dbResponse = await fetch(dbUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(applicationPayload)
    });

    if (!dbResponse.ok) {
      const errorText = await dbResponse.text();
      throw new Error(`Database insert failed with status ${dbResponse.status}: ${errorText}`);
    }

    const insertedData = await dbResponse.json();
    console.log(`Database insertion successful. Created Row:`, insertedData);

    console.log(`\n==========================================`);
    console.log(`SUCCESS! Node.js API Test Case Passed.`);
    console.log(`Application ID: ${insertedData[0]?.id}`);
    console.log(`Uploaded CV URL: ${cvUrl}`);
    console.log(`==========================================`);

  } catch (error) {
    console.error(`\n❌ Test failed:`, error.message);
    process.exitCode = 1;
  } finally {
    // Cleanup temporary file
    if (fs.existsSync(tempPdfPath)) {
      fs.unlinkSync(tempPdfPath);
      console.log(`\nCleaned up temporary local file.`);
    }
  }
}

run();
