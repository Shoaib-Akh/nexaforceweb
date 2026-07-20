#!/bin/bash

# Exit on error
set -e

# Change directory to the script's directory so relative paths work
cd "$(dirname "$0")"

# Load .env file from the parent directory
ENV_FILE="../.env"
if [ -f "$ENV_FILE" ]; then
  # Load env variables, ignoring comments
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Fallback values if not defined in .env
SUPABASE_URL=${SUPABASE_URL:-"https://ysgcmtpmsezvdkbuwapj.supabase.co"}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZ2NtdHBtc2V6dmRrYnV3YXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NDg1MjgsImV4cCI6MjEwMDAyNDUyOH0.3ZwmNOhhyxT75SwKpTH-AhAbngkY26mNxtsb9jpkdqA"}

echo "Using Supabase URL: $SUPABASE_URL"

# Define mock data based on your curl request
NAME="Shoib Akhtar"
EMAIL="asd@sdfasd.sad"
PHONE="213"
ROLE="App Development Intern"
AVAILABILITY="Part-time"
MESSAGE="asd"
CV_FILE_NAME="Shoib Akhtar — Resume.pdf"

# 1. Create a dummy PDF file for testing
echo "Creating dummy resume PDF..."
DUMMY_PDF_PATH="./temp_resume.pdf"
echo "%PDF-1.4
%âãÏÓ
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 612 792 ] /Resources << >> /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 50 >>
stream
BT /F1 12 Tf 72 712 Td (Dummy resume content for testing) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000015 00000 n 
0000000062 00000 n 
0000000119 00000 n 
0000000216 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
315
%%EOF" > "$DUMMY_PDF_PATH"

# Generate a unique path for Supabase storage to prevent duplicates
UNIQUE_SUFFIX="$(date +%s)-$((RANDOM % 90000 + 10000))"
STORAGE_PATH="${UNIQUE_SUFFIX}_Shoib_Akhtar_Resume.pdf"

echo "Step 1: Uploading resume file to Supabase storage bucket 'cvs'..."
UPLOAD_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/storage/v1/object/cvs/${STORAGE_PATH}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/pdf" \
  --data-binary "@$DUMMY_PDF_PATH")

echo "Upload Response: $UPLOAD_RESPONSE"

# Extract bucket path or id to verify success
UPLOAD_KEY=$(echo "$UPLOAD_RESPONSE" | jq -r '.Key // empty')

if [ -z "$UPLOAD_KEY" ]; then
  echo "Error: Upload failed. Response: $UPLOAD_RESPONSE"
  rm -f "$DUMMY_PDF_PATH"
  exit 1
fi

CV_URL="${SUPABASE_URL}/storage/v1/object/public/cvs/${STORAGE_PATH}"
echo "Resume uploaded successfully. Public URL: $CV_URL"

# 2. Insert application record into the applications table
echo "Step 2: Inserting application record into 'applications' database table..."
DB_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/applications" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"type\": \"internship\",
    \"name\": \"$NAME\",
    \"email\": \"$EMAIL\",
    \"phone\": \"$PHONE\",
    \"role\": \"$ROLE\",
    \"availability\": \"$AVAILABILITY\",
    \"message\": \"$MESSAGE\",
    \"cv_file_name\": \"$CV_FILE_NAME\",
    \"cv_url\": \"$CV_URL\"
  }")

echo "Database Insert Response: $DB_RESPONSE"

# Verify insertion
INSERTED_ID=$(echo "$DB_RESPONSE" | jq -r '.[0].id // empty')

if [ -z "$INSERTED_ID" ]; then
  echo "Error: Database insertion failed."
  rm -f "$DUMMY_PDF_PATH"
  exit 1
fi

echo "=========================================="
echo "SUCCESS! Test Case Executed Perfectly."
echo "Application ID: $INSERTED_ID"
echo "Uploaded CV: $CV_URL"
echo "=========================================="

# Cleanup
rm -f "$DUMMY_PDF_PATH"
