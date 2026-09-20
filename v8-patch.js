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
    "CBC",
    "BC",
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
    if (!form || q("v8VisitExtras")) return;
    const marker = q("vAdvice")?.parentElement;
    const wrap = document.createElement("div");
    wrap.id = "v8VisitExtras";
    wrap.innerHTML = investigationBlock("v") + followupBlock("v");
    (marker || form.querySelector(".card")).insertBefore(wrap, marker || null);
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
    if (typeof showPage === "function") showPage("visitForm");
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
    const phones = [pr.phone1, pr.phone2].filter(Boolean).join(" , ");
    const meds = v.medicines || [];
    const inv = v.investigations || [];

    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      if(typeof toast==="function") toast("Browser popup blocked. Allow popups.");
      return;
    }

    w.document.write(`<!doctype html><html><head><meta charset="utf-8">
      <title>Prescription - ${esc8(p.name)}</title>
      <style>
        body{margin:0;padding:28px;background:#fff;color:#172033;font-family:Arial,sans-serif}
        .wrap{max-width:780px;margin:auto}
        .head{border-bottom:3px solid #2563eb;padding-bottom:14px}
        .clinic{font-size:27px;font-weight:800;color:#2563eb}
        .doctor{font-size:18px;font-weight:700;margin-top:4px}
        .meta{font-size:12px;color:#4b5563;margin-top:5px}
        .patient{margin-top:18px;border:1px solid #dbe4f0;border-radius:10px;padding:12px}
        .title{font-size:20px;font-weight:800;margin:18px 0 8px}
        table{width:100%;border-collapse:collapse}
        th,td{border-bottom:1px solid #e5e7eb;padding:9px;text-align:left;font-size:13px}
        .box{border:1px solid #dbe4f0;border-radius:10px;padding:12px}
        .rx{font-size:28px;font-weight:800;margin:18px 0 8px}
        .follow{border-left:4px solid #2563eb;padding:10px 12px;background:#f5f9ff}
        .sign{text-align:right;margin-top:55px}
        @media print{body{padding:0}.no-print{display:none}}
      </style></head><body>
      <div class="wrap">
        <div class="head">
          <div class="clinic">${esc8(pr.clinic || "")}</div>
          <div class="doctor">${esc8(pr.name || "")}</div>
          <div class="meta">${esc8(pr.degree || "")}</div>
          <div class="meta">${esc8(phones)}</div>
          <div class="meta">${esc8(pr.address || "")}</div>
        </div>

        <div class="patient">
          <b>Patient:</b> ${esc8(p.name)}
          &nbsp; <b>ID:</b> ${esc8(p.id)}
          &nbsp; <b>Age:</b> ${esc8(p.age || "-")}
          &nbsp; <b>Gender:</b> ${esc8(p.gender || "-")}
          <br><b>Phone:</b> ${esc8(p.phone)}
          &nbsp; <b>Date:</b> ${esc8(new Date(v.date).toLocaleString())}
        </div>

        <div class="title">Clinical Information</div>
        <div class="box">
          <b>BP:</b> ${esc8(v.bp || "-")} &nbsp;
          <b>Temp:</b> ${esc8(v.temperature || "-")} &nbsp;
          <b>Weight:</b> ${esc8(v.weight || "-")}<br>
          <b>Symptoms:</b> ${esc8(v.symptoms || "-")}<br>
          <b>Diagnosis:</b> ${esc8(v.diagnosis || "-")}
        </div>

        <div class="rx">℞ Prescription</div>
        ${meds.length ? `<table>
          <thead><tr><th>Medicine</th><th>Frequency</th><th>Food</th><th>Duration</th></tr></thead>
          <tbody>${meds.map(m=>`<tr>
            <td><b>${esc8(m.name || "")} ${esc8(m.strength || "")}</b><br>
              <small>${esc8(m.generic || "")} ${esc8(m.form || "")}</small></td>
            <td>${esc8(m.frequency || "-")}</td>
            <td>${esc8(m.food || "-")}</td>
            <td>${esc8(m.duration || "-")}</td>
          </tr>`).join("")}</tbody>
        </table>` : `<div class="box">No medicine prescribed.</div>`}

        ${inv.length ? `<div class="title">🧪 Investigations</div>
          <div class="box">${inv.map(x=>`• ${esc8(x)}`).join("<br>")}</div>` : ""}

        <div class="title">Advice</div>
        <div class="box">${esc8(v.advice || "-").replace(/\n/g,"<br>")}</div>

        ${(v.followupDays || v.followupDate) ? `<div class="title">🔁 Follow-up</div>
          <div class="follow">
            ${v.followupDays ? `After <b>${esc8(v.followupDays)} days</b>` : ""}
            ${v.followupDate ? ` — Date: <b>${esc8(v.followupDate)}</b>` : ""}
          </div>` : ""}

        <div class="sign">
          <b>${esc8(pr.name || "")}</b><br>
          ${esc8(pr.degree || "")}
        </div>

        <button class="no-print" onclick="window.print()">🖨 Print</button>
      </div>
      <script>setTimeout(()=>window.print(),250);<\/script>
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


/* =========================
   V9 FINAL FIX PACK
   - Explicit in-page investigation picker (no mobile keyboard/datalist dependency)
   - Investigations are stored on every new visit and printed
   - Prescription print layout follows the supplied reference sheet
   - Re-runs safely if the PWA restores an old DOM
   ========================= */
(function(){
  "use strict";
  const Q=id=>document.getElementById(id);
  const E=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const invs=["CBC","BC","FBS","RBS","HbA1c","Serum Creatinine","Blood Urea","Lipid Profile","LFT","Urine R/E","Urine C/S","TSH","FT4","CRP","ESR","Electrolytes","ECG","Chest X-Ray","USG of Whole Abdomen","USG of KUB","Stool R/E"];

  function values(prefix){return [...document.querySelectorAll(`#${prefix}InvestigationSelected [data-investigation]`)].map(x=>x.dataset.investigation).filter(Boolean)}
  function add(prefix,val){
    val=String(val||"").trim(); if(!val)return;
    const box=Q(prefix+"InvestigationSelected"); if(!box)return;
    if(values(prefix).some(x=>x.toLowerCase()===val.toLowerCase()))return;
    const d=document.createElement("div"); d.className="v9-inv-chip"; d.dataset.investigation=val;
    d.innerHTML=`<span>✓ ${E(val)}</span><button type="button" class="v9-x">×</button>`;
    d.querySelector(".v9-x").onclick=()=>d.remove(); box.appendChild(d);
  }
  window.v9OpenInvestigation=function(prefix){
    Q("v9InvModal")?.remove();
    const modal=document.createElement("div"); modal.id="v9InvModal";
    modal.innerHTML=`<div class="v9-inv-dialog">
      <div class="v9-inv-head"><b>🧪 পরীক্ষা নির্বাচন করুন</b><button type="button" id="v9InvClose">✕</button></div>
      <input id="v9InvSearch" placeholder="পরীক্ষার নাম লিখে খুঁজুন...">
      <div id="v9InvList"></div>
      <div class="v9-custom"><input id="v9InvCustom" placeholder="নিজের পরীক্ষার নাম"><button type="button" id="v9InvCustomBtn">＋ যোগ করুন</button></div>
    </div>`;
    document.body.appendChild(modal);
    const list=Q("v9InvList"), search=Q("v9InvSearch");
    const render=()=>{const q=(search.value||"").toLowerCase().trim(); const selected=new Set(values(prefix).map(x=>x.toLowerCase()));
      const arr=invs.filter(x=>!q||x.toLowerCase().includes(q));
      list.innerHTML=arr.map(x=>`<button type="button" class="v9-inv-option ${selected.has(x.toLowerCase())?"selected":""}" data-v="${E(x)}">${selected.has(x.toLowerCase())?"✓":"＋"} ${E(x)}</button>`).join("")||`<div class="v9-empty">কোনো পরীক্ষা পাওয়া যায়নি</div>`;
    };
    list.onclick=e=>{const b=e.target.closest("[data-v]");if(!b)return;add(prefix,b.dataset.v);render();};
    Q("v9InvClose").onclick=()=>modal.remove();
    modal.onclick=e=>{if(e.target===modal)modal.remove()};
    search.oninput=render;
    Q("v9InvCustomBtn").onclick=()=>{const v=Q("v9InvCustom").value.trim();if(v){add(prefix,v);Q("v9InvCustom").value="";render();}};
    render(); setTimeout(()=>search.focus(),50);
  };

  function ensure(prefix, beforeId){
    if(Q(prefix+"InvestigationUI"))return;
    const before=Q(beforeId); if(!before)return;
    const wrap=document.createElement("div"); wrap.id=prefix+"InvestigationUI"; wrap.className="v9-investigation";
    wrap.innerHTML=`<div class="v9-invest-title"><b>🧪 Investigation / পরীক্ষা-নিরীক্ষা</b><button type="button" class="btn primary" id="${prefix}InvOpen">＋ পরীক্ষা নির্বাচন করুন</button></div>
      <div id="${prefix}InvestigationSelected" class="v9-inv-selected"><span class="v9-placeholder">কোনো পরীক্ষা নির্বাচন করা হয়নি</span></div>`;
    before.parentNode.insertBefore(wrap,before);
    Q(prefix+"InvOpen").onclick=()=>window.v9OpenInvestigation(prefix);
  }
  function clear(prefix){Q(prefix+"InvestigationSelected")&&(Q(prefix+"InvestigationSelected").innerHTML='<span class="v9-placeholder">কোনো পরীক্ষা নির্বাচন করা হয়নি</span>')}
  function get(prefix){return values(prefix)}
  function hidePlaceholder(prefix){const b=Q(prefix+"InvestigationSelected"); if(b && get(prefix).length) b.querySelector(".v9-placeholder")?.remove()}
  const oldAdd=window.v8AddInvestigation;
  // Keep old API working, but render through the new chip list when present.
  window.v8AddInvestigation=function(prefix){const input=Q(prefix+"InvestigationInput"); const v=input?.value?.trim(); if(v && Q(prefix+"InvestigationSelected")){add(prefix,v);input.value="";hidePlaceholder(prefix);return;} if(oldAdd)oldAdd(prefix);};

  function profile(){return typeof getProfile==="function"?getProfile():window.profile||{}}
  function printHTML(p,v){
    const pr=profile(), phones=[pr.phone1,pr.phone2].filter(Boolean).join(" , ");
    const meds=v.medicines||[], inv=get("v").length?get("v"):(v.investigations||[]);
    const cc=v.symptoms||"-";
    const oe=[v.bp&&`BP: ${E(v.bp)}`,v.temperature&&`Temp: ${E(v.temperature)}`,v.weight&&`Weight: ${E(v.weight)}`].filter(Boolean).join(" • ")||"-";
    return `<div class="rx9">
      <div class="rx9-top"><div><div class="rx9-doc">${E(pr.name||"")}</div><b>${E(pr.degree||"")}</b><div>${E(phones)}</div><div>${E(pr.address||"")}</div></div><div class="rx9-clinic">${E(pr.clinic||"Mariyam Shebaloy")}<div>Date: ${E(new Date(v.date).toLocaleDateString())}</div></div></div>
      <div class="rx9-patient-title">PATIENT INFORMATION</div><div class="rx9-patient"><div><span>নাম</span><b>${E(p.name)}</b></div><div><span>বয়স</span><b>${E(p.age||"-")}</b></div><div><span>লিঙ্গ</span><b>${E(p.gender||"-")}</b></div><div><span>মোবাইল</span><b>${E(p.phone||"-")}</b></div><div><span>PATIENT ID</span><b>${E(p.id)}</b></div></div>
      <div class="rx9-body"><div class="rx9-side">
        <div class="rx9-box"><h4>CC — Chief Complaints</h4><div>${E(cc).replace(/\n/g,"<br>")}</div></div>
        <div class="rx9-box"><h4>O/E — On Examination</h4><div class="rx9-vitals"><span>BP<br><b>${E(v.bp||"-")}</b></span><span>Temp.<br><b>${E(v.temperature||"-")}</b></span><span>Weight<br><b>${E(v.weight||"-")}</b></span><span>Gender<br><b>${E(p.gender||"-")}</b></span></div></div>
        <div class="rx9-box"><h4>Diagnosis</h4><div>${E(v.diagnosis||"-")}</div></div>
        <div class="rx9-box"><h4>Investigation</h4><div>${inv.length?inv.map(x=>`<div>• ${E(x)}</div>`).join(""):"-"}</div></div>
        <div class="rx9-box"><h4>Advice</h4><div>${E(v.advice||"-").replace(/\n/g,"<br>")}</div></div>
        <div class="rx9-box"><h4>Follow-up</h4><div>${E(v.followupDate|| (v.followupDays?`${v.followupDays} days`:"-"))}</div></div>
      </div><div class="rx9-main"><div class="rx9-rx">℞</div><div class="rx9-sub">PRESCRIPTION / MEDICINES</div>
        ${meds.length?`<table><thead><tr><th>#</th><th>Medicine</th><th>Frequency</th><th>Food</th><th>Duration</th></tr></thead><tbody>${meds.map((m,i)=>`<tr><td>${i+1}</td><td><b>${E(m.name||"")} ${E(m.strength||"")}</b><br><small>${E(m.generic||"")} ${E(m.form||"")}</small></td><td>${E(m.frequency||"-")}</td><td>${E(m.food||"-")}</td><td>${E(m.duration||"-")}</td></tr>`).join("")}</tbody></table>`:`<div class="rx9-empty">কোনো ওষুধ দেওয়া হয়নি।</div>`}
        <div class="rx9-sign">${E(pr.name||"")}<br>${E(pr.degree||"")}</div></div></div>
      <div class="rx9-foot"><span>${E(p.name)} • Prescription</span><span>Patient ID: ${E(p.id)}</span></div>
    </div>`;
  }
  window.printPrescription=function(pid,vid){
    const p=(patients||[]).find(x=>x.id===pid); if(!p)return; const v=(p.visits||[]).find(x=>x.id===vid);if(!v)return;
    // For saved visits, use the saved data. The live v-picker is only relevant while editing.
    const data=Object.assign({},v,{investigations:Array.isArray(v.investigations)?v.investigations:[]});
    const old=Q("rx9Overlay");old?.remove(); const ov=document.createElement("div");ov.id="rx9Overlay";ov.innerHTML=printHTML(p,data)+`<button id="rx9Close" class="btn secondary">✕ Close</button>`;document.body.appendChild(ov);
    Q("rx9Close").onclick=()=>ov.remove(); setTimeout(()=>window.print(),150);
  };

  function hookSave(){
    const old=window.saveVisit;
    window.saveVisit=function(){
      const p=(patients||[]).find(x=>x.id===window.currentVisitPatientId);if(!p){return old&&old()}
      // Let existing V9/V8 save logic run, then force investigations from the visible picker into the saved visit.
      const before=p.visits?.length||0; old&&old();
      const saved=p.visits?.[p.visits.length-1]; if(saved && (p.visits.length>before)) {saved.investigations=get("v"); save(KEY_PATIENTS,patients);}
    };
  }
  function hookStart(){
    const old=window.startVisit;
    window.startVisit=function(id){old&&old(id);setTimeout(()=>{ensure("v","vAdvice");clear("v");},30)};
  }
  function hookPatient(){
    const old=window.saveNewPatient;
    window.saveNewPatient=function(){old&&old();setTimeout(()=>{ensure("p","pAdvice");},30)};
  }
  function mount(){
    // CSS
    if(!Q("v9Css")){const s=document.createElement("style");s.id="v9Css";s.textContent=`
      .v9-investigation{margin:16px 0;padding:14px;border:1px solid #dbe4f0;border-radius:14px;background:#fbfdff}.v9-invest-title{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}.v9-inv-selected{margin-top:10px;min-height:42px}.v9-placeholder{color:#9ca3af}.v9-inv-chip{display:flex;justify-content:space-between;align-items:center;padding:9px 11px;margin:6px 0;border:1px solid #bfe3db;border-radius:9px;background:#effaf7}.v9-x{border:0;background:transparent;font-size:20px;cursor:pointer}.v9-inv-dialog{width:min(620px,94vw);max-height:86vh;overflow:auto;background:#fff;border-radius:18px;padding:16px;box-shadow:0 20px 60px #0004}.v9-inv-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.v9-inv-head button{border:0;background:#eee;border-radius:9px;padding:8px 11px}.v9-inv-option{width:100%;text-align:left;padding:12px;margin:4px 0;border:1px solid #dbe4f0;border-radius:9px;background:#fff}.v9-inv-option.selected{background:#e8f7f3;border-color:#17a689}.v9-custom{display:flex;gap:8px;margin-top:12px}.v9-custom input{flex:1}.v9-empty{text-align:center;padding:18px;color:#777}#v9InvModal{position:fixed;inset:0;background:#0008;z-index:99999;display:flex;align-items:center;justify-content:center;padding:10px}
      #rx9Overlay{position:fixed;inset:0;z-index:99998;background:#fff;overflow:auto;padding:20px}.rx9{max-width:930px;margin:auto;font-family:Arial,"Noto Sans Bengali",sans-serif;color:#17333a}.rx9-top{border-top:8px solid #087f73;background:#eefafa;padding:18px 24px;display:flex;justify-content:space-between;gap:20px}.rx9-doc{font-size:27px;font-weight:800;color:#006e68}.rx9-clinic{text-align:right;font-size:18px;font-weight:800;color:#00786f}.rx9-patient-title{margin-top:14px;background:#dff5f3;border:1px solid #c4e5e2;padding:8px 12px;font-weight:800}.rx9-patient{display:grid;grid-template-columns:2fr .7fr .8fr 1.2fr 1fr;border:1px solid #d4e1e2}.rx9-patient>div{padding:9px;border-right:1px solid #d4e1e2}.rx9-patient span{display:block;font-size:11px;color:#65777b}.rx9-body{display:grid;grid-template-columns:235px 1fr;gap:18px;margin-top:14px}.rx9-side{border-right:2px solid #d5e4e5;padding-right:14px}.rx9-box{border:1px solid #cbdfe0;border-radius:10px;margin-bottom:10px;overflow:hidden}.rx9-box h4{margin:0;padding:8px 10px;background:#e9f8f7;color:#006e68;font-size:14px}.rx9-box>div{padding:10px;font-size:13px}.rx9-vitals{display:grid!important;grid-template-columns:1fr 1fr;gap:7px}.rx9-vitals span{border:1px solid #dce8e9;border-radius:7px;padding:7px}.rx9-main{padding:0 3px}.rx9-rx{font-size:46px;font-weight:800;color:#006e68}.rx9-sub{font-size:13px;color:#617276;margin-bottom:6px}.rx9-main table{width:100%;border-collapse:collapse}.rx9-main th{background:#007f73;color:#fff}.rx9-main th,.rx9-main td{border:1px solid #cbdfe0;padding:8px;text-align:left;font-size:12px;vertical-align:top}.rx9-sign{text-align:right;margin-top:65px;border-top:1px solid #567;padding-top:5px;font-weight:700;display:inline-block;float:right;min-width:190px}.rx9-foot{clear:both;border-top:1px solid #cbdfe0;margin-top:110px;padding-top:8px;font-size:11px;color:#708084;display:flex;justify-content:space-between}@media(max-width:700px){.rx9-patient{grid-template-columns:1fr 1fr}.rx9-body{grid-template-columns:1fr}.rx9-side{border-right:0;padding-right:0}.rx9-top{flex-direction:column}.rx9-clinic{text-align:left}.rx9-sign{margin-top:40px}}@media print{body>*:not(#rx9Overlay){display:none!important}#rx9Overlay{position:static!important;padding:0!important}#rx9Close{display:none!important}.rx9{max-width:none}.rx9-top{border-top-width:6px}.rx9-foot{margin-top:60px}}
    `;document.head.appendChild(s)}
    ensure("p","pAdvice"); ensure("v","vAdvice"); hookSave(); hookStart(); hookPatient();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(mount,50));else setTimeout(mount,50);
})();
