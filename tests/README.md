# NexaForce Career Form Submission Tests

This directory contains test cases for validating the Career and Internship Application form submission flow.

## Why the original `curl` request failed

You might have tried running a `curl` request like this directly to your local development server:
```bash
curl 'http://127.0.0.1:5500/nexaforceweb/careers/' -X POST ...
```
This fails to insert database records because:
1. **Static Server Limitations**: The server running on port `5500` is a static file server (like VS Code Live Server). It serves HTML, CSS, and JS files, but does not have a backend handler that listens to `POST` requests or processes form submissions on the server side.
2. **Client-Side Form Interception**: The form submission logic is implemented on the client side using JavaScript (`assets/js/main.js`). When a user clicks submit:
   - The browser blocks the default native form submit (`event.preventDefault()`).
   - The JavaScript client uploads the file to **Supabase Storage** (the `cvs` bucket) and retrieves the public URL.
   - The JavaScript client inserts the metadata and CV URL into the **Supabase Database** (the `applications` table).
   - Finally, the client opens a WhatsApp window with a pre-filled template message.

---

## Test Options

We have created two perfect test cases to validate the implementation:

### 1. Direct Supabase API Integration Test (Recommended)
This tests the actual API communication, ensuring that your Supabase client policies (RLS), schema, credentials, and storage permissions are set up correctly.

We've provided both a Bash version (using `curl` and `jq`) and a Node.js version (using native `fetch` with no external dependencies).

#### Running the Node.js Test (Cross-Platform)
This script reads your Supabase credentials directly from the `.env` file at the root of the project using the native Node.js environment variables loader.
```bash
node --env-file=.env tests/test_api_submit.js
```

#### Running the Bash Test (Unix/macOS)
This script reads `.env` variables and uses `curl` to upload the file to Supabase storage first, then inserts the application into the database.
```bash
# Make it executable
chmod +x tests/test_api_submit.sh
# Run it
./tests/test_api_submit.sh
```

---

### 2. End-to-End Browser Test (Playwright)
This tests the full client-side user experience: page load, form input validation, file drop/upload interaction, Supabase storage upload, database insertion, success messages, and the WhatsApp redirect.

#### Prerequisites:
1. Install Playwright:
   ```bash
   npm install -D playwright
   ```
2. Ensure your local server is running at `http://127.0.0.1:5500/nexaforceweb/careers/`.

#### Running the E2E Test:
```bash
node tests/test_browser_submit.js
```
*(The E2E test intercepts and mocks the final WhatsApp redirect window so it doesn't open visual pop-up windows during automation.)*
