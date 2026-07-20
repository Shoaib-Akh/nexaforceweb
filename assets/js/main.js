// Surface any uncaught error into the visible form note (so failures are never silent).
window.addEventListener("error", (event) => {
  const note = document.querySelector(".contact-form .form-note");
  if (note) {
    note.textContent = "Error: " + (event.message || "script failed to load");
    note.classList.add("is-error");
  }
});

function safeSetup(label, fn) {
  try {
    fn();
  } catch (error) {
    console.error(`[${label}]`, error);
  }
}

safeSetup("menu", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const primaryNav = document.querySelector(".primary-nav");

  if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = primaryNav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    primaryNav.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        primaryNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }
});

safeSetup("faq", () => {
  const faqItems = document.querySelectorAll(".faq-list details");

  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) otherItem.removeAttribute("open");
      });
    });
  });
});

safeSetup("filters", () => {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter || "all";

      filterButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");

      projectCards.forEach((card) => {
        const shouldShow = filter === "all" || card.dataset.category === filter;
        card.hidden = !shouldShow;
      });
    });
  });
});

const whatsappNumber = "923280399018";
const whatsappDisplayNumber = "+92 3280399018";

// Paste your Supabase project credentials here
const supabaseUrl = "https://ysgcmtpmsezvdkbuwapj.supabase.co"; // Example: "https://xyz.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZ2NtdHBtc2V6dmRrYnV3YXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NDg1MjgsImV4cCI6MjEwMDAyNDUyOH0.3ZwmNOhhyxT75SwKpTH-AhAbngkY26mNxtsb9jpkdqA"; // Example: "eyJhbGciOi..."

// Initialize Supabase Client dynamically on submit or check
let supabaseClient = null;
function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (typeof window.supabase !== "undefined" && supabaseUrl && supabaseAnonKey) {
    try {
      supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      console.error("Supabase initialization error:", error);
    }
  }
  return supabaseClient;
}

// Upload file to Supabase Storage
async function uploadCVToSupabase(file) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not initialized.");

  // Create a unique filename to prevent overwrite conflicts
  const fileExt = file.name.split(".").pop();
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  const { data, error } = await client.storage
    .from("cvs")
    .upload(uniqueName, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) throw error;

  // Retrieve public download URL
  const { data: urlData } = client.storage
    .from("cvs")
    .getPublicUrl(uniqueName);

  if (!urlData || !urlData.publicUrl) {
    throw new Error("Failed to resolve public URL.");
  }

  return urlData.publicUrl;
}

// Save application record to Supabase Database
async function saveApplicationToSupabase(type, details) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not initialized.");

  const { data, error } = await client
    .from("applications")
    .insert([
      {
        type: type, // 'internship' or 'job'
        name: details.name,
        email: details.email,
        phone: details.phone || null,
        role: details.role || null,
        availability: details.availability || null,
        message: details.message || null,
        cv_file_name: details.cvFileName || null,
        cv_url: details.cvUrl || null
      }
    ])
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

// Save quote request to Supabase Database
async function saveQuoteToSupabase(details) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not initialized.");

  const { data, error } = await client
    .from("quotes")
    .insert([
      {
        name: details.name,
        email: details.email,
        phone: details.phone || null,
        service: details.service,
        message: details.message
      }
    ]);

  if (error) throw error;
  return data;
}

// Fallback file uploader
async function uploadCVFileFallback(file) {
  const formData = new FormData();
  formData.append("file", file);

  // Try tmpfiles.org first
  try {
    const response = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      const json = await response.json();
      if (json.status === "success" && json.data && json.data.url) {
        return json.data.url.replace("https://tmpfiles.org/", "https://tmpfiles.org/dl/");
      }
    }
  } catch (error) {
    console.error("tmpfiles fallback upload error:", error);
  }

  // Fallback to file.io
  try {
    const response = await fetch("https://file.io", {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      const json = await response.json();
      if (json.success && json.link) {
        return json.link;
      }
    }
  } catch (error) {
    console.error("file.io fallback upload error:", error);
  }

  return null;
}

function setNote(note, text, isError = false) {
  if (!note) return;
  if (/<[a-z][\s\S]*>/i.test(text)) {
    note.innerHTML = text;
  } else {
    note.textContent = text;
  }
  note.classList.toggle("is-error", isError);
  note.classList.toggle("is-success", !isError && Boolean(text));
}

function openWhatsApp(url) {
  // Try to open chat in a new tab.
  // If the browser blocks the popup (due to async delay), the user can click
  // the green "Open WhatsApp" button in the success message to open in a new tab.
  window.open(url, "_blank", "noopener,noreferrer");
}

function buildWhatsAppText(lines) {
  return encodeURIComponent(lines.filter(Boolean).join("\n"));
}

