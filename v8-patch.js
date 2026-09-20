/*
 Mariyam Shebaloy V8 clinical workflow patch
 IMPORTANT:
 1) Keep your existing V7 index.html.
 2) Upload this file beside index.html.
 3) Add this line AFTER the existing main inline <script> in index.html:
    <script src="./v8-patch.js"></script>
 4) Do NOT replace your existing dashboard/auth/profile code.
*/

(function () {
  "use strict";

  const INVESTIGATION_SUGGESTIONS = [
    "CBC / Complete Blood Count",
    "FBS",
    "RBS",
    "HbA1c",
    "Serum Creatinine",
    "Blood Urea",
    "Lipid Profile",
    "LFT",
    "Urine R/E",
    "Urine C/S",
    "TSH",
    "FT4",
    "CRP",
    "ESR",
    "Electrolytes",
    "ECG",
    "Chest X-Ray",
    "USG of Whole Abdomen",
    "USG of KUB",
    "Stool R/E"
  ];

  function q(id) { return document.getElementById(id); }
  function esc8(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }
  function profile8() {
    return (typeof getProfile === "function")
      ? getProfile()
      : (window.profile || {});
  }

  function addCss() {
    if (q("v8PatchCss")) return;
    const s = document.createElement("style");
    s.id = "v8PatchCss";
    s.textContent = `
      .v8-section{margin-top:16px}
      .v8-invest-row{display:flex;gap:8px;align-items:center;margin:8px 0}
      .v8-invest-row input{flex:1}
      .v8-selected{margin-top:8px}
      .v8-chip{display:flex;justify-content:space-between;align-items:center;
        padding:9px 11px;border:1px solid #dbe4f0;border-radius:10px;
        margin:6px 0;background:#f8fbff}
      .v8-follow-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .v8-print-wrap{font-family:Arial,sans-serif;color:#172033;max-width:760px;margin:auto}
      .v8-print-head{border-bottom:3px solid #2563eb;padding-bottom:12px;margin-bottom:18px}
      .v8-print-clinic{font-size:25px;font-weight:800;color:#2563eb}
      .v8-print-doctor{font-size:18px;font-weight:700;margin-top:4px}
      .v8-print-meta{font-size:12px;color:#4b5563;margin-top:4px}
      .v8-print-title{font-size:20px;font-weight:800;margin:16px 0 8px}
      .v8-print-box{border:1px solid #d9e1ec;border-radius:10px;padding:12px;margin:10px 0}
      .v8-print-table{width:100%;border-collapse:collapse}
      .v8-print-table th,.v8-print-table td{border-bottom:1px solid #e5e7eb;padding:8px;text-align:left;font-size:13px}
      .v8-print-footer{margin-top:35px;text-align:right}
      @media(max-width:600px){.v8-follow-grid{grid-template-columns:1fr}}
      @media print{body{background:white!important}.v8-no-print{display:none!important}}
    `;
    document.head.appendChild(s);
  }

  function investigationBlock(prefix) {
    return `
      <div class="v8-section">
        <h3>🧪 Investigations / পরীক্ষা-নিরীক্ষা</h3>
        <div class="v8-invest-row">
          <input id="${prefix}InvestigationInput"
                 list="${prefix}InvestigationList"
                 placeholder="যেমন CBC, FBS, HbA1c, X-Ray">
          <button type="button" class="btn secondary"
                  onclick="v8AddInvestigation('${prefix}')">＋ Add</button>
        </div>
        <datalist id="${prefix}InvestigationList">
          ${INVESTIGATION_SUGGESTIONS.map(x=>`<option value="${esc8(x)}"></option>`).join("")}
        </datalist>
        <div id="${prefix}InvestigationSelected" class="v8-selected"></div>
      </div>
    `;
  }

  function followupBlock(prefix) {
    return `
      <div class="v8-section">
        <h3>🔁 Follow-up</h3>
        <div class="v8-follow-grid">
          <div>
            <label>কত দিন পর দেখাবেন?</label>
            <input id="${prefix}FollowupDays" type="number" min="0"
                   placeholder="যেমন 5">
          </div>
          <div>
            <label>Follow-up date</label>
            <input id="${prefix}FollowupDate" type="date">
          </div>
        </div>
      </div>
    `;
  }

  function medicineBlock(prefix) {
    return `
      <div class="v8-section">
        <div class="row">
          <h3>💊 Medicines</h3>
          <div>
            <button type="button" class="btn secondary"
              onclick="v8AddInitialMedicine('${prefix}')">＋ Database Medicine</button>
            <button type="button" class="btn secondary"
              onclick="v8AddInitialCustomMedicine('${prefix}')">＋ Custom Medicine</button>
          </div>
        </div>
        <div id="${prefix}Medicines"></div>
      </div>
    `;
  }

  function selectedInvestigationValues(prefix) {
    return [...document.querySelectorAll(`#${prefix}InvestigationSelected [data-investigation]`)]
      .map(x => x.getAttribute("data-investigation")).filter(Boolean);
  }

  window.v8AddInvestigation = function(prefix) {
    const input = q(prefix + "InvestigationInput");
    if (!input) return;
    const value = input.value.trim();
    if (!value) { if (typeof toast === "function") toast("Investigation-এর নাম দিন"); return; }
    const existing = selectedInvestigationValues(prefix);
    if (existing.some(x => x.toLowerCase() === value.toLowerCase())) {
      input.value = "";
      return;
    }
    const box = q(prefix + "InvestigationSelected");
    const row = document.createElement("div");
    row.className = "v8-chip";
    row.dataset.investigation = value;
    row.innerHTML = `<span>🧪 ${esc8(value)}</span>
      <button type="button" class="btn danger"
        onclick="this.parentElement.remove()">Remove</button>`;
    box.appendChild(row);
    input.value = "";
  };

  function medicineOptions8(selected) {
    const meds = medicines || [];
    return meds.map(m =>
      `<option value="${esc8(m.id)}" ${m.id === selected ? "selected" : ""}>
        ${esc8(m.name || "Unnamed")} ${esc8(m.strength || "")}
      </option>`).join("");
  }

  window.v8AddInitialMedicine = function(prefix, data = {}) {
    const box = q(prefix + "Medicines");
    if (!box) return;
    const row = document.createElement("div");
    row.className = "medicine-row";
    row.dataset.type = "database";
    row.innerHTML = `
      <div class="medicine-grid">
        <select class="v8-med-select">
          <option value="">Select medicine from database</option>
          ${medicineOptions8(data.medicineId || "")}
        </select>
        <input class="v8-med-frequency" placeholder="Frequency"
          value="${esc8(data.frequency || "")}">
        <select class="v8-prn-type">
          <option value="">প্রয়োজনের ধরন</option>
          <option value="prn">প্রয়োজন অনুযায়ী (PRN)</option>
          <option value="pain">ব্যথা থাকলে খাবেন</option>
          <option value="fever">জ্বর হলে খাবেন</option>
          <option value="custom">নিজের নির্দেশনা</option>
        </select>
        <input class="v8-prn-text" placeholder="প্রয়োজন হলে নির্দেশনা" value="${esc8(data.prnInstruction || "")}">
        <select class="v8-med-food">
          <option value="">Food</option>
          <option>Before food</option><option>After food</option>
          <option>With food</option><option>Any time</option>
        </select>
        <input class="v8-med-duration" placeholder="Duration"
          value="${esc8(data.duration || "")}">
      </div>
      <button type="button" class="btn danger" style="margin-top:8px"
        onclick="this.parentElement.remove()">Remove</button>`;
    box.appendChild(row);
    if (data.food) row.querySelector(".v8-med-food").value = data.food;
  };

  window.v8AddInitialCustomMedicine = function(prefix, data = {}) {
    const box = q(prefix + "Medicines");
    if (!box) return;
    const row = document.createElement("div");
    row.className = "medicine-row";
    row.dataset.type = "custom";
    row.innerHTML = `
      <div class="medicine-grid">
        <input class="v8-custom-name" placeholder="Custom Brand Name"
          value="${esc8(data.name || "")}">
        <input class="v8-custom-strength" placeholder="Strength"
          value="${esc8(data.strength || "")}">
        <input class="v8-custom-form" placeholder="Form"
          value="${esc8(data.form || "")}">
        <input class="v8-med-frequency" placeholder="Frequency"
          value="${esc8(data.frequency || "")}">
        <select class="v8-prn-type">
          <option value="">প্রয়োজনের ধরন</option>
          <option value="prn">প্রয়োজন অনুযায়ী (PRN)</option>
          <option value="pain">ব্যথা থাকলে খাবেন</option>
          <option value="fever">জ্বর হলে খাবেন</option>
          <option value="custom">নিজের নির্দেশনা</option>
        </select>
        <input class="v8-prn-text" placeholder="প্রয়োজন হলে নির্দেশনা" value="${esc8(data.prnInstruction || "")}">
      </div>
      <div class="medicine-grid" style="margin-top:8px">
        <select class="v8-med-food">
          <option value="">Food</option><option>Before food</option>
          <option>After food</option><option>With food</option><option>Any time</option>
        </select>
        <input class="v8-med-duration" placeholder="Duration"
          value="${esc8(data.duration || "")}">
      </div>
      <button type="button" class="btn danger" style="margin-top:8px"
        onclick="this.parentElement.remove()">Remove</button>`;
    box.appendChild(row);
    if (data.food) row.querySelector(".v8-med-food").value = data.food;
  };

  function collectInitialMeds(prefix) {
    return [...document.querySelectorAll(`#${prefix}Medicines .medicine-row`)]
      .map(row => {
        const prnType = row.querySelector(".v8-prn-type")?.value || "";
        let prnInstruction = row.querySelector(".v8-prn-text")?.value.trim() || "";
        if (!prnInstruction && prnType === "pain") prnInstruction = "ব্যথা থাকলে খাবেন";
        if (!prnInstruction && prnType === "fever") prnInstruction = "জ্বর হলে খাবেন";
        if (!prnInstruction && prnType === "prn") prnInstruction = "প্রয়োজন অনুযায়ী";
        const base = {
          frequency:row.querySelector(".v8-med-frequency")?.value.trim() || "",
          food:row.querySelector(".v8-med-food")?.value || "",
          duration:row.querySelector(".v8-med-duration")?.value.trim() || "",
          prnType, prnInstruction
        };
        if (row.dataset.type === "custom") {
          const name = row.querySelector(".v8-custom-name")?.value.trim();
          if (!name) return null;
          return {medicineId:"CUSTOM", custom:true, name, generic:"",
            strength:row.querySelector(".v8-custom-strength")?.value.trim() || "",
            form:row.querySelector(".v8-custom-form")?.value.trim() || "", ...base};
        }
        const id = row.querySelector(".v8-med-select")?.value;
        const m = (medicines || []).find(x => String(x.id) === String(id));
        if (!m) return null;
        return {medicineId:m.id, name:m.name, generic:m.generic || "",
          strength:m.strength || "", form:m.form || "", ...base};
      }).filter(Boolean);
  }

  function followupData(prefix) {
    const days = q(prefix + "FollowupDays")?.value.trim() || "";
    let date = q(prefix + "FollowupDate")?.value || "";
    if (days && !date) {
      const d = new Date();
      d.setHours(0,0,0,0);
      d.setDate(d.getDate() + Number(days));
      date = d.toISOString().slice(0,10);
      if (q(prefix + "FollowupDate")) q(prefix + "FollowupDate").value = date;
    }
    return { followupDays: days ? Number(days) : "", followupDate: date };
  }

  function mountPatientExtras() {
    const form = q("patientForm");
    if (!form || q("v8PatientExtras")) return;
    const card = form.querySelector(".card");
    const advice = q("pAdvice");
    const marker = advice?.parentElement;
    const wrap = document.createElement("div");
    wrap.id = "v8PatientExtras";
    wrap.innerHTML = medicineBlock("p") + investigationBlock("p") + followupBlock("p");
    (marker || card).insertAdjacentElement("beforebegin", wrap);
  }

  function mountVisitExtras() {
    const form = q("visitForm");
    if (!form) return;

    // Investigation is permanently present in New Visit. Keep a fallback
    // dynamic mount for older copies of index.html, but never create a
    // duplicate when the static block exists.
    if (!q("v8VisitInvestigationStatic")) {
      if (q("v8VisitExtras")) return;
      const marker = q("vAdvice")?.parentElement;
      const wrap = document.createElement("div");
      wrap.id = "v8VisitExtras";
      wrap.innerHTML = investigationBlock("v");
      (marker || form.querySelector(".card")).insertBefore(wrap, marker || null);
    }

    const inv = q("vInvestigationSelected");
    if (inv && !inv.dataset.v8Ready) inv.dataset.v8Ready = "1";
  }

  function clearV8(prefix) {
    const box = q(prefix + "Medicines");
    if (box) box.innerHTML = "";
    const inv = q(prefix + "InvestigationSelected");
    if (inv) inv.innerHTML = "";
    ["FollowupDays","FollowupDate"].forEach(s => {
      if (q(prefix+s)) q(prefix+s).value = "";
    });
  }

  // Override New Patient save so the initial prescription is not lost.
  window.saveNewPatient = function() {
    const name = q("pName")?.value.trim();
    const phone = q("pPhone")?.value.trim();
    if (!name || !phone) {
      if (typeof toast === "function") toast("নাম ও ফোন নম্বর দিন");
      return;
    }

    const firstVisit = {
      id: typeof uid === "function" ? uid("V-") : ("V-"+Date.now()),
      date: new Date().toISOString(),
      bp:q("pBP")?.value.trim() || "",
      temperature:q("pTemp")?.value.trim() || "",
      weight:q("pWeight")?.value.trim() || "",
      symptoms:q("pSymptoms")?.value.trim() || "",
      diagnosis:q("pDiagnosis")?.value.trim() || "",
      medicines:collectInitialMeds("p"),
      investigations:selectedInvestigationValues("p"),
      advice:q("pAdvice")?.value.trim() || "",
      ...followupData("p")
    };

    const patient = {
      id:q("pId")?.value || (typeof nextPatientId === "function" ? nextPatientId() : "P-"+Date.now()),
      name, phone,
      age:q("pAge")?.value || "",
      gender:q("pGender")?.value || "",
      address:q("pAddress")?.value.trim() || "",
      createdAt:new Date().toISOString(),
      visits:[]
    };

    const meaningful = firstVisit.bp || firstVisit.temperature ||
      firstVisit.weight || firstVisit.symptoms || firstVisit.diagnosis ||
      firstVisit.medicines.length || firstVisit.investigations.length ||
      firstVisit.advice || firstVisit.followupDays || firstVisit.followupDate;

    if (meaningful) patient.visits.push(firstVisit);

    patients.push(patient);
    save(KEY_PATIENTS, patients);

    window.lastSavedPrescription = {patientId:patient.id, visitId:firstVisit.id};

    if (typeof toast === "function") toast("Patient + first prescription saved");
    if (typeof resetPatientFormMode === "function") resetPatientFormMode();
    if (typeof openPatient === "function") openPatient(patient.id);
    if (typeof renderDashboardStats === "function") renderDashboardStats();
  };

  // Override New Visit initialization.
  window.startVisit = function(id) {
    const p = (patients || []).find(x => x.id === id);
    if (!p) return;
    currentVisitPatientId = id;

    if (q("visitPatientInfo")) {
      q("visitPatientInfo").innerHTML =
        `<div class="list-item"><b>${esc8(p.name)}</b>
        <span class="badge">${esc8(p.id)}</span>
        <div class="small">${esc8(p.phone)} • Age ${esc8(p.age||"-")}
        • ${esc8(p.gender||"-")}</div></div>`;
    }

    ["vBP","vTemp","vWeight","vSymptoms","vDiagnosis","vAdvice"]
      .forEach(id2 => { if(q(id2)) q(id2).value = ""; });

    const vm = q("visitMedicines");
    if (vm) vm.innerHTML = "";
    clearV8("v");
    if (typeof fillDiseaseList === "function") fillDiseaseList();
    const invBlock = q("v8VisitInvestigationStatic");
    if (invBlock) invBlock.style.display = "block";
    if (typeof showPage === "function") showPage("visitForm");
    // Re-run the picker installer after New Visit is opened so the button is
    // always available even if the page was reached from a dynamically
    // rendered patient card.
    setTimeout(() => { try { hardenInvestigationPicker8(); } catch(e) { console.warn(e); } }, 0);
  };

  // Override Save Visit: save only, never auto-print.
  window.saveVisit = function() {
    const p = (patients || []).find(x => x.id === currentVisitPatientId);
    if (!p) return;

    const medicines = typeof collectVisitMedicines === "function"
      ? collectVisitMedicines() : [];

    const fd = followupData("v");
    const visit = {
      id: typeof uid === "function" ? uid("V-") : ("V-"+Date.now()),
      date:new Date().toISOString(),
      bp:q("vBP")?.value.trim() || "",
      temperature:q("vTemp")?.value.trim() || "",
      weight:q("vWeight")?.value.trim() || "",
      symptoms:q("vSymptoms")?.value.trim() || "",
      diagnosis:q("vDiagnosis")?.value.trim() || "",
      medicines,
      investigations:selectedInvestigationValues("v"),
      advice:q("vAdvice")?.value.trim() || "",
      ...fd
    };

    p.visits = Array.isArray(p.visits) ? p.visits : [];
    p.visits.push(visit);
    save(KEY_PATIENTS, patients);

    window.lastSavedPrescription = {patientId:p.id, visitId:visit.id};

    if (typeof toast === "function")
      toast("Visit saved — এখন চাইলে Print করুন");

    if (typeof renderDashboardStats === "function") renderDashboardStats();
    if (typeof openPatient === "function") openPatient(p.id);
  };

  window.printPrescription = function(patientId, visitId) {
    const p = (patients || []).find(x => x.id === patientId);
    if (!p) { if(typeof toast==="function") toast("Patient পাওয়া যায়নি"); return; }
    const v = (p.visits || []).find(x => x.id === visitId);
    if (!v) { if(typeof toast==="function") toast("Prescription পাওয়া যায়নি"); return; }

    const pr = profile8();
    const phones = [pr.phone1, pr.phone2].filter(Boolean).join(", ");
    const meds = Array.isArray(v.medicines) ? v.medicines : [];
    const inv = Array.isArray(v.investigations) ? v.investigations : [];

    const dateObj = new Date(v.date || Date.now());
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const printDate = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    const display = value => value === undefined || value === null || String(value).trim()==="" ? "-" : String(value);
    const nl = value => esc8(display(value)).replace(/\r?\n/g,"<br>");
    const medicineName = m => `${display(m.name)}${m.strength ? " " + display(m.strength) : ""}`.trim();
    const medicineSub = m => {
      const parts = [m.generic, m.form].filter(x => x && String(x).trim());
      return parts.length ? parts.map(esc8).join("<br>") : "";
    };

    const w = window.open("", "_blank", "noopener,noreferrer,width=1100,height=1400");
    if (!w) {
      if(typeof toast==="function") toast("Browser popup blocked. Allow popups.");
      return;
    }

    w.document.write(`<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc8(p.name)} - Prescription</title>
<style>
  @page{size:A4 portrait;margin:0}
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#fff}
  body{
    font-family:Arial,"Noto Sans Bengali","Noto Sans",sans-serif;
    color:#314445;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact
  }

  /* A4 prescription sheet — matched to the supplied reference */
  .sheet{
    width:210mm;
    min-height:297mm;
    margin:0 auto;
    padding:6.4mm 13.3mm 9mm;
    position:relative;
    background:#fff
  }

  .topbar{
    height:2.8mm;
    background:#11746f
  }

  .header{
    height:29.2mm;
    background:#f1fdfb;
    border:1px solid #d7e9e7;
    border-top:0;
    padding:4.4mm 4.8mm 3.3mm;
    position:relative
  }

  .doctorName{
    font-size:25px;
    line-height:1.05;
    font-weight:800;
    letter-spacing:.1px;
    color:#075b59;
    margin:0 0 1.7mm
  }

  .degree{
    font-size:13px;
    font-weight:700;
    color:#3d5556;
    margin-bottom:1.25mm
  }

  .contact,.address{
    font-size:11px;
    color:#58696a;
    line-height:1.42
  }

  .clinic{
    position:absolute;
    right:4.8mm;
    top:4.3mm;
    text-align:right;
    font-size:18px;
    font-weight:800;
    color:#0e766d
  }

  .date{
    position:absolute;
    right:4.8mm;
    top:11.4mm;
    font-size:11px;
    color:#687878
  }

  .headerRule{
    position:absolute;
    left:4.8mm;
    right:4.8mm;
    bottom:3mm;
    height:1px;
    background:#cbdedd
  }

  .patientBox{
    margin:3.1mm 4mm 0;
    border:1px solid #cfe3e1;
    border-radius:3.1mm;
    overflow:hidden
  }

  .patientTitle{
    height:6.8mm;
    background:#eaf9f8;
    border-bottom:1px solid #cfe3e1;
    padding:1.55mm 2.7mm;
    font-size:12px;
    font-weight:800;
    color:#0a6663
  }

  .patientGrid{
    display:grid;
    grid-template-columns:1.75fr .55fr .6fr 1fr .95fr;
    min-height:12.8mm
  }

  .patientCell{
    padding:2.05mm 2.3mm;
    border-right:1px solid #d7e6e5
  }

  .patientCell:last-child{border-right:0}

  .pLabel{
    font-size:9px;
    color:#6c7c7d;
    margin-bottom:1.05mm
  }

  .pValue{
    font-size:12px;
    font-weight:700;
    color:#334445;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis
  }

  .content{
    display:grid;
    grid-template-columns:47mm 1fr;
    column-gap:4mm;
    margin:2.9mm 4mm 0
  }

  .sidebar{
    border-right:1px solid #d3e1df;
    padding-right:3mm;
    min-height:187mm
  }

  .main{padding-left:0}

  .sideCard{
    border:1px solid #cfe3e1;
    border-radius:3mm;
    overflow:hidden;
    margin-bottom:2.9mm;
    background:#fff
  }

  .sideHead{
    background:#eaf9f8;
    border-bottom:1px solid #cfe3e1;
    padding:2mm 2.6mm;
    font-size:12px;
    font-weight:800;
    color:#0a6663
  }

  .sideBody{
    padding:2.9mm;
    font-size:11px;
    line-height:1.5;
    color:#35494a;
    min-height:12.5mm
  }

  .oeBody{min-height:38mm}

  .vitals{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:2.4mm;
    margin-top:1.9mm
  }

  .vital{
    border:1px solid #dce8e7;
    border-radius:2.4mm;
    padding:2.1mm;
    background:#fff
  }

  .vital b{
    display:block;
    font-size:10px;
    color:#14706c;
    margin-bottom:.9mm
  }

  .vital span{font-size:11px;color:#344b4c}

  .rxMark{
    font-family:Georgia,"Times New Roman",serif;
    font-size:38px;
    line-height:1;
    color:#087e77;
    font-weight:700;
    margin:0 0 1mm 0
  }

  .rxLabel{
    font-size:12px;
    color:#6b7778;
    letter-spacing:.15px;
    margin-bottom:2mm
  }

  .medTable{
    width:100%;
    border-collapse:collapse;
    table-layout:fixed;
    border:1px solid #cbdcda
  }

  .medTable th{
    background:#0e766d;
    color:#fff;
    font-size:10px;
    font-weight:800;
    text-align:left;
    padding:2.05mm 1.9mm;
    border-right:1px solid rgba(255,255,255,.28)
  }

  .medTable th:last-child{border-right:0}

  .medTable td{
    font-size:11px;
    color:#354849;
    padding:2.25mm 1.9mm;
    vertical-align:top;
    border-top:1px solid #d9e5e4;
    border-right:1px solid #d9e5e4;
    line-height:1.35
  }

  .medTable td:last-child{border-right:0}

  .medTable .num{width:6%;text-align:center}
  .medTable .medicine{width:53%}
  .medTable .freq{width:13%}
  .medTable .food{width:16%}
  .medTable .duration{width:16%}

  .medName{
    font-size:12px;
    font-weight:700;
    color:#253d3e
  }

  .medGeneric{
    font-size:10px;
    color:#637374;
    margin-top:1mm
  }

  .rxSign{
    margin-top:8.8mm;
    text-align:right;
    padding-right:1mm
  }

  .signLine{
    width:40mm;
    border-top:1px solid #526667;
    margin-left:auto;
    padding-top:1.45mm;
    font-size:11px;
    font-weight:700;
    color:#4b5b5c
  }

  .signDegree{
    font-size:10px;
    color:#596a6b;
    margin-top:.65mm
  }

  .footer{
    position:absolute;
    left:13.3mm;
    right:13.3mm;
    bottom:6mm;
    border-top:1px solid #cfe1df;
    padding-top:2mm;
    font-size:9px;
    color:#6a7b7b;
    display:flex;
    justify-content:space-between
  }

  .footer b{color:#16716d}

  .printBtn{
    position:fixed;
    right:18px;
    bottom:18px;
    border:0;
    border-radius:8px;
    background:#087e77;
    color:#fff;
    padding:11px 15px;
    font-weight:700;
    cursor:pointer;
    box-shadow:0 2px 8px #0002
  }

  @media screen{
    .sheet{box-shadow:0 0 18px #00000012;margin:18px auto}
    .printBtn{display:block}
  }

  @media print{
    .sheet{box-shadow:none;margin:0}
    .printBtn{display:none!important}
  }</style>
</head>
<body>
<div class="sheet">
  <div class="topbar"></div>
  <div class="header">
    <div class="doctorName">${esc8(pr.name || "")}</div>
    <div class="degree">${esc8(pr.degree || "")}</div>
    <div class="contact">${esc8(phones)}</div>
    <div class="address">${esc8(pr.address || "")}</div>
    <div class="clinic">${esc8(pr.clinic || "")}</div>
    <div class="date">Date: ${esc8(printDate)}</div>
    <div class="headerRule"></div>
  </div>

  <div class="patientBox">
    <div class="patientTitle">PATIENT INFORMATION</div>
    <div class="patientGrid">
      <div class="patientCell"><div class="pLabel">নাম</div><div class="pValue">${esc8(display(p.name))}</div></div>
      <div class="patientCell"><div class="pLabel">বয়স</div><div class="pValue">${esc8(display(p.age))}</div></div>
      <div class="patientCell"><div class="pLabel">লিঙ্গ</div><div class="pValue">${esc8(display(p.gender))}</div></div>
      <div class="patientCell"><div class="pLabel">মোবাইল</div><div class="pValue">${esc8(display(p.phone))}</div></div>
      <div class="patientCell"><div class="pLabel">PATIENT ID</div><div class="pValue">${esc8(display(p.id))}</div></div>
    </div>
  </div>

  <div class="content">
    <aside class="sidebar">
      <div class="sideCard"><div class="sideHead">CC – Chief Complaints</div><div class="sideBody">${nl(v.symptoms)}</div></div>
      <div class="sideCard"><div class="sideHead">O/E – On Examination</div><div class="sideBody oeBody">
        <div class="vitals">
          <div class="vital"><b>BP</b><span>${esc8(display(v.bp))}</span></div>
          <div class="vital"><b>Temp.</b><span>${esc8(display(v.temperature))}</span></div>
          <div class="vital"><b>Weight</b><span>${esc8(display(v.weight))}</span></div>
          <div class="vital"><b>Gender</b><span>${esc8(display(p.gender))}</span></div>
        </div>
      </div></div>
      <div class="sideCard"><div class="sideHead">Diagnosis</div><div class="sideBody">${nl(v.diagnosis)}</div></div>
      <div class="sideCard"><div class="sideHead">Investigation</div><div class="sideBody">${inv.length ? inv.map(x=>`• ${esc8(x)}`).join("<br>") : "-"}</div></div>
      <div class="sideCard"><div class="sideHead">Advice</div><div class="sideBody">${nl(v.advice)}</div></div>
      <div class="sideCard"><div class="sideHead">Follow-up</div><div class="sideBody">${(v.followupDays || v.followupDate) ? `${v.followupDays ? `After ${esc8(v.followupDays)} days` : ""}${v.followupDate ? `${v.followupDays ? " — " : ""}Date: ${esc8(v.followupDate)}` : ""}` : "-"}</div></div>
    </aside>

    <main class="main">
      <div class="rxMark">℞</div>
      <div class="rxLabel">PRESCRIPTION / MEDICINES</div>
      <table class="medTable">
        <thead><tr><th class="num">#</th><th class="medicine">Medicine</th><th class="freq">Frequency</th><th class="food">Food</th><th class="duration">Duration</th></tr></thead>
        <tbody>
          ${meds.length ? meds.map((m,i)=>`<tr>
            <td class="num">${i+1}</td>
            <td class="medicine"><div class="medName">${esc8(medicineName(m))}</div>${medicineSub(m) ? `<div class="medGeneric">${medicineSub(m)}</div>` : ""}${m.prnInstruction ? `<div class="medGeneric">(${esc8(m.prnInstruction)})</div>` : ""}</td>
            <td class="freq">${esc8(display(m.frequency))}</td>
            <td class="food">${esc8(display(m.food))}</td>
            <td class="duration">${esc8(display(m.duration))}</td>
          </tr>`).join("") : `<tr><td class="num">1</td><td class="medicine">-</td><td class="freq">-</td><td class="food">-</td><td class="duration">-</td></tr>`}
        </tbody>
      </table>
      <div class="rxSign">
        <div class="signLine">${esc8(pr.name || "")}</div>
        <div class="signDegree">${esc8(pr.degree || "")}</div>
      </div>
    </main>
  </div>

  <div class="footer"><span><b>${esc8(pr.clinic || "")}</b> · Prescription</span><span>Patient ID: ${esc8(display(p.id))}</span></div>
</div>
<button class="printBtn" onclick="window.print()">🖨 Print</button>
<script>setTimeout(()=>window.print(),350);<\/script>
</body></html>`);
    w.document.close();
  };

  window.v8PrintLast = function() {
    const x = window.lastSavedPrescription;
    if (!x) {
      if(typeof toast==="function") toast("আগে একটি prescription save করুন");
      return;
    }
    window.printPrescription(x.patientId, x.visitId);
  };

  function patchVisitButtons() {
    const form = q("visitForm");
    if (!form || q("v8PrintLastBtn")) return;
    const card = form.querySelector(".card");
    const btn = document.createElement("button");
    btn.id = "v8PrintLastBtn";
    btn.type = "button";
    btn.className = "btn secondary";
    btn.style.cssText = "margin-top:10px;width:100%";
    btn.textContent = "🖨 Print Saved Prescription";
    btn.onclick = v8PrintLast;
    card.appendChild(btn);
  }

  function patchPatientReset() {
    const old = window.clearPatientForm;
    window.clearPatientForm = function() {
      if (typeof old === "function") old();
      clearV8("p");
    };
  }

  function renderPrescriptionsV8() {
    const box = q("prescriptionList");
    if (!box) return;
    const all = [];
    (patients || []).forEach(p =>
      (p.visits || []).forEach(v => all.push({p,v}))
    );
    all.sort((a,b)=>new Date(b.v.date)-new Date(a.v.date));
    if (!all.length) {
      box.innerHTML = `<div class="empty">No prescriptions yet.</div>`;
      return;
    }
    box.innerHTML = all.map(x => `
      <div class="list-item">
        <div class="row">
          <div><b>${esc8(x.p.name)}</b> <span class="badge">${esc8(x.p.id)}</span>
          <div class="small">${esc8(new Date(x.v.date).toLocaleString())}</div></div>
          <button class="btn secondary"
            onclick="printPrescription('${esc8(x.p.id)}','${esc8(x.v.id)}')">🖨 Print</button>
        </div>
        <p><b>Diagnosis:</b> ${esc8(x.v.diagnosis || "-")}</p>
        <p><b>Medicine:</b> ${esc8((x.v.medicines||[]).length)}</p>
        <p><b>Investigation:</b> ${esc8((x.v.investigations||[]).length)}</p>
        <p><b>Follow-up:</b> ${esc8(x.v.followupDate || (x.v.followupDays ? x.v.followupDays+" days" : "-"))}</p>
      </div>`).join("");
  }
  window.renderPrescriptions = renderPrescriptionsV8;


  // =========================
  // V8.1 FIX PACK
  // 1) Use the real global lexical `patients` / `medicines` arrays so saves
  //    update the same arrays used by the original app + cloud sync.
  // 2) Bengali food labels.
  // 3) Investigation picker opens as an in-app modal instead of relying on
  //    mobile datalist UI above the keyboard.
  // 4) Printing happens in the current app window so Android/PWA popup
  //    blocking cannot prevent printing.
  // =========================
  const FOOD_LABELS = {
    "": "খাবারের নির্দেশনা",
    "Before food": "খাবারের আগে",
    "After food": "খাবারের পরে",
    "With food": "খাবারের সাথে",
    "Any time": "যেকোনো সময়"
  };

  function foodOptions8(selected="") {
    return Object.entries(FOOD_LABELS).map(([value,label]) =>
      `<option value="${esc8(value)}" ${value===selected?"selected":""}>${esc8(label)}</option>`
    ).join("");
  }

  function translateFood8(v){ return FOOD_LABELS[v] || v || "-"; }

  // Replace the original visit medicine row builders with Bengali food labels.
  window.addMedicineRow = function(data={}) {
    const row=document.createElement("div");
    row.className="medicine-row";
    row.dataset.type="database";
    row.innerHTML=`
      <div class="medicine-grid">
        <select class="med-select"><option value="">Medicine নির্বাচন করুন</option>${medicineOptions(data.medicineId||"")}</select>
        <input class="med-frequency" placeholder="Frequency" value="${esc8(data.frequency||"")}">
        <select class="v8-prn-type">
          <option value="">প্রয়োজনের ধরন</option><option value="prn">প্রয়োজন অনুযায়ী (PRN)</option>
          <option value="pain">ব্যথা থাকলে খাবেন</option><option value="fever">জ্বর হলে খাবেন</option><option value="no_pain">ব্যথা না থাকলে খাবেন না</option><option value="custom">নিজের নির্দেশনা</option>
        </select>
        <input class="v8-prn-text" placeholder="প্রয়োজন হলে নির্দেশনা" value="${esc8(data.prnInstruction||"")}">
        <select class="med-food">${foodOptions8(data.food||"")}</select>
        <input class="med-duration" placeholder="Duration" value="${esc8(data.duration||"")}">
      </div>
      <button type="button" class="btn danger" style="margin-top:8px" onclick="this.parentElement.remove()">Remove</button>`;
    q("visitMedicines")?.appendChild(row);
  };

  window.addCustomMedicineRow = function(data={}) {
    const row=document.createElement("div");
    row.className="medicine-row";
    row.dataset.type="custom";
    row.innerHTML=`
      <div class="medicine-grid">
        <input class="custom-med-name" placeholder="Custom Brand Name" value="${esc8(data.name||"")}">
        <input class="custom-med-strength" placeholder="Strength" value="${esc8(data.strength||"")}">
        <input class="custom-med-form" placeholder="Form" value="${esc8(data.form||"")}">
        <input class="med-frequency" placeholder="Frequency" value="${esc8(data.frequency||"")}">
        <select class="v8-prn-type">
          <option value="">প্রয়োজনের ধরন</option><option value="prn">প্রয়োজন অনুযায়ী (PRN)</option>
          <option value="pain">ব্যথা থাকলে খাবেন</option><option value="fever">জ্বর হলে খাবেন</option><option value="no_pain">ব্যথা না থাকলে খাবেন না</option><option value="custom">নিজের নির্দেশনা</option>
        </select>
        <input class="v8-prn-text" placeholder="প্রয়োজন হলে নির্দেশনা" value="${esc8(data.prnInstruction||"")}">
      </div>
      <div class="medicine-grid" style="margin-top:8px">
        <select class="med-food">${foodOptions8(data.food||"")}</select>
        <input class="med-duration" placeholder="Duration" value="${esc8(data.duration||"")}">
        <div></div><div></div>
      </div>
      <div class="small" style="margin-top:6px">Custom medicine শুধু এই visit-এ থাকবে; Medicine Database-এ automatically যোগ হবে না।</div>
      <button type="button" class="btn danger" style="margin-top:8px" onclick="this.parentElement.remove()">Remove</button>`;
    q("visitMedicines")?.appendChild(row);
  };

  // Initial/new-patient medicine rows also use Bengali food labels + PRN.
  function setPrnValue8(row, data={}){
    const type=row.querySelector('.v8-prn-type');
    const text=row.querySelector('.v8-prn-text');
    if(type) type.value=data.prnType||'';
    if(text) text.value=data.prnInstruction||'';
  }

  window.v8AddInitialMedicine = function(prefix, data={}) {
    const box=q(prefix+"Medicines"); if(!box)return;
    const row=document.createElement("div"); row.className="medicine-row"; row.dataset.type="database";
    row.innerHTML=`<div class="medicine-grid">
      <select class="v8-med-select"><option value="">Medicine নির্বাচন করুন</option>${medicineOptions8(data.medicineId||"")}</select>
      <input class="v8-med-frequency" placeholder="Frequency" value="${esc8(data.frequency||"")}">
      <select class="v8-prn-type">
        <option value="">প্রয়োজনের ধরন</option><option value="prn">প্রয়োজন অনুযায়ী (PRN)</option>
        <option value="pain">ব্যথা থাকলে খাবেন</option><option value="fever">জ্বর হলে খাবেন</option><option value="no_pain">ব্যথা না থাকলে খাবেন না</option><option value="custom">নিজের নির্দেশনা</option>
      </select>
      <input class="v8-prn-text" placeholder="প্রয়োজন হলে নির্দেশনা" value="${esc8(data.prnInstruction||"")}">
      <select class="v8-med-food">${foodOptions8(data.food||"")}</select>
      <input class="v8-med-duration" placeholder="Duration" value="${esc8(data.duration||"")}">
    </div><button type="button" class="btn danger" style="margin-top:8px" onclick="this.parentElement.remove()">Remove</button>`;
    box.appendChild(row); setPrnValue8(row,data);
  };

  window.v8AddInitialCustomMedicine = function(prefix, data={}) {
    const box=q(prefix+"Medicines"); if(!box)return;
    const row=document.createElement("div"); row.className="medicine-row"; row.dataset.type="custom";
    row.innerHTML=`<div class="medicine-grid">
      <input class="v8-custom-name" placeholder="Custom Brand Name" value="${esc8(data.name||"")}">
      <input class="v8-custom-strength" placeholder="Strength" value="${esc8(data.strength||"")}">
      <input class="v8-custom-form" placeholder="Form" value="${esc8(data.form||"")}">
      <input class="v8-med-frequency" placeholder="Frequency" value="${esc8(data.frequency||"")}">
      <select class="v8-prn-type">
        <option value="">প্রয়োজনের ধরন</option><option value="prn">প্রয়োজন অনুযায়ী (PRN)</option>
        <option value="pain">ব্যথা থাকলে খাবেন</option><option value="fever">জ্বর হলে খাবেন</option><option value="no_pain">ব্যথা না থাকলে খাবেন না</option><option value="custom">নিজের নির্দেশনা</option>
      </select>
      <input class="v8-prn-text" placeholder="প্রয়োজন হলে নির্দেশনা" value="${esc8(data.prnInstruction||"")}">
    </div><div class="medicine-grid" style="margin-top:8px">
      <select class="v8-med-food">${foodOptions8(data.food||"")}</select>
      <input class="v8-med-duration" placeholder="Duration" value="${esc8(data.duration||"")}"><div></div><div></div>
    </div><button type="button" class="btn danger" style="margin-top:8px" onclick="this.parentElement.remove()">Remove</button>`;
    box.appendChild(row); setPrnValue8(row,data);
  };

  function installInvestigationPicker8(){
    ["p","v"].forEach(prefix=>{
      const input=q(prefix+"InvestigationInput");
      if(!input)return;
      input.removeAttribute("list");
      input.setAttribute("autocomplete","off");
      input.setAttribute("inputmode","none");
      input.readOnly=true;
      input.tabIndex=-1;
      input.style.display="none";
      const list=q(prefix+"InvestigationList");
      if(list) list.remove();
      let btn=q(prefix+"InvestigationPickerBtn");
      if(!btn){
        btn=document.createElement("button");
        btn.id=prefix+"InvestigationPickerBtn";
        btn.type="button";
        btn.className="btn secondary v8-investigation-open";
        btn.textContent="🧪 পরীক্ষা নির্বাচন করুন";
        input.insertAdjacentElement("afterend",btn);
      }
      btn.onclick=(e)=>{e.preventDefault();e.stopPropagation();openInvestigationModal8(prefix);};
      btn.onpointerdown=(e)=>{e.preventDefault();e.stopPropagation();};
    });
  }

  function hardenInvestigationPicker8(){
    installInvestigationPicker8();
    if(window.__v8InvObserver)return;
    window.__v8InvObserver=new MutationObserver(()=>installInvestigationPicker8());
    window.__v8InvObserver.observe(document.body,{childList:true,subtree:true});
    if(!window.__v8InvCapture){
      window.__v8InvCapture=true;
      document.addEventListener("focusin",function(e){
        const el=e.target.closest?.("#pInvestigationInput,#vInvestigationInput");
        if(!el)return;
        e.preventDefault(); el.blur();
        openInvestigationModal8(el.id[0]);
      },true);
      document.addEventListener("click",function(e){
        const el=e.target.closest?.("#pInvestigationInput,#vInvestigationInput");
        if(!el)return;
        e.preventDefault(); e.stopPropagation();
        openInvestigationModal8(el.id[0]);
      },true);
    }
  }

  window.openInvestigationModal8=function(prefix){
    const old=q("v8InvestigationModal"); if(old)old.remove();
    const modal=document.createElement("div"); modal.id="v8InvestigationModal";
    modal.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.48);z-index:10000;display:flex;align-items:center;justify-content:center;padding:12px;touch-action:none";
    modal.innerHTML=`<div style="background:#fff;width:100%;max-width:620px;max-height:82vh;border-radius:18px;padding:16px;overflow:auto;box-shadow:0 15px 50px #0005">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3 style="margin:0">🧪 পরীক্ষা নির্বাচন করুন</h3><button class="btn secondary" type="button" id="v8InvClose">✕</button></div>
      <p class="small">CBC, RBC, FBS ইত্যাদি নির্বাচন করুন। চাইলে নিজের পরীক্ষার নামও যোগ করতে পারবেন।</p>
      <input id="v8InvSearch" placeholder="পরীক্ষার নাম খুঁজুন..." style="margin-bottom:10px">
      <div id="v8InvChoices"></div>
      <hr><div style="display:flex;gap:8px"><input id="v8InvCustom" placeholder="নিজের পরীক্ষার নাম লিখুন"><button class="btn primary" type="button" id="v8InvAddCustom">＋ Add</button></div>
    </div>`;
    document.body.appendChild(modal);
    const selected=new Set(selectedInvestigationValues(prefix).map(x=>x.toLowerCase()));
    const choices=q("v8InvChoices"), search=q("v8InvSearch");
    function render(){
      const term=(search.value||"").trim().toLowerCase();
      const arr=INVESTIGATION_SUGGESTIONS.filter(x=>x.toLowerCase().includes(term));
      choices.innerHTML=arr.map(x=>`<button type="button" class="btn ${selected.has(x.toLowerCase())?"success":"secondary"}" data-v8-inv="${esc8(x)}" style="width:100%;text-align:left;margin:5px 0">${selected.has(x.toLowerCase())?"✓ ":"＋ "}${esc8(x)}</button>`).join("") || `<div class="empty">কোনো পরীক্ষা পাওয়া যায়নি</div>`;
    }
    // Use direct selection without reopening/keyboard: add then refresh modal.
    choices.onclick=function(e){
      const btn=e.target.closest("[data-v8-inv]"); if(!btn)return;
      const val=btn.getAttribute("data-v8-inv");
      const hidden=q(prefix+"InvestigationInput"); hidden.value=val; window.v8AddInvestigation(prefix); openInvestigationModal8(prefix);
    };
    q("v8InvClose").onclick=()=>modal.remove();
    modal.addEventListener("click",e=>{if(e.target===modal)modal.remove();});
    search.oninput=render;
    q("v8InvAddCustom").onclick=()=>{const val=q("v8InvCustom").value.trim(); if(!val)return; const hidden=q(prefix+"InvestigationInput"); hidden.value=val; window.v8AddInvestigation(prefix); openInvestigationModal8(prefix);};
    render();
  };

  function renderPrintPage8(p,v){
    const pr=profile8();
    const phones=[pr.phone1,pr.phone2].filter(Boolean).join(" , ");
    const meds=v.medicines||[], inv=v.investigations||[];
    const cc=v.symptoms||"-";
    const oe=[v.bp?`BP: ${esc8(v.bp)}`:"",v.temperature?`Temp: ${esc8(v.temperature)}`:"",v.weight?`Weight: ${esc8(v.weight)}`:""].filter(Boolean).join(" • ")||"-";
    return `<div id="v8PrintPage" class="rx-sheet">
      <div class="rx-header">
        <div class="rx-doctor"><div class="rx-doctor-name">${esc8(pr.name||"")}</div><div>${esc8(pr.degree||"")}</div><div>${esc8(phones)}</div><div>${esc8(pr.address||"")}</div></div>
        <div class="rx-clinic"><div class="rx-clinic-name">${esc8(pr.clinic||"")}</div><div>Personal Clinic Management System</div></div>
      </div>
      <div class="rx-patient"><div><b>Patient:</b> ${esc8(p.name)} &nbsp; <b>ID:</b> ${esc8(p.id)}</div><div><b>Age:</b> ${esc8(p.age||"-")} &nbsp; <b>Gender:</b> ${esc8(p.gender||"-")} &nbsp; <b>Phone:</b> ${esc8(p.phone)}</div><div><b>Date:</b> ${esc8(new Date(v.date).toLocaleString())}</div></div>
      <div class="rx-columns"><div><div class="rx-label">CC — প্রধান অভিযোগ</div><div class="rx-box">${esc8(cc).replace(/\n/g,"<br>")}</div></div><div><div class="rx-label">OE — পরীক্ষা/পর্যবেক্ষণ</div><div class="rx-box">${esc8(oe)}<br>${v.diagnosis?`Diagnosis: ${esc8(v.diagnosis)}`:""}</div></div></div>
      <div class="rx-rx">℞</div>
      ${meds.length?`<table class="rx-table"><thead><tr><th>Medicine</th><th>Frequency</th><th>খাবার</th><th>প্রয়োজন হলে</th><th>Duration</th></tr></thead><tbody>${meds.map(m=>`<tr><td><b>${esc8(m.name||"")} ${esc8(m.strength||"")}</b><br><small>${esc8(m.generic||"")} ${esc8(m.form||"")}</small></td><td>${esc8(m.frequency||"-")}</td><td>${esc8(translateFood8(m.food))}</td><td>${esc8(m.prnInstruction||"-")}</td><td>${esc8(m.duration||"-")}</td></tr>`).join("")}</tbody></table>`:`<div class="rx-box">কোনো ওষুধ দেওয়া হয়নি।</div>`}
      ${inv.length?`<div class="rx-label">🧪 পরীক্ষা-নিরীক্ষা</div><div class="rx-box">${inv.map(x=>`• ${esc8(x)}`).join("<br>")}</div>`:""}
      <div class="rx-label">পরামর্শ</div><div class="rx-box">${esc8(v.advice||"-").replace(/\n/g,"<br>")}</div>
      ${(v.followupDays||v.followupDate)?`<div class="rx-follow">🔁 Follow-up: ${v.followupDays?`<b>${esc8(v.followupDays)} দিন পর</b>`:""}${v.followupDate?` — <b>${esc8(v.followupDate)}</b>`:""}</div>`:""}
      <div class="rx-sign">${esc8(pr.name||"")}<br>${esc8(pr.degree||"")}</div>
    </div>`;
  }

  window.printPrescription=function(patientId,visitId){
    const p=(patients||[]).find(x=>x.id===patientId); if(!p){if(typeof toast==="function") toast("Patient পাওয়া যায়নি");return;}
    const v=(p.visits||[]).find(x=>x.id===visitId); if(!v){if(typeof toast==="function") toast("Prescription পাওয়া যায়নি");return;}
    const old=q("v8PrintOverlay"); if(old)old.remove();
    const overlay=document.createElement("div"); overlay.id="v8PrintOverlay";
    overlay.innerHTML=renderPrintPage8(p,v);
    document.body.appendChild(overlay);
    const style=document.createElement("style"); style.id="v8PrintStyle"; style.textContent=`.rx-sheet{max-width:820px;margin:0 auto;padding:0 0 28px;background:#fff;color:#172033;font-family:Arial,'Noto Sans Bengali',sans-serif}.rx-header{display:grid;grid-template-columns:1fr 1fr;gap:20px;border-bottom:4px solid #2563eb;padding:18px 20px 14px;background:linear-gradient(135deg,#f7fbff,#fff)}.rx-doctor{font-size:12px;line-height:1.65}.rx-doctor-name,.rx-clinic-name{font-size:23px;font-weight:800;color:#174ea6}.rx-clinic{text-align:right;font-size:11px;color:#4b5563;line-height:1.6}.rx-patient{margin:14px 20px;border:1px solid #cfd9e8;border-radius:6px;padding:10px 12px;font-size:12px;background:#fbfdff}.rx-box{border:1px solid #dbe4f0;border-radius:5px;padding:10px;margin:7px 0;background:#fff;min-height:24px}.rx-columns{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:0 20px}.rx-columns>div{min-width:0}.rx-label{font-weight:800;margin-top:12px;color:#174ea6;border-bottom:2px solid #dbeafe;padding-bottom:4px}.rx-rx{font-size:38px;font-weight:900;margin:14px 20px 4px;color:#111827}.rx-table{width:calc(100% - 40px);margin:0 20px;border-collapse:collapse}.rx-table th{background:#eef5ff;color:#174ea6}.rx-table th,.rx-table td{border:1px solid #dbe4f0;padding:8px;text-align:left;font-size:12px;vertical-align:top}.rx-follow{margin:14px 20px;padding:10px 12px;border-left:4px solid #2563eb;background:#f5f9ff}.rx-sign{text-align:right;margin:55px 20px 0;font-weight:700}@media screen{#v8PrintOverlay{position:fixed;inset:0;z-index:20000;background:#fff;overflow:auto}#v8PrintOverlay:before{content:'🖨 Print Preview';display:block;background:#2563eb;color:#fff;padding:12px;font-weight:700;text-align:center}}@media print{body>*:not(#v8PrintOverlay){display:none!important}#v8PrintOverlay{display:block!important;position:static!important;background:#fff!important}.rx-sheet{max-width:none!important;padding:8mm!important}.rx-columns{grid-template-columns:1fr 1fr!important}}@media(max-width:600px){.rx-columns{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
    const close=document.createElement("button"); close.textContent="✕ Close"; close.className="btn secondary"; close.style.cssText="position:fixed;right:12px;top:12px;z-index:20001"; close.onclick=cleanup; overlay.appendChild(close);
    function cleanup(){q("v8PrintOverlay")?.remove();q("v8PrintStyle")?.remove();window.removeEventListener("afterprint",cleanup);}
    window.addEventListener("afterprint",cleanup,{once:true});
    setTimeout(()=>window.print(),250);
  };

  function prnDataFromRow(row){
    const type=row.querySelector(".v8-prn-type")?.value || "";
    let text=row.querySelector(".v8-prn-text")?.value.trim() || "";
    if(!text && type==="pain") text="ব্যথা থাকলে খাবেন";
    if(!text && type==="fever") text="জ্বর হলে খাবেন";
    if(!text && type==="no_pain") text="ব্যথা না থাকলে খাবেন না";
    if(!text && type==="prn") text="প্রয়োজন অনুযায়ী";
    return {prnType:type,prnInstruction:text};
  }

  window.collectVisitMedicines=function(){
    return [...document.querySelectorAll("#visitMedicines .medicine-row")].map(row=>{
      const prn=prnDataFromRow(row);
      const frequency=row.querySelector(".med-frequency")?.value.trim()||"";
      const food=row.querySelector(".med-food")?.value||"";
      const duration=row.querySelector(".med-duration")?.value.trim()||"";
      if(row.dataset.type==="custom"){
        const name=row.querySelector(".custom-med-name")?.value.trim(); if(!name)return null;
        return {medicineId:"CUSTOM",custom:true,name,strength:row.querySelector(".custom-med-strength")?.value.trim()||"",form:row.querySelector(".custom-med-form")?.value.trim()||"",generic:"",frequency,food,duration,...prn};
      }
      const id=row.querySelector(".med-select")?.value; const m=(medicines||[]).find(x=>String(x.id)===String(id)); if(!m)return null;
      return {medicineId:m.id,name:m.name,generic:m.generic||"",strength:m.strength||"",form:m.form||"",frequency,food,duration,...prn};
    }).filter(Boolean);
  };

  function installV81Fixes(){
    hardenInvestigationPicker8();

    if(!q("v8PrnStyle")){ const st=document.createElement("style"); st.id="v8PrnStyle"; st.textContent=".v8-prn-text{min-width:0}.v8-prn-type{min-width:190px}"; document.head.appendChild(st); }
    // Make any already-rendered V8 food selects Bengali without changing stored values.
    document.querySelectorAll(".med-food,.v8-med-food").forEach(sel=>{
      const value=sel.value; sel.innerHTML=foodOptions8(value); sel.value=value;
    });
  }

  function mount() {
    addCss();
    mountPatientExtras();
    mountVisitExtras();
    patchVisitButtons();
    patchPatientReset();
    installV81Fixes();

    // Existing V7 New Patient button opens patientForm; extras are now there.
    // Existing V7 Medicine database remains untouched.
    if (typeof renderDashboardStats === "function") renderDashboardStats();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
