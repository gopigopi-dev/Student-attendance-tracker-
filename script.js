// Student Attendance Tracker - main script
// Data is stored in the browser Local Storage.

var STUDENT_KEY = "sat_students";
var ATT_KEY = "sat_attendance";
var THRESHOLD_KEY = "sat_threshold";

var STATUS_LIST = ["Present", "Absent", "Late", "On Duty"];

// Present, Late and On Duty are counted as attended.
var ATTENDED = ["Present", "Late", "On Duty"];

var students = loadData(STUDENT_KEY);
var attendance = loadData(ATT_KEY);
var threshold = Number(localStorage.getItem(THRESHOLD_KEY)) || 75;

// ---------- Local Storage helpers ----------

function loadData(key) {
  var text = localStorage.getItem(key);
  if (!text) {
    return [];
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    return [];
  }
}

function saveAll() {
  localStorage.setItem(STUDENT_KEY, JSON.stringify(students));
  localStorage.setItem(ATT_KEY, JSON.stringify(attendance));
  localStorage.setItem(THRESHOLD_KEY, String(threshold));
}

// ---------- Small helper functions ----------

function $(id) {
  return document.getElementById(id);
}

function todayString() {
  var d = new Date();
  var month = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function badgeClass(status) {
  return status.replace(" ", "");
}

function showMessage(text, type) {
  var box = $("message");
  box.textContent = text;
  box.className = "message " + type;
  setTimeout(function () {
    box.textContent = "";
  }, 3500);
}

function formatDate(dateText) {
  var parts = dateText.split("-");
  return parts[2] + "-" + parts[1] + "-" + parts[0];
}

// ---------- Attendance calculations ----------

// Find the saved status of a student on one date
function getStatus(studentId, date) {
  for (var i = 0; i < attendance.length; i++) {
    if (attendance[i].studentId === studentId && attendance[i].date === date) {
      return attendance[i].status;
    }
  }
  return "Not Marked";
}

// Returns { total, attended, percent } for one student
function getStats(studentId) {
  var total = 0;
  var attended = 0;
  for (var i = 0; i < attendance.length; i++) {
    if (attendance[i].studentId === studentId) {
      total++;
      if (ATTENDED.indexOf(attendance[i].status) !== -1) {
        attended++;
      }
    }
  }
  var percent = total === 0 ? null : (attended / total) * 100;
  return { total: total, attended: attended, percent: percent };
}

function isLow(studentId) {
  var stats = getStats(studentId);
  return stats.percent !== null && stats.percent < threshold;
}

// ---------- Summary cards ----------

function renderSummary() {
  var date = $("workDate").value;
  var present = 0;
  var absent = 0;
  var low = 0;

  for (var i = 0; i < students.length; i++) {
    var status = getStatus(students[i].id, date);
    if (ATTENDED.indexOf(status) !== -1) {
      present++;
    } else if (status === "Absent") {
      absent++;
    }
    if (isLow(students[i].id)) {
      low++;
    }
  }

  // Overall percentage = all attended records / all records
  var totalRecords = 0;
  var attendedRecords = 0;
  for (var j = 0; j < attendance.length; j++) {
    totalRecords++;
    if (ATTENDED.indexOf(attendance[j].status) !== -1) {
      attendedRecords++;
    }
  }
  var overall = totalRecords === 0 ? 0 : (attendedRecords / totalRecords) * 100;

  $("sumTotal").textContent = students.length;
  $("sumPresent").textContent = present;
  $("sumAbsent").textContent = absent;
  $("sumPercent").textContent = overall.toFixed(1) + "%";
  $("sumLow").textContent = low;
}

// ---------- Student list ----------

function fillDepartmentFilter() {
  var select = $("deptFilter");
  var old = select.value;
  var seen = [];
  for (var i = 0; i < students.length; i++) {
    if (seen.indexOf(students[i].dept) === -1) {
      seen.push(students[i].dept);
    }
  }
  seen.sort();
  select.innerHTML = '<option value="">All departments</option>';
  for (var j = 0; j < seen.length; j++) {
    select.innerHTML += '<option value="' + escapeHtml(seen[j]) + '">' + escapeHtml(seen[j]) + "</option>";
  }
  select.value = old;
}

function renderStudents() {
  var date = $("workDate").value;
  var search = $("searchBox").value.trim().toLowerCase();
  var dept = $("deptFilter").value;
  var statusFilter = $("statusFilter").value;
  var rows = "";
  var shown = 0;

  for (var i = 0; i < students.length; i++) {
    var s = students[i];
    var stats = getStats(s.id);
    var todayStatus = getStatus(s.id, date);
    var low = isLow(s.id);

    // Search by name or ID
    if (search !== "") {
      var text = (s.name + " " + s.id).toLowerCase();
      if (text.indexOf(search) === -1) {
        continue;
      }
    }
    // Filter by department
    if (dept !== "" && s.dept !== dept) {
      continue;
    }
    // Filter by attendance status
    if (statusFilter === "Low") {
      if (!low) {
        continue;
      }
    } else if (statusFilter !== "" && todayStatus !== statusFilter) {
      continue;
    }

    var percentText = "-";
    var percentClass = "";
    if (stats.percent !== null) {
      percentText = stats.percent.toFixed(1) + "% (" + stats.attended + "/" + stats.total + ")";
      percentClass = low ? "percent-low" : "percent-good";
    }

    rows += '<tr class="' + (low ? "low-row" : "") + '">' +
      "<td>" + escapeHtml(s.id) + "</td>" +
      "<td>" + escapeHtml(s.name) + "</td>" +
      "<td>" + escapeHtml(s.dept) + "</td>" +
      "<td>" + escapeHtml(s.year) + "</td>" +
      '<td><span class="' + percentClass + '">' + percentText + "</span>" +
        (low ? '<span class="badge LowBadge">LOW</span>' : "") + "</td>" +
      '<td><span class="badge ' + badgeClass(todayStatus) + '">' + todayStatus + "</span></td>" +
      "<td>" +
        '<button class="btn small" onclick="editStudent(' + i + ')">Edit</button> ' +
        '<button class="btn small" onclick="openHistory(' + i + ')">History</button> ' +
        '<button class="btn small danger" onclick="deleteStudent(' + i + ')">Delete</button>' +
      "</td></tr>";
    shown++;
  }

  if (shown === 0) {
    rows = '<tr><td colspan="7" class="empty">No students found.</td></tr>';
  }
  $("studentBody").innerHTML = rows;
}

// ---------- Add, edit and delete students ----------

function resetForm() {
  $("studentForm").reset();
  $("editIndex").value = "-1";
  $("formTitle").textContent = "Add Student";
  $("saveBtn").textContent = "Save Student";
  $("stuId").disabled = false;
}

function handleStudentSubmit(event) {
  event.preventDefault();

  var id = $("stuId").value.trim().toUpperCase();
  var name = $("stuName").value.trim();
  var dept = $("stuDept").value;
  var year = $("stuYear").value;
  var editIndex = Number($("editIndex").value);

  if (id === "" || name === "") {
    showMessage("Please enter Student ID and Name.", "error");
    return;
  }

  // Student ID must be unique
  for (var i = 0; i < students.length; i++) {
    if (students[i].id === id && i !== editIndex) {
      showMessage("This Student ID already exists.", "error");
      return;
    }
  }

  if (editIndex === -1) {
    students.push({ id: id, name: name, dept: dept, year: year });
    showMessage("Student added.", "ok");
  } else {
    students[editIndex].name = name;
    students[editIndex].dept = dept;
    students[editIndex].year = year;
    showMessage("Student updated.", "ok");
  }

  saveAll();
  resetForm();
  renderAll();
}

function editStudent(index) {
  var s = students[index];
  $("stuId").value = s.id;
  $("stuId").disabled = true;
  $("stuName").value = s.name;
  $("stuDept").value = s.dept;
  $("stuYear").value = s.year;
  $("editIndex").value = index;
  $("formTitle").textContent = "Edit Student";
  $("saveBtn").textContent = "Update Student";
  showTab("studentsTab");
}

function deleteStudent(index) {
  var s = students[index];
  if (!confirm("Delete " + s.name + " and all attendance records?")) {
    return;
  }
  // Remove attendance of this student too
  attendance = attendance.filter(function (record) {
    return record.studentId !== s.id;
  });
  students.splice(index, 1);
  saveAll();
  resetForm();
  renderAll();
  showMessage("Student deleted.", "ok");
}

// ---------- Mark attendance ----------

// Save one record. Same student and same date is never added twice.
function saveRecord(studentId, date, status) {
  for (var i = 0; i < attendance.length; i++) {
    if (attendance[i].studentId === studentId && attendance[i].date === date) {
      attendance[i].status = status;
      return "updated";
    }
  }
  attendance.push({ studentId: studentId, date: date, status: status });
  return "added";
}

function renderMarkList() {
  var date = $("workDate").value;
  $("markDateText").textContent = formatDate(date);
  var rows = "";

  for (var i = 0; i < students.length; i++) {
    var s = students[i];
    var saved = getStatus(s.id, date);
    var options = "";
    for (var k = 0; k < STATUS_LIST.length; k++) {
      var selected = STATUS_LIST[k] === saved ? " selected" : "";
      options += "<option" + selected + ">" + STATUS_LIST[k] + "</option>";
    }
    rows += "<tr>" +
      "<td>" + escapeHtml(s.id) + "</td>" +
      "<td>" + escapeHtml(s.name) + "</td>" +
      "<td>" + escapeHtml(s.dept) + "</td>" +
      '<td><span class="badge ' + badgeClass(saved) + '">' + saved + "</span></td>" +
      '<td><select id="pick' + i + '">' + options + "</select></td>" +
      '<td><button class="btn small primary" onclick="markStudent(' + i + ')">' +
        (saved === "Not Marked" ? "Save" : "Change") + "</button></td></tr>";
  }

  if (students.length === 0) {
    rows = '<tr><td colspan="6" class="empty">Add students first.</td></tr>';
  }
  $("markBody").innerHTML = rows;
}

function markStudent(index) {
  var s = students[index];
  var date = $("workDate").value;
  var status = $("pick" + index).value;
  var old = getStatus(s.id, date);

  // Duplicate check: if already marked, ask before changing
  if (old !== "Not Marked") {
    if (old === status) {
      showMessage(s.name + " is already marked " + status + " on this date.", "error");
      return;
    }
    if (!confirm(s.name + " is already marked " + old + ". Change it to " + status + "?")) {
      return;
    }
  }

  saveRecord(s.id, date, status);
  saveAll();
  renderAll();
  showMessage("Saved: " + s.name + " - " + status, "ok");
}

function markAllPresent() {
  var date = $("workDate").value;
  var count = 0;
  for (var i = 0; i < students.length; i++) {
    if (getStatus(students[i].id, date) === "Not Marked") {
      saveRecord(students[i].id, date, "Present");
      count++;
    }
  }
  saveAll();
  renderAll();
  showMessage(count + " student(s) marked Present. Already marked students were not changed.", "ok");
}

// ---------- History ----------

function fillHistoryDropdown() {
  var select = $("historyStudent");
  var old = select.value;
  select.innerHTML = "";
  for (var i = 0; i < students.length; i++) {
    select.innerHTML += '<option value="' + escapeHtml(students[i].id) + '">' +
      escapeHtml(students[i].id) + " - " + escapeHtml(students[i].name) + "</option>";
  }
  if (old) {
    select.value = old;
  }
}

function renderHistory() {
  var id = $("historyStudent").value;
  var info = $("historyInfo");
  var body = $("historyBody");

  if (!id) {
    info.textContent = "No student selected.";
    body.innerHTML = '<tr><td colspan="2" class="empty">No records.</td></tr>';
    return;
  }

  var stats = getStats(id);
  var records = attendance.filter(function (r) {
    return r.studentId === id;
  });
  records.sort(function (a, b) {
    return a.date < b.date ? 1 : -1;
  });

  if (stats.percent === null) {
    info.textContent = "No attendance marked yet.";
  } else {
    info.innerHTML = "Attended <b>" + stats.attended + "</b> of <b>" + stats.total +
      "</b> days. Attendance: <b>" + stats.percent.toFixed(1) + "%</b>" +
      (isLow(id) ? " - below " + threshold + "% (LOW)" : "");
  }

  var rows = "";
  for (var i = 0; i < records.length; i++) {
    rows += "<tr><td>" + formatDate(records[i].date) + "</td>" +
      '<td><span class="badge ' + badgeClass(records[i].status) + '">' +
      records[i].status + "</span></td></tr>";
  }
  if (rows === "") {
    rows = '<tr><td colspan="2" class="empty">No records.</td></tr>';
  }
  body.innerHTML = rows;
}

function openHistory(index) {
  $("historyStudent").value = students[index].id;
  renderHistory();
  showTab("historyTab");
}

// ---------- Tabs ----------

function showTab(tabId) {
  var panels = document.querySelectorAll(".panel");
  var tabs = document.querySelectorAll(".tab");
  for (var i = 0; i < panels.length; i++) {
    panels[i].classList.toggle("hidden", panels[i].id !== tabId);
  }
  for (var j = 0; j < tabs.length; j++) {
    tabs[j].classList.toggle("active", tabs[j].getAttribute("data-tab") === tabId);
  }
}

// ---------- Sample data ----------

function loadSampleData() {
  if (students.length > 0 && !confirm("This will replace current data. Continue?")) {
    return;
  }
  students = [
    { id: "24BCA001", name: "Arun Kumar", dept: "BCA", year: "2" },
    { id: "24BCA002", name: "Divya Lakshmi", dept: "BCA", year: "2" },
    { id: "24BCA003", name: "Karthik Raja", dept: "BCA", year: "2" },
    { id: "24BCA004", name: "Meena Priya", dept: "BCA", year: "2" },
    { id: "24CS011", name: "Naveen Babu", dept: "BSc Computer Science", year: "2" },
    { id: "24CS012", name: "Pooja Sri", dept: "BSc Computer Science", year: "2" },
    { id: "24COM021", name: "Ramesh Kannan", dept: "BCom", year: "1" },
    { id: "24COM022", name: "Sangeetha M", dept: "BCom", year: "1" },
    { id: "24BBA031", name: "Vijay Anand", dept: "BBA", year: "3" },
    { id: "24BBA032", name: "Yamini Devi", dept: "BBA", year: "3" }
  ];
  attendance = [];

  // Make 8 earlier days of fixed sample data (up to yesterday)
  var pattern = {
    "24BCA001": "PPPPPPPP",
    "24BCA002": "PPPPLPPP",
    "24BCA003": "PAPAAPAP",
    "24BCA004": "PPPPPAPP",
    "24CS011":  "PAPPAPPA",
    "24CS012":  "PPOPPPPP",
    "24COM021": "AAPAPPAA",
    "24COM022": "PPPPPPPA",
    "24BBA031": "PPAPPPPP",
    "24BBA032": "PAPPAAPA"
  };
  var letterToStatus = { P: "Present", A: "Absent", L: "Late", O: "On Duty" };
  var base = new Date($("workDate").value);

  for (var id in pattern) {
    for (var d = 0; d < 8; d++) {
      var day = new Date(base);
      day.setDate(base.getDate() - (8 - d));
      var text = day.getFullYear() + "-" +
        String(day.getMonth() + 1).padStart(2, "0") + "-" +
        String(day.getDate()).padStart(2, "0");
      attendance.push({
        studentId: id,
        date: text,
        status: letterToStatus[pattern[id][d]]
      });
    }
  }

  saveAll();
  renderAll();
  showMessage("Sample data loaded.", "ok");
}

// ---------- Draw everything ----------

function renderAll() {
  fillDepartmentFilter();
  fillHistoryDropdown();
  renderSummary();
  renderStudents();
  renderMarkList();
  renderHistory();
}

// ---------- Start the app ----------

function init() {
  $("workDate").value = todayString();
  $("threshold").value = threshold;

  $("studentForm").addEventListener("submit", handleStudentSubmit);
  $("cancelBtn").addEventListener("click", resetForm);
  $("sampleBtn").addEventListener("click", loadSampleData);
  $("allPresentBtn").addEventListener("click", markAllPresent);

  $("workDate").addEventListener("change", renderAll);
  $("searchBox").addEventListener("input", renderStudents);
  $("deptFilter").addEventListener("change", renderStudents);
  $("statusFilter").addEventListener("change", renderStudents);
  $("historyStudent").addEventListener("change", renderHistory);

  $("threshold").addEventListener("change", function () {
    var value = Number($("threshold").value);
    if (value < 1 || value > 100 || isNaN(value)) {
      value = 75;
      $("threshold").value = 75;
    }
    threshold = value;
    saveAll();
    renderAll();
  });

  var tabs = document.querySelectorAll(".tab");
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener("click", function () {
      showTab(this.getAttribute("data-tab"));
    });
  }

  renderAll();
}

init();
