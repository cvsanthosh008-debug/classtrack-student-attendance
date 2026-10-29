const seedStudents = [
  {id:1,name:"Rahul",roll:"101",department:"CSE",year:2},
  {id:2,name:"Priya",roll:"102",department:"CSE",year:2},
  {id:3,name:"Arjun",roll:"103",department:"CSE",year:2}
];
const seedAttendance = [
  {studentId:1,subject:"DBMS",date:"2026-10-12",status:"Present"},
  {studentId:2,subject:"DBMS",date:"2026-10-12",status:"Absent"},
  {studentId:3,subject:"DBMS",date:"2026-10-12",status:"Present"},
  {studentId:1,subject:"DBMS",date:"2026-10-13",status:"Present"},
  {studentId:2,subject:"DBMS",date:"2026-10-13",status:"Present"},
  {studentId:3,subject:"DBMS",date:"2026-10-13",status:"Absent"},
  {studentId:1,subject:"DBMS",date:"2026-10-14",status:"Absent"},
  {studentId:2,subject:"DBMS",date:"2026-10-14",status:"Present"},
  {studentId:3,subject:"DBMS",date:"2026-10-14",status:"Present"}
];
let students = load("classtrack_students", seedStudents);
let attendance = load("classtrack_attendance", seedAttendance);
let markDraft = {};
const $ = id => document.getElementById(id);
function load(key, fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback.map(x=>({...x}));}catch{return fallback.map(x=>({...x}));}}
function persist(){localStorage.setItem("classtrack_students",JSON.stringify(students));localStorage.setItem("classtrack_attendance",JSON.stringify(attendance));}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function initials(name){return name.trim().split(/\s+/).slice(0,2).map(s=>s[0]).join("").toUpperCase();}
function recordsFor(studentId, subject=null){return attendance.filter(a=>a.studentId===studentId&&(!subject||a.subject===subject));}
function metrics(studentId, subject=null){const r=recordsFor(studentId,subject),present=r.filter(a=>a.status==="Present").length;return {present,total:r.length,pct:r.length?present/r.length*100:0};}
function pctText(n){return n.toFixed(2)+"%";}
function badge(m){return m.total===0?'<span class="badge neutral">No records</span>':m.pct<75?'<span class="badge low">Below 75%</span>':'<span class="badge good">Satisfactory</span>';}
function avatar(s){return `<div class="student-cell"><div class="student-avatar">${escapeHtml(initials(s.name))}</div><div><div class="student-name">${escapeHtml(s.name)}</div><div class="subtext">${escapeHtml(s.department||"—")}</div></div></div>`;}
function attendanceCell(m){return m.total===0?'<span class="muted">No records</span>':`<div class="attendance-cell"><div class="attendance-value">${pctText(m.pct)}</div><div class="mini-progress"><span class="${m.pct<75?'low-bar':''}" style="width:${m.pct}%"></span></div></div>`;}
function render(){
  const totalMarks=attendance.length, present=attendance.filter(a=>a.status==="Present").length, absent=totalMarks-present;
  const avg=totalMarks?present/totalMarks*100:0;
  const low=students.filter(s=>{const m=metrics(s.id);return m.total>0&&m.pct<75}).length;
  $("statStudents").textContent=students.length;$("statRecords").textContent=totalMarks;$("statAverage").textContent=pctText(avg);$("statLow").textContent=low;
  $("presentTotal").textContent=present;$("presentPct").textContent=(totalMarks?present/totalMarks*100:0).toFixed(1)+"%";$("absentPct").textContent=(totalMarks?absent/totalMarks*100:0).toFixed(1)+"%";
  $("presentBar").style.width=(totalMarks?present/totalMarks*100:0)+"%";$("absentBar").style.width=(totalMarks?absent/totalMarks*100:0)+"%";
  $("reportLow").textContent=low;$("reportPresent").textContent=present;$("reportAbsent").textContent=absent;
  $("dashboardTable").innerHTML=students.map(s=>{const m=metrics(s.id);return `<tr><td>${avatar(s)}</td><td>${escapeHtml(s.roll)}</td><td>${attendanceCell(m)}</td><td>${badge(m)}</td></tr>`}).join("")||emptyRow(4,"No students added yet.");
  renderStudents();renderReports();renderMarkTable();
}
function emptyRow(n,msg){return `<tr><td colspan="${n}" class="empty-state">${msg}</td></tr>`;}
function renderStudents(){
  const q=($("studentSearch")?.value||"").toLowerCase();
  const list=students.filter(s=>(s.name+" "+s.roll+" "+s.department).toLowerCase().includes(q));
  $("studentsTable").innerHTML=list.map(s=>{const m=metrics(s.id);return `<tr><td>${avatar(s)}</td><td>${escapeHtml(s.roll)}</td><td>${escapeHtml(s.department||"—")}</td><td>${s.year}</td><td>${attendanceCell(m)}</td><td><button class="delete-btn" data-delete="${s.id}">Remove</button></td></tr>`}).join("")||emptyRow(6,"No matching students.");
}
function renderReports(){
  const q=($("reportSearch")?.value||"").toLowerCase();
  const list=students.filter(s=>(s.name+" "+s.roll).toLowerCase().includes(q));
  $("reportsTable").innerHTML=list.map(s=>{const m=metrics(s.id);return `<tr><td>${escapeHtml(s.roll)}</td><td>${avatar(s)}</td><td>${m.present}</td><td>${m.total}</td><td>${attendanceCell(m)}</td><td>${badge(m)}</td></tr>`}).join("")||emptyRow(6,"No matching students.");
}
function renderMarkTable(){
  const date=$("attendanceDate").value, subject=$("subjectSelect").value;
  $("markTable").innerHTML=students.map(s=>{
    const existing=attendance.find(a=>a.studentId===s.id&&a.date===date&&a.subject===subject);
    const status=markDraft[s.id]||existing?.status||"Present";
    return `<tr><td>${avatar(s)}</td><td>${escapeHtml(s.roll)}</td><td><select class="status-select ${status.toLowerCase()}" data-status="${s.id}"><option ${status==="Present"?"selected":""}>Present</option><option ${status==="Absent"?"selected":""}>Absent</option></select></td></tr>`;
  }).join("")||emptyRow(3,"Add students before marking attendance.");
  $("markCount").textContent=students.length+" student"+(students.length===1?"":"s");
}
function showToast(message){const t=$("toast");t.textContent=message;t.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove("show"),2600);}
function go(view){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===view));document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));const names={dashboard:"Dashboard",students:"Students",attendance:"Mark attendance",reports:"Reports"};$("crumbCurrent").textContent=names[view]||"Dashboard";window.scrollTo({top:0,behavior:"smooth"});render();}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>go(b.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.goto)));
$("studentSearch").addEventListener("input",renderStudents);$("reportSearch").addEventListener("input",renderReports);
$("attendanceDate").value=new Date().toISOString().slice(0,10);
$("attendanceDate").addEventListener("change",()=>{markDraft={};renderMarkTable()});
$("subjectSelect").addEventListener("change",()=>{markDraft={};renderMarkTable()});
$("markTable").addEventListener("change",e=>{if(e.target.dataset.status){markDraft[e.target.dataset.status]=e.target.value;e.target.className="status-select "+e.target.value.toLowerCase();}});
$("allPresent").addEventListener("click",()=>{students.forEach(s=>markDraft[s.id]="Present");renderMarkTable()});
$("allAbsent").addEventListener("click",()=>{students.forEach(s=>markDraft[s.id]="Absent");renderMarkTable()});
$("saveAttendance").addEventListener("click",()=>{
  if(!students.length){showToast("Add students before saving attendance.");return;}
  const date=$("attendanceDate").value,subject=$("subjectSelect").value;
  if(!date){showToast("Please choose an attendance date.");return;}
  students.forEach(s=>{const status=markDraft[s.id]||document.querySelector(`[data-status="${s.id}"]`)?.value||"Present";const idx=attendance.findIndex(a=>a.studentId===s.id&&a.date===date&&a.subject===subject);const row={studentId:s.id,subject,date,status};if(idx>=0)attendance[idx]=row;else attendance.push(row);});
  markDraft={};persist();render();showToast("Attendance saved successfully.");
});
$("addStudentBtn").addEventListener("click",()=>$("studentDialog").showModal());
$("closeDialog").addEventListener("click",()=>$("studentDialog").close());$("cancelDialog").addEventListener("click",()=>$("studentDialog").close());
$("studentForm").addEventListener("submit",e=>{e.preventDefault();const name=$("newName").value.trim(),roll=$("newRoll").value.trim(),dept=$("newDept").value.trim(),year=Number($("newYear").value);if(students.some(s=>s.roll.toLowerCase()===roll.toLowerCase())){showToast("That roll number already exists.");return;}students.push({id:Math.max(0,...students.map(s=>s.id))+1,name,roll,department:dept,year});persist();$("studentForm").reset();$("newDept").value="CSE";$("newYear").value="2";$("studentDialog").close();render();showToast("Student added successfully.");});
$("studentsTable").addEventListener("click",e=>{const id=Number(e.target.dataset.delete);if(!id)return;const s=students.find(x=>x.id===id);if(!confirm(`Remove ${s.name} and their attendance records?`))return;students=students.filter(x=>x.id!==id);attendance=attendance.filter(a=>a.studentId!==id);persist();render();showToast("Student removed.");});
$("exportCsv").addEventListener("click",()=>{const rows=[["Roll Number","Student Name","Department","Year","Present","Total Classes","Attendance Percentage","Status"],...students.map(s=>{const m=metrics(s.id);return [s.roll,s.name,s.department,s.year,m.present,m.total,m.pct.toFixed(2),m.total?(m.pct<75?"Below 75%":"Satisfactory"):"No records"]})];const csv=rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="classtrack-attendance-report.csv";a.click();URL.revokeObjectURL(a.href);showToast("Report exported as CSV.");});
render();