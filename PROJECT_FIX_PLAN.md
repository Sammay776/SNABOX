# Project Plan: Frontend Replacement

**Overall Status: Completed**

This plan outlines the process of replacing the existing React-based frontend with the new vanilla JavaScript frontend. The primary goal of this plan has been achieved.

**Guiding Principles:**
- **Phased Approach:** Each phase was presented for confirmation before execution.
- **Safety:** A backup of the current frontend was created before making changes.
- **Error Prediction:** Potential issues were identified and mitigated in each phase.

---

### Phase 1: Analysis & Backup

**Status: Completed**

**Goal:** Understand the current setup and create a safe backup of the existing frontend.

**Outcome:** Analysis revealed that the backend was not serving static files and the new frontend was a mock application. A backup of the original frontend was successfully created at `frontend_backup`.

---

### Phase 2: Frontend Integration

**Status: Completed**

**Goal:** Replace the old frontend with the new one and configure the server to use it.

**Outcome:** The new frontend files were copied to a `frontend` directory. The backend `index.js` was modified to serve these files. A temporary bypass was added to `app.js` to skip the mock login screen for testing.

---

### Phase 3: Verification & Testing

**Status: Completed**

**Goal:** Ensure the new frontend is working correctly with the backend.

**Outcome:** The user successfully started the server and confirmed the new frontend was visible. A missing background image was identified and fixed by the user. The mock upload functionality was tested and confirmed to be working as expected.

---

### Phase 4: Backend Integration

**Status: Completed**

**Goal:** Connect the frontend "Upload" button to the real backend API.

**Outcome:** The `uploadFile` function in `frontend/app.js` was rewritten to use `fetch` to send files to the `/upload` endpoint. The user tested and confirmed that uploaded files are now successfully stored in their Supabase bucket.

---

## Project Plan: Full-Stack Authentication

**Overall Status: Completed**

This plan outlines the process of implementing a full-stack authentication system using Supabase Auth.

**Guiding Principles:**
- **Phased Approach:** Each phase will be presented for confirmation before execution.
- **Security First:** The implementation will follow security best practices.
- **Backend First:** Backend endpoints will be created and secured before frontend integration.

---

### Phase 1: Backend Authentication Endpoints

**Status: Completed**

**Goal:** Create the necessary backend endpoints to handle user registration and login.

**Tasks:**
1.  Add a `/register` endpoint to `index.js` to create new users via Supabase.
2.  Add a `/login` endpoint to `index.js` to authenticate users and issue a session token.
3.  Add a `/logout` endpoint to `index.js`.

---

### Phase 2: Secure Backend Upload Endpoint

**Status: Completed**

**Goal:** Protect the `/upload` endpoint to ensure only authenticated users can upload files.

**Tasks:**
1.  Create a middleware function to verify the session token sent from the frontend.
2.  Apply this middleware to the `/upload` endpoint in `index.js`.
3.  Associate uploaded files with the authenticated user's ID.

---

### Phase 3: Frontend Integration

**Status: Completed**

**Goal:** Connect the frontend UI to the new backend authentication system.

**Tasks:**
1.  Remove the mock authentication logic from `frontend/app.js`.
2.  Update the login and signup forms to use the new backend endpoints.
3.  Implement client-side session management (storing and using the auth token).
4.  Remove the temporary login bypass from `frontend/app.js`.

---

### Phase 4: Implement Real File Listing & Deletion

**Status: Completed**

**Goal:** Implement secure file listing and deletion using a database table and Row-Level Security.

**Tasks:**
1.  **Database Setup:** *(Completed)*
2.  **Backend Integration (`index.js`):** *(Completed)*
3.  **Frontend Integration (`app.js`):** *(Completed)*

---

### Phase 5: Security Hardening

**Status: Completed**

**Goal:** Tighten the Storage policies to provide a second layer of security and prevent direct, unauthorized access to files.

**Tasks:**
1.  Review and remove any overly permissive, existing policies on the `files` storage bucket. *(Completed)*
2.  Create new, stricter Storage policies that limit `SELECT`, `INSERT`, and `DELETE` operations to authenticated users acting within their own user folder. *(Completed)*