async function handleFormSubmit(form, event) {
  if (event && event.preventDefault) event.preventDefault();
  const note = form.querySelector(".form-note");
  form.classList.remove("has-error");

  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const service = String(formData.get("service") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const availability = String(formData.get("availability") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const cvFileInput = form.querySelector('[name="cv_file"]');
  const cvFile = cvFileInput && cvFileInput.files ? cvFileInput.files[0] : null;
  const cvUrlInput = form.querySelector('[name="cv_link"]');
  const cvUrl = cvUrlInput ? String(cvUrlInput.value || "").trim() : "";

  const isCareers = form.classList.contains("careers-form");
  const isInternship = form.classList.contains("internship-form");

  if (!name || !email) {
    form.classList.add("has-error");
    setNote(note, "Please fill in your name and a valid email.", true);
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    form.classList.add("has-error");
    setNote(note, "Please enter a valid email address.", true);
    return;
  }
  if (isCareers && !role) {
    form.classList.add("has-error");
    setNote(note, "Please select the role you are applying for.", true);
    return;
  }

  let cvLink = cvUrl || null;
  let cvFileName = cvFile ? cvFile.name : null;

  if (cvFile) {
    cvFileName = cvFile.name;
    setNote(note, "Uploading your CV... Please wait.");
    try {
      if (getSupabaseClient()) {
        cvLink = await uploadCVToSupabase(cvFile);
      } else {
        cvLink = await uploadCVFileFallback(cvFile);
      }
    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      cvLink = null;
    }
  }

  const client = getSupabaseClient();
  if (isCareers && client) {
    try {
      setNote(note, "Saving your application...");
      await saveApplicationToSupabase(
        isInternship ? "internship" : "job",
        {
          name,
          email,
          phone,
          role,
          availability,
          message,
          cvFileName,
          cvUrl: cvLink
        }
      );
    } catch (dbError) {
      console.error("Supabase Database error:", dbError);
    }
  }

  if (!isCareers && client) {
    try {
      await saveQuoteToSupabase({ name, email, phone, service, message });
    } catch (dbError) {
      console.error("Supabase Database quote error:", dbError);
    }
  }

  const header = isCareers
    ? (isInternship
        ? "New internship application from NexaForce careers page:"
        : "New job application from NexaForce careers page:")
    : "New quote request from NexaForce website:";

  const lines = [
    header,
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "Not provided"}`,
    isCareers ? `Role: ${role || "Not specified"}` : `Service: ${service}`,
    isInternship ? `Availability: ${availability || "Not specified"}` : null,
    cvLink ? `CV Link: ${cvLink}` : (cvFileName ? `CV File: ${cvFileName} (attached)` : "CV: Not provided"),
    "",
    "Message:",
    message || "No message provided."
  ];

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${buildWhatsAppText(lines)}`;

  setNote(note, `Done! Your application has been saved. <a class="whatsapp-link" href="${whatsappUrl}" target="_blank" rel="noopener">Open WhatsApp (${whatsappDisplayNumber}) to send your CV & details</a>`, false);
  openWhatsApp(whatsappUrl);

  setTimeout(() => {
    form.reset();
    const nameEl = form.querySelector(".file-name");
    const textEl = form.querySelector(".file-text");
    if (nameEl) nameEl.textContent = "";
    if (textEl) textEl.textContent = "Click to choose your CV file";
    setNote(note, "");
  }, 3000);
}

// Expose for inline onsubmit fallback so the form never does a native "#" submit
// even if this script fails to attach listeners.
window.handleFormSubmit = handleFormSubmit;

safeSetup("careers-forms", () => {
  document.querySelectorAll(".contact-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      handleFormSubmit(form, event);
    });
  });
});

safeSetup("careers-file", () => {
document.querySelectorAll('.careers-form input[type="file"]').forEach((input) => {
  const form = input.closest("form");
  const nameEl = form.querySelector(".file-name");
  const dropEl = form.querySelector(".file-drop");
  const textEl = form.querySelector(".file-text");
  const defaultText = textEl ? textEl.textContent : "";

  const updateName = () => {
    if (!input.files || !input.files.length) {
      if (nameEl) nameEl.textContent = "";
      if (textEl) textEl.textContent = defaultText;
      return;
    }
    const file = input.files[0];
    if (nameEl) {
      nameEl.textContent = `Selected: ${file.name}`;
      nameEl.classList.remove("has-error");
    }
    if (textEl) textEl.textContent = "Choose a different file";
  };

  input.addEventListener("change", updateName);

  if (dropEl) {
    ["dragenter", "dragover"].forEach((type) => {
      dropEl.addEventListener(type, (event) => {
        event.preventDefault();
        dropEl.classList.add("is-dragover");
      });
    });
    ["dragleave", "drop"].forEach((type) => {
      dropEl.addEventListener(type, (event) => {
        event.preventDefault();
        dropEl.classList.remove("is-dragover");
      });
    });
    dropEl.addEventListener("drop", () => updateName());
  }
});
});
