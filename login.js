import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { firebaseConfig, firebaseConfigReady } from "./firebase-config.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const $ = id => document.getElementById(id);
const slider = $("puzzle-slider"), piece = $("puzzle-piece"), slot = $("target-slot"), board = $("puzzle-board");
const verify = $("verify-puzzle"), signIn = $("google-login"), message = $("captcha-message"), error = $("form-error");
let targetPercent = 68, verified = false, auth = null, db = null, firebaseReady = false;
function toast(text){const el=$("toast");el.textContent=text;el.classList.add("show");window.setTimeout(()=>el.classList.remove("show"),3500)}
function configReady(){return firebaseConfigReady}
if(configReady()) { try { const app=getApps().length?getApps()[0]:initializeApp(firebaseConfig); auth=getAuth(app);db=getFirestore(app);firebaseReady=true;onAuthStateChanged(auth,user=>{if(user){signIn.innerHTML='<span>Continue to your account</span><span class="button-arrow">→</span>';}}); } catch(e){console.error(e);error.textContent="Authentication setup failed. Check the Firebase configuration.";} }
function maxTravel(){return Math.max(0,board.clientWidth-piece.offsetWidth-10)}
function renderPiece(){piece.style.left=`${(Number(slider.value)/100)*maxTravel()}px`}
function resetPuzzle(){verified=false;signIn.disabled=true;verify.disabled=false;slider.disabled=false;slider.value="0";targetPercent=52+Math.floor(Math.random()*26);slot.style.left=`${targetPercent}%`;message.textContent="";message.classList.remove("error");$("slider-status").textContent="Not verified";renderPiece()}
slider.addEventListener("input",()=>{renderPiece();if(verified){verified=false;signIn.disabled=true;$("slider-status").textContent="Not verified";message.textContent="Move the piece, then verify again.";}});
window.addEventListener("resize",renderPiece);
$("refresh-puzzle").addEventListener("click",resetPuzzle);
verify.addEventListener("click",()=>{const current=(Number(slider.value)/100)*maxTravel();const target=(targetPercent/100)*board.clientWidth+slot.offsetWidth/2;const good=Math.abs((current+piece.offsetWidth/2)-target)<14;if(good){verified=true;signIn.disabled=false;slider.disabled=true;verify.disabled=true;$("slider-status").textContent="Verified ✓";message.classList.remove("error");message.textContent="Puzzle complete. Google sign-in is now enabled.";}else{message.classList.add("error");message.textContent="Not quite aligned. Try moving the piece closer to the outlined slot.";$("slider-status").textContent="Try again";}});
signIn.addEventListener("click",async()=>{error.textContent="";if(!verified){toast("Complete the puzzle check first.");return;}if(!firebaseReady){error.textContent="Google login is not connected yet. Add the Firebase configuration in firebase-config.js.";return;}signIn.disabled=true;signIn.querySelector("span:nth-child(2)").textContent="…";try{const result=await signInWithPopup(auth,new GoogleAuthProvider());if(result.user){const profileSnap=await getDoc(doc(db,"users",result.user.uid));const profile=profileSnap.exists()?profileSnap.data():{};window.location.href=profile.username?"dashboard.html":"signup.html";}}catch(e){console.error(e);error.textContent=e.code==="auth/popup-closed-by-user"?"Sign-in was cancelled. You can try again.":e.code==="auth/popup-blocked"?"Your browser blocked the sign-in window. Allow popups and try again.":"Google sign-in did not complete. Check your connection and try again.";signIn.querySelector("span:nth-child(2)").textContent="→";signIn.disabled=!verified;}});
$("year").textContent=new Date().getFullYear();resetPuzzle();
