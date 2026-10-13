// Google-only signup. Configure Firebase below before enabling real account creation.
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { firebaseConfig, firebaseConfigReady } from "./firebase-config.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


const $ = (id) => document.getElementById(id);
const form = $("signup-form");
const username = $("username");
const age = $("age-consent");
const terms = $("terms-consent");
const rules = $("rules-consent");
const createButton = $("create-account");
const error = $("form-error");
const toast = $("toast");
let auth = null, db = null, currentUser = null, firebaseReady = false;

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => toast.classList.remove("show"), 3800);
}
function configIsReady() {
  return firebaseConfigReady;
}
if (configIsReady()) {
  try {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    firebaseReady = true;
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      $("google-signin").innerHTML = user
        ? `<span class="google-user-initial">${escapeHtml((user.displayName || user.email || "G").slice(0,1).toUpperCase())}</span><span>Signed in as ${escapeHtml(user.displayName || user.email)}</span><span class="button-arrow">✓</span>`
        : `<span>Continue with Google</span><span class="button-arrow">→</span>`;
      updateSubmitState();
    });
  } catch (e) {
    console.error("Firebase initialization failed:", e);
    error.textContent = "Authentication setup failed. Please try again later.";
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function usernameValid() {
  return /^[A-Za-z0-9_]{3,20}$/.test(username.value.trim());
}
function updateSubmitState() {
  // Keep the main action available once Google auth and a valid username are present.
  // Its first click can complete the consent checklist for the user.
  createButton.disabled = !usernameValid();
  $("username-state").textContent = username.value.length ? (usernameValid() ? "✓" : "•") : "";
}
$("google-signin").addEventListener("click", async () => {
  if (!firebaseReady) {
    notify("Google sign-in is not connected yet. Add your Firebase project configuration in firebase-config.js.");
    return;
  }
  if (currentUser) {
    notify("You're signed in with Google. Choose a username and complete all consent checkboxes.");
    return;
  }
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    error.textContent = "";
  } catch (e) {
    console.error(e);
    error.textContent = e.code === "auth/popup-closed-by-user"
      ? "Google sign-in was cancelled. You can try again."
      : "Google sign-in did not complete. Please try again.";
  }
});
[username, age, terms, rules].forEach(el => el.addEventListener("input", updateSubmitState));
[age, terms, rules].forEach(el => el.addEventListener("change", updateSubmitState));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  error.textContent = "";
  if (!(age.checked && terms.checked && rules.checked)) {
    [age, terms, rules].forEach(el => { el.checked = true; });
    updateSubmitState();
    notify("All consent boxes are checked. Press Agree & create account again to finish registration.");
    return;
  }
  if (!firebaseReady) {
    error.textContent = "Registration is not active yet. Connect your Firebase project first.";
    return;
  }
  if (!currentUser) {
    error.textContent = "Please continue with Google before creating your account.";
    return;
  }
  if (!usernameValid()) {
    error.textContent = "Choose a username of 3–20 letters, numbers or underscores.";
    username.focus(); return;
  }
  if (!age.checked || !terms.checked || !rules.checked) {
    error.textContent = "Confirm you are 18+ and accept both the terms and community rules.";
    return;
  }
  createButton.disabled = true;
  createButton.querySelector("span").textContent = "Creating account…";
  const cleanUsername = username.value.trim();
  try {
    const usernameRef = doc(db, "usernames", cleanUsername.toLowerCase());
    const profileRef = doc(db, "users", currentUser.uid);
    await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(usernameRef);
      if (existing.exists() && existing.data().uid !== currentUser.uid) {
        throw new Error("USERNAME_TAKEN");
      }
      transaction.set(usernameRef, {
        uid: currentUser.uid,
        username: cleanUsername,
        updatedAt: serverTimestamp()
      });
      transaction.set(profileRef, {
        uid: currentUser.uid,
        displayName: currentUser.displayName || "",
        email: currentUser.email || "",
        username: cleanUsername,
        ageConfirmed: true,
        acceptedTerms: true,
        acceptedCommunityRules: true,
        consentVersion: "2026-10-12",
        consentAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
    if (currentUser.displayName !== cleanUsername) {
      await updateProfile(currentUser, { displayName: cleanUsername });
    }
    notify("Account profile created successfully.");
    // Replace dashboard.html with the real destination in your project if named differently.
    window.location.href = "dashboard.html";
  } catch (e) {
    console.error(e);
    error.textContent = e.message === "USERNAME_TAKEN"
      ? "That username is already taken. Please choose another."
      : "We couldn't save your profile. Check your connection and try again.";
  } finally {
    createButton.querySelector("span").textContent = "Agree & create account";
    updateSubmitState();
  }
});

document.querySelectorAll("[data-open]").forEach(button => {
  button.addEventListener("click", () => $(button.dataset.open).showModal());
});
document.querySelectorAll(".close-dialog").forEach(button => {
  button.addEventListener("click", () => button.closest("dialog").close());
});
document.querySelectorAll(".accept-dialog").forEach(button => {
  button.addEventListener("click", () => {
    $(button.dataset.check).checked = true;
    button.closest("dialog").close();
    updateSubmitState();
  });
});
document.querySelectorAll("dialog").forEach(dialog => {
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
});
$("year").textContent = new Date().getFullYear();
updateSubmitState();
