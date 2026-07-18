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

const faqItems = document.querySelectorAll(".faq-list details");

faqItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    faqItems.forEach((otherItem) => {
      if (otherItem !== item) otherItem.removeAttribute("open");
    });
  });
});

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

const whatsappNumber = "923280399018";

document.querySelectorAll(".contact-form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const note = form.querySelector(".form-note");
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const service = String(formData.get("service") || "").trim();
    const role = String(formData.get("role") || "").trim();
    const availability = String(formData.get("availability") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const fileInput = form.querySelector('input[type="file"]');
    const cvFile = fileInput && fileInput.files ? fileInput.files[0] : null;

    if (!name || !email) {
      if (note) note.textContent = "Please fill in your name and email.";
      return;
    }

    if (fileInput && fileInput.required && !cvFile) {
      if (note) note.textContent = "Please attach your CV before submitting.";
      return;
    }

    const cvName = cvFile ? cvFile.name : "Not attached";

    if (form.classList.contains("careers-form")) {
      const isInternship = form.classList.contains("internship-form");
      const whatsappMessage = [
        isInternship
          ? "New internship application from NexaForce careers page:"
          : "New job application from NexaForce careers page:",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || "Not provided"}`,
        `Role: ${role || "Not specified"}`,
        isInternship ? `Availability: ${availability || "Not specified"}` : null,
        `CV: ${cvName}`,
        "",
        "Message:",
        message || "No message provided.",
      ].filter(Boolean).join("\n");
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

      if (note) {
        note.textContent = "Opening WhatsApp with your application...";
      }
      window.location.href = whatsappUrl;
      return;
    }

    const whatsappMessage = [
      "New quote request from NexaForce website:",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      `Service: ${service}`,
      "",
      "Message:",
      message,
    ].join("\n");
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    if (note) {
      note.textContent = "Opening WhatsApp with your message...";
    }
    window.location.href = whatsappUrl;
  });
});

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
