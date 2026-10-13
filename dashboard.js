import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { firebaseConfig, firebaseConfigReady } from "./firebase-config.js";
import { getAuth, onAuthStateChanged, deleteUser, GoogleAuthProvider, reauthenticateWithPopup } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = id => document.getElementById(id);
const ready = firebaseConfigReady;
let auth, db, activeUser = null, profile = {}, selectedPlan = null;
const paymentDialog = $("payment-dialog"), deleteDialog = $("delete-dialog");
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),3500)}
function safeText(value, fallback="—"){return typeof value === "string" && value.trim() ? value.trim() : fallback}
function applyTheme(theme){document.documentElement.dataset.theme=theme;$("theme-icon").textContent=theme === "dark" ? "☼" : "☾";$("theme-toggle").setAttribute("aria-label",`Switch to ${theme === "dark" ? "light" : "dark"} mode`);document.querySelector('meta[name="theme-color"]').content=theme === "dark" ? "#07180f" : "#f4f5ef"}
try{applyTheme(localStorage.getItem("tmc-dashboard-theme") || "dark")}catch{applyTheme("dark")}
$("theme-toggle").addEventListener("click",()=>{const next=document.documentElement.dataset.theme === "dark" ? "light" : "dark";applyTheme(next);try{localStorage.setItem("tmc-dashboard-theme",next)}catch{}});
$("account-menu").addEventListener("click",()=>{$("account-options").hidden=!$("account-options").hidden});
$("menu-toggle").addEventListener("click",()=>{$("account-options").hidden=!$("account-options").hidden;$("account-options").scrollIntoView({behavior:"smooth",block:"nearest"})});
let countdownTimer=null;
function updateCountdown(expiry,status){
  if(countdownTimer) clearInterval(countdownTimer);
  const label=$("expiry-countdown"), detail=$("expiry-date");
  function tick(){
    if(status!=="active" || !expiry || Number.isNaN(expiry.getTime())){
      label.textContent=status==="expired"?"Expired":"—";
      detail.textContent=status==="pending_verification"?"Starts after payment confirmation":"No active plan";
      return;
    }
    const remaining=expiry.getTime()-Date.now();
    if(remaining<=0){
      label.textContent="Expired";
      detail.textContent=`Expired ${expiry.toLocaleDateString()}`;
      $("plan-status").textContent="Expired";
      $("plan-status").className="status-chip status-expired";
      $("learning-status").textContent="Plan expired";
      return;
    }
    const days=Math.floor(remaining/86400000);
    const hours=Math.floor((remaining%86400000)/3600000);
    const minutes=Math.floor((remaining%3600000)/60000);
    const seconds=Math.floor((remaining%60000)/1000);
    label.textContent=`${days}d ${hours}h ${minutes}m ${seconds}s`;
    detail.textContent=`Expires ${expiry.toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}`;
  }
  tick();
  if(status==="active" && expiry && expiry.getTime()>Date.now()) countdownTimer=setInterval(tick,1000);
}
function renderProfile(user,data={}){profile=data;const username=safeText(data.username || user.displayName || (user.email||"member").split("@")[0],"Member");$("profile-username").textContent=username;$("profile-email").textContent=safeText(user.email,"Google account");$("detail-username").textContent=username;$("detail-email").textContent=safeText(user.email,"Google account");$("detail-google-name").textContent=safeText(user.displayName,"Not provided by Google");const memberSince=user.metadata?.creationTime?new Date(user.metadata.creationTime):null;$("detail-member-since").textContent=memberSince&&!Number.isNaN(memberSince.getTime())?memberSince.toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"}):"—";$("avatar-fallback").textContent=username.slice(0,1).toUpperCase();if(user.photoURL){$("profile-photo").src=user.photoURL;$("profile-photo").hidden=false;$("avatar-fallback").hidden=true}else{$("profile-photo").hidden=true;$("avatar-fallback").hidden=false}
const plan=data.currentPlan || data.planName || data.selectedPlan || "";
$("current-plan").textContent=plan || "No plan yet";
const hasPlan=Boolean(plan);
const expiry=data.expiresAt?.toDate?.() || (typeof data.expiresAt === "string" ? new Date(data.expiresAt) : null);
let effectiveStatus=data.planStatus || "inactive";
if(effectiveStatus==="active" && (!expiry || Number.isNaN(expiry.getTime()) || expiry.getTime()<=Date.now())) effectiveStatus="expired";
const statusLabels={active:"Active",pending_verification:"Awaiting payment verification",expired:"Expired",inactive:"No active plan"};
$("plan-status").textContent=statusLabels[effectiveStatus] || (hasPlan ? effectiveStatus.replaceAll("_"," ") : "Choose a course below");
$("plan-status").className="status-chip status-"+effectiveStatus;
$("learning-status").textContent=effectiveStatus==="active"?"Enrolled":effectiveStatus==="pending_verification"?"Awaiting verification":effectiveStatus==="expired"?"Plan expired":"Ready to begin";
updateCountdown(expiry,effectiveStatus);

}
async function loadProfile(user){try{const snap=await getDoc(doc(db,"users",user.uid));const data=snap.exists()?snap.data():{};renderProfile(user,data);if(!snap.exists()){await setDoc(doc(db,"users",user.uid),{uid:user.uid,email:user.email||"",displayName:user.displayName||"",createdAt:serverTimestamp(),updatedAt:serverTimestamp()},{merge:true})}}catch(e){console.error("Profile load failed",e);renderProfile(user,{});toast("Your profile loaded with limited details. Check your connection.")}}
if(!ready){$("profile-username").textContent="Firebase setup required";$("profile-email").textContent="Add your Firebase project settings in firebase-config.js.";$("current-plan").textContent="Not connected";$("plan-status").textContent="Authentication unavailable";$("learning-status").textContent="Setup required";document.querySelectorAll(".course-btn").forEach(b=>b.disabled=true);toast("Dashboard preview: connect Firebase to enable member features.")}
else{try{const app=getApps().length?getApps()[0]:initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);onAuthStateChanged(auth,async user=>{if(!user){window.location.replace("login.html");return}activeUser=user;await loadProfile(user)})}catch(e){console.error(e);toast("Could not initialise Firebase. Check firebase-config.js.")}}
async function openPayment(button){if(!activeUser){toast("Sign in with Google to enrol in a course.");return}selectedPlan={name:button.dataset.plan,price:Number(button.dataset.price),duration:button.dataset.duration};$("selected-plan").textContent=selectedPlan.name;$("selected-duration").textContent=selectedPlan.duration;$("selected-price").textContent=`₦${selectedPlan.price.toLocaleString("en-NG")}`;paymentDialog.showModal();try{await setDoc(doc(db,"users",activeUser.uid),{selectedPlan:selectedPlan.name,selectedPlanPrice:selectedPlan.price,selectedPlanDuration:selectedPlan.duration,planStatus:"pending_verification",planRequestedAt:serverTimestamp(),updatedAt:serverTimestamp()},{merge:true});renderProfile(activeUser,{...profile,selectedPlan:selectedPlan.name,planStatus:"pending_verification"})}catch(e){console.error("Could not save plan request",e);toast("Payment details are shown, but your plan request could not be saved. Contact support if needed.")}}
document.querySelectorAll(".course-btn").forEach(button=>button.addEventListener("click",()=>openPayment(button)));
$("copy-account").addEventListener("click",async()=>{try{await navigator.clipboard.writeText("8978765489");toast("Account number copied.")}catch{$("account-number").textContent="8978765489 — select to copy";toast("Copy unavailable. Press and hold the account number to copy it.")}});
$("close-payment").addEventListener("click",()=>paymentDialog.close());paymentDialog.addEventListener("click",e=>{if(e.target===paymentDialog)paymentDialog.close()});
// Course selection is stored as pending verification; only a human can activate it after confirming payment.
$("delete-account").addEventListener("click",()=>{ $("account-options").hidden=true;$("confirm-delete-check").checked=false;$("confirm-delete").disabled=true;$("delete-error").textContent="";deleteDialog.showModal() });
$("confirm-delete-check").addEventListener("change",e=>{$("confirm-delete").disabled=!e.target.checked});$("cancel-delete").addEventListener("click",()=>deleteDialog.close());deleteDialog.addEventListener("click",e=>{if(e.target===deleteDialog)deleteDialog.close()});
$("confirm-delete").addEventListener("click",async()=>{if(!activeUser||!$("confirm-delete-check").checked)return;const button=$("confirm-delete");button.disabled=true;button.textContent="Deleting account…";$("delete-error").textContent="";try{await reauthenticateWithPopup(activeUser,new GoogleAuthProvider());const userRef=doc(db,"users",activeUser.uid);const userSnap=await getDoc(userRef);const username=userSnap.exists()?userSnap.data().username:"";if(username){const nameRef=doc(db,"usernames",String(username).toLowerCase());const nameSnap=await getDoc(nameRef);if(nameSnap.exists()&&nameSnap.data().uid===activeUser.uid)await deleteDoc(nameRef)}await deleteDoc(userRef);await deleteUser(activeUser);window.location.replace("signup.html")}catch(e){console.error("Account deletion failed",e);$("delete-error").textContent=e.code==="auth/requires-recent-login"?"For security, sign in again with Google, then repeat account deletion.":"Deletion could not be completed. Check your connection and Firebase permissions, then try again.";button.disabled=false;button.textContent="Delete my account permanently"}});
$("year").textContent=new Date().getFullYear();