---

---

## Project Plan: Deployment

**Overall Status: Completed**

**Guiding Principles:**
- **Hosting:** Backend on Render, Frontend on Vercel.
- **Source Control:** Use a GitHub repository as the source for deployments.
- **Phased Approach:** Deploy the backend first, then the frontend.

---

### Phase 1: GitHub Repository Setup

**Status: Completed**

**Goal:** Create a GitHub repository and push the entire project to it.

**Tasks:**
1.  Guide the user to create a new, public repository on GitHub.
2.  Provide the necessary `git` commands to initialize a repository locally, commit the files, and push them to GitHub.
3.  Ensure the `.env` file is included in a `.gitignore` file to prevent secrets from being published.

---

### Phase 2: Backend Deployment to Render

**Status: Completed**

**Goal:** Deploy the Node.js backend to a public web service on Render.

**Tasks:**
1.  Guide the user to sign up for a Render account (using their GitHub account).
2.  Guide them to create a new "Web Service" on Render, connecting it to their new GitHub repository.
3.  Configure the Render service settings (e.g., build command `npm install`, start command `npm start`).
4.  Configure the necessary environment variables (`SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_ANON_KEY`) in the Render dashboard.
5.  Trigger the first deployment and verify it is live.

---

### Phase 3: Frontend Deployment to Vercel & Final Configuration

**Status: Completed**

**Goal:** Deploy the static frontend to Vercel and configure the final CORS policy.

**Tasks:**
1.  Guide the user to sign up for a Vercel account (using their GitHub account).
2.  Guide them to create a new "Project" on Vercel, connecting it to the same GitHub repository.
3.  Configure the Vercel project settings (specifying the `frontend` directory as the root).
4.  Deploy the frontend.
5.  **Final CORS Update:**
    *   Get the live URL of the deployed Vercel frontend.
    *   Update the `cors()` configuration in `index.js` to only allow that URL.
    *   Push the change to GitHub, which will trigger a new backend deployment on Render.
6.  Final verification of the fully deployed, secure application.
---

## Project Plan: Add File Download Feature

**Overall Status: Not Started**

**Guiding Principles:**
- **Security:** The download process will be secure, ensuring users can only download their own files.
- **Efficiency:** We will let Supabase handle the heavy lifting of the download itself, which is faster and more scalable.
- **User Experience:** The download will be instantaneous from the user's perspective and the UI will be clean and intuitive.
- **Code Comments:** All new code will be clearly marked with start and end comments (e.g., `// newly added by gemini` and `// editing ended by gemini`) for easy identification.

---

### Phase 1: Backend - Create the Secure Download Endpoint

**Status: Not Started**

**Goal:** Create a new API endpoint on the backend that can provide a secure, temporary download link for a specific file.

**Tasks:**
1.  Modify the backend server file (`index.js`).
2.  Add a new route: `GET /files/download/:id`.
3.  Protect the route with the existing authentication middleware.
4.  Implement logic to verify that the requested file belongs to the authenticated user.
5.  Generate a temporary, secure "signed URL" for the file using Supabase Storage.
6.  Send the signed URL back to the frontend.

---

### Phase 2: Frontend - Add the Download Button and Logic

**Status: Not Started**

**Goal:** Add the "Download" button to the user interface and write the JavaScript code to make it work.

**Tasks:**
1.  In `frontend/app.js`, update the file list rendering to include a "Download" button next to the "Delete" button.
2.  Add a new event listener to handle clicks on the "Download" button.
3.  Create a new `downloadFile` function that calls the backend to get the secure link.
4.  Implement the logic within `downloadFile` to trigger an instantaneous browser download for the user.

---

### Phase 3: Styling - Finalize Button Appearance

**Status: Not Started**

**Goal:** Ensure the new button layout and style match the user's request.

**Tasks:**
1.  Modify `frontend/styles.css` to handle the new button layout.
2.  Place the "Download" and "Delete" buttons side-by-side, ensuring they fit in the existing space.
3.  Ensure the "Download" button has the identical style (color, size, font) as the "Delete" button.

---
