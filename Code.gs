// ==========================================
// ⚙️ ផ្នែកកំណត់រចនាសម្ព័ន្ធ TELEGRAM (សូមប្តូរនៅទីនេះ)
// ==========================================
var TELEGRAM_BOT_TOKEN = "8877919591:AAHy-g0du2GBVJx0sHisVFTIsD32NAd35qA"; 
var TELEGRAM_CHAT_ID = "-1004317236863";     
var RECEIPT_FOLDER_ID = "1nOrIud1_6VP6VuZ6nbflAu56J1K3iJo_"; 

function doGet(e) {
  if (e.parameter && e.parameter.action) {
    var action = e.parameter.action;
    var p = e.parameter;
    var result = {};
    try {
      if (action === "verifyLogin") result = verifyLogin(p.user, p.pass);
      else if (action === "getDashboardData") result = getDashboardData();
      else if (action === "searchStudentsGlobal") result = searchStudentsGlobal(p.keyword);
      else if (action === "addNewStudent") result = addNewStudent(p.name, p.gender, p.sClass, p.phone, p.type, p.amt, p.note, p.sYear, p.fullFee, p.method, p.cashier);
      // 👉 Update ថ្មី៖ អនុញ្ញាតឲ្យកែតែ ឈ្មោះ, ភេទ, ថ្នាក់, លេខទូរសព្ទ និងវិធីសាស្ត្របង់ប្រាក់ប៉ុណ្ណោះ
      else if (action === "updateStudentInfo") result = updateStudentInfo(p.id, p.name, p.gender, p.sClass, p.phone, p.method);
      else if (action === "deleteStudentRow") result = deleteStudentRow(p.id, p.cashierName);
      else if (action === "collectSecondPayment") result = collectSecondPayment(p.id, p.amt, p.method, p.cashier);
      else if (action === "getSemester2PendingData") result = getSemester2PendingData();
      else if (action === "getDailyClosingReport") result = getDailyClosingReport();
      else if (action === "getMonthlyClosingReport") result = getMonthlyClosingReport();
      else if (action === "getClassMonitoringData") result = getClassMonitoringData();
      else if (action === "getTeacherDashboardData") result = getTeacherDashboardData();
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({error: true, message: error.message})).setMimeType(ContentService.MimeType.JSON);
    }
  }

  var page = e.parameter.page || 'index'; 
  if (page === 'cashier') {
    return HtmlService.createHtmlOutputFromFile('Cashier').setTitle('តុបេឡា (Cashier)');
  } else if (page === 'teacher') {
    return HtmlService.createHtmlOutputFromFile('Teacher').setTitle('ប្រព័ន្ធគ្រូបង្រៀន (Teacher)');
  } else if (page === 'reminder') {
    return HtmlService.createHtmlOutputFromFile('Reminder').setTitle('របាយការណ៍សិស្សជំពាក់ប្រាក់ឆមាសទី២');
  } else if (page === 'semester2') {
    return HtmlService.createHtmlOutputFromFile('Semester2').setTitle('របាយការណ៍ឆមាសទី២');
  } else {
    return HtmlService.createHtmlOutputFromFile('Index').setTitle('ផ្ទាំងគ្រប់គ្រងរដ្ឋបាល (Admin Dashboard)');
  }
}

function addNewStudent(studentName, gender, studentClass, phone, paymentType, amount, otherNote, schoolYear, fullYearFeeInput, paymentMethod, cashierName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Students_Payment");
  var historySheet = ss.getSheetByName("Payment_History");
  var studentId = generateNextStudentId();
  var dateCreated = new Date();
  var actualAmount = Number(amount), fullYearFee = Number(fullYearFeeInput);
  if (otherNote === "សិស្សក្រីក្រ (លើកលែង)" || otherNote === "សិស្សលើកលែង") { fullYearFee = 0; actualAmount = 0; paymentMethod = "លើកលែង (Exempted)"; }
  var remainingBalance = fullYearFee - actualAmount;
  if (remainingBalance < 0) remainingBalance = 0;
  var status = (remainingBalance > 0) ? "Pending" : "Paid";
  sheet.appendRow([studentId, studentName, studentClass, paymentType, actualAmount, paymentMethod, dateCreated, status, cashierName, otherNote, gender, schoolYear, fullYearFee, remainingBalance, phone]);
  var historyLog = (paymentType === "១ឆ្នាំពេញ") ? "បង់១ឆ្នាំពេញ" : "បង់ឆមាសទី១";
  if (historySheet) { historySheet.appendRow([studentId, studentName, dateCreated, historyLog, actualAmount, paymentMethod, cashierName]); }
  return studentId;
}

// 👉 មុខងារ Update ថ្មី៖ មិនឲ្យប៉ះពាល់ដល់ថវិកាសិស្ស
function updateStudentInfo(studentId, studentName, gender, studentClass, phone, paymentMethod) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment");
  var data = sheet.getDataRange().getValues();
  var searchId = String(studentId).trim();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === searchId) {
      var row = i + 1;
      sheet.getRange(row, 2).setValue(studentName);       // ឈ្មោះ
      sheet.getRange(row, 3).setValue(studentClass);      // ថ្នាក់
      sheet.getRange(row, 6).setValue(paymentMethod);     // វិធីសាស្ត្របង់
      sheet.getRange(row, 11).setValue(gender);           // ភេទ
      sheet.getRange(row, 15).setValue(phone);            // លេខទូរសព្ទ
      return "បានធ្វើបច្ចុប្បន្នភាពព័ត៌មាន " + studentName + " ដោយជោគជ័យ (មិនកែប្រែថវិកា)!";
    }
  }
  return "រកមិនឃើញសិស្សដើម្បីកែប្រែឡើយ!";
}

function deleteStudentRow(studentId, cashierName) {
  if (cashierName !== "ហម ម៉ាលីនដា") return { success: false, message: "សុំទោស! អ្នកគ្មានសិទ្ធិលុបទិន្នន័យនេះទេ។" };
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment");
  var data = sheet.getDataRange().getValues();
  var searchId = String(studentId).trim();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === searchId) {
      sheet.deleteRow(i + 1);
      return { success: true, message: "បានលុបទិន្នន័យសិស្សកូដ " + searchId + " ជោគជ័យ!" };
    }
  }
  return { success: false, message: "រកមិនឃើញទិន្នន័យសិស្សនេះដើម្បីលុបឡើយ!" };
}

function searchStudentsGlobal(keyword) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment");
  var data = sheet.getDataRange().getValues();
  var results = [], lowerKeyword = String(keyword).toLowerCase().trim();
  if (!lowerKeyword) return [];
  for (var i = data.length - 1; i >= 1; i--) {
    var id = String(data[i][0] || "").toLowerCase(), name = String(data[i][1] || "").toLowerCase(), phone = String(data[i][14] || "").toLowerCase();
    if (id.includes(lowerKeyword) || name.includes(lowerKeyword) || phone.includes(lowerKeyword)) {
      results.push({ id: data[i][0], name: data[i][1], class: data[i][2], type: data[i][3], amount: Number(data[i][4]) || 0, method: String(data[i][5]), status: data[i][7], other: data[i][9], gender: data[i][10], year: data[i][11] || "", fullFee: Number(data[i][12]) || 0, remaining: Number(data[i][13]) || 0, phone: data[i][14] || "" });
    }
    if (results.length >= 20) break; 
  }
  return results;
}

function getDashboardData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment");
  var data = sheet.getDataRange().getValues();
  var totalPaidStudents = 0, totalFemalePaid = 0, totalRevenue = 0, totalDiscounted = 0, totalExempted = 0, studentsList = [];
  for (var i = data.length - 1; i >= 1; i--) {
    var id = data[i][0], name = data[i][1], sClass = data[i][2], type = data[i][3], amount = Number(data[i][4]) || 0;
    var method = String(data[i][5]), status = data[i][7], other = data[i][9], gender = data[i][10], sYear = data[i][11] || "";
    var fullFee = Number(data[i][12]) || 0, remaining = Number(data[i][13]) || 0, phone = data[i][14] || ""; 
    
    if (amount > 0) {
      totalPaidStudents++; totalRevenue += amount;
      if (gender === "ស្រី" || gender === "Female" || gender === "f" || gender === "F") { totalFemalePaid++; }
    }
    if (other === "សិស្សបញ្ចុះតម្លៃ") { totalDiscounted++; } else if (other === "សិស្សក្រីក្រ (លើកលែង)" || other === "សិស្សលើកលែង") { totalExempted++; }
    if(studentsList.length < 15) { studentsList.push({ id: id, name: name, gender: gender, class: sClass, type: type, amount: amount, method: method, status: status, other: other, year: sYear, fullFee: fullFee, remaining: remaining, phone: phone }); }
  }
  return { totalPaid: totalPaidStudents, totalFemale: totalFemalePaid, totalRevenue: totalRevenue.toLocaleString() + " KHR", totalDiscounted: totalDiscounted, totalExempted: totalExempted, students: studentsList };
}

function collectSecondPayment(studentId, additionalAmount, paymentMethod, cashierName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment");
  var historySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Payment_History");
  var data = sheet.getDataRange().getValues();
  var searchId = String(studentId).trim();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === searchId) {
      var row = i + 1, stuName = data[i][1], stuClass = data[i][2], currentAmount = Number(data[i][4]) || 0;
      var addAmt = Number(additionalAmount), newAmount = currentAmount + addAmt; 
      var fullFee = Number(data[i][12]) || 0, remaining = fullFee - newAmount;
      if (remaining < 0) remaining = 0;
      var status = (remaining > 0) ? "Pending" : "Paid";
      
      sheet.getRange(row, 4).setValue("១ឆ្នាំពេញ");         
      sheet.getRange(row, 5).setValue(newAmount);         
      sheet.getRange(row, 6).setValue(paymentMethod);     
      sheet.getRange(row, 9).setValue(cashierName);       
      sheet.getRange(row, 14).setValue(remaining);                
      sheet.getRange(row, 8).setValue(status);
      
      if(historySheet) { historySheet.appendRow([searchId, stuName, new Date(), "បង់បង្គ្រប់ (ឆមាសទី២)", addAmt, paymentMethod, cashierName]); }
      return "ជោគជ័យ៖ បានទទួលប្រាក់បង្គ្រប់ចំនួន " + addAmt.toLocaleString() + " KHR សម្រាប់សិស្ស " + stuName;
    }
  }
  return "រកមិនឃើញទិន្នន័យសិស្សឡើយ!";
}

// Function របាយការណ៍បន្តរក្សាទុកដដែល
function getDailyClosingReport() {
  var historySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Payment_History");
  if (!historySheet) return null;
  var data = historySheet.getDataRange().getValues();
  var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
  var report = { date: todayStr, totalTx: 0, cashTotal: 0, qrTotal: 0, exemptTotal: 0, grandTotal: 0, details: [] };
  for (var i = 1; i < data.length; i++) {
    if (!data[i][2]) continue; 
    var rowDateStr = Utilities.formatDate(new Date(data[i][2]), Session.getScriptTimeZone(), "dd/MM/yyyy");
    if (rowDateStr === todayStr) {
      var amount = Number(data[i][4]) || 0, method = String(data[i][5]);
      report.totalTx++; report.grandTotal += amount;
      if (method.indexOf("Cash") !== -1 || method.indexOf("សាច់ប្រាក់") !== -1) { report.cashTotal += amount; } 
      else if (method.indexOf("KHQR") !== -1 || method.indexOf("ស្កែន") !== -1) { report.qrTotal += amount; } 
      else { report.exemptTotal += amount; }
      report.details.push({ id: data[i][0], name: data[i][1], phase: data[i][3], amount: amount, method: method, cashier: String(data[i][6]) });
    }
  }
  return report;
}

function verifyLogin(username, password) {
  var users = { "malinda": { pass: "123456", name: "ហម ម៉ាលីនដា" }, "admin": { pass: "admin123", name: "នាយកសាលា" } };
  var user = users[username.toLowerCase()];
  if (user && user.pass === password) { return { success: true, cashierName: user.name }; } else { return { success: false, message: "ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវទេ!" }; }
}

function getMonthlyClosingReport() {
  var historySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Payment_History");
  if (!historySheet) return null;
  var data = historySheet.getDataRange().getValues();
  var today = new Date();
  var monthNames = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
  var report = { monthStr: monthNames[today.getMonth()] + " ឆ្នាំ " + today.getFullYear(), totalTx: 0, cashTotal: 0, qrTotal: 0, grandTotal: 0, details: [] };
  for (var i = 1; i < data.length; i++) {
    if (!data[i][2]) continue; 
    var rowDate = new Date(data[i][2]);
    if (rowDate.getMonth() === today.getMonth() && rowDate.getFullYear() === today.getFullYear()) {
      var amount = Number(data[i][4]) || 0, method = String(data[i][5]);
      report.totalTx++; report.grandTotal += amount;
      if (method.indexOf("Cash") !== -1 || method.indexOf("សាច់ប្រាក់") !== -1) { report.cashTotal += amount; } 
      else if (method.indexOf("KHQR") !== -1 || method.indexOf("ស្កែន") !== -1) { report.qrTotal += amount; }
      report.details.push({ date: Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "dd/MM/yyyy"), id: data[i][0], name: data[i][1], phase: data[i][3], amount: amount, method: method });
    }
  }
  return report;
}

function getSemester2PendingData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment") || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = sheet.getDataRange().getValues();
  var validData = [], totalAmount = 0, totalFemale = 0;
  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][0]).trim();        
    if (!id) continue;
    var remaining = Number(data[i][13]) || 0;  
    if (remaining > 0) {
      var gender = String(data[i][10]).trim();
      totalAmount += remaining;
      if (gender === 'ស្រី' || gender.toLowerCase() === 'female' || gender.toLowerCase() === 'f') { totalFemale++; }
      var phone = String(data[i][14]).trim();
      if (phone !== "" && !phone.startsWith("0") && !isNaN(phone)) { phone = "0" + phone; }
      validData.push({ id: id, name: String(data[i][1]).trim(), gender: gender, className: String(data[i][2]).trim(), fullFee: Number(data[i][12]) || 0, paidAmt: Number(data[i][4]) || 0, remaining: remaining, phone: phone || "មិនមាន" });
    }
  }
  validData.sort(function(a, b) { return a.className < b.className ? -1 : (a.className > b.className ? 1 : 0); });
  return { data: validData, totalAmount: totalAmount, totalStudents: validData.length, totalFemale: totalFemale };
}

function getClassMonitoringData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment") || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = sheet.getDataRange().getValues();
  var headers = data[0], idxFullFee = headers.findIndex(h => String(h).includes('សរុប') || String(h).toLowerCase().includes('fee'));
  if (idxFullFee === -1) idxFullFee = 4; 
  var classGroups = {};
  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][0]).trim();
    if (!id) continue;
    var className = String(data[i][2]).trim() || "មិនកំណត់";
    var paidAmt = Number(data[i][4]) || 0, fullFee = Number(data[i][idxFullFee]) || paidAmt;
    var remaining = fullFee - paidAmt; if (remaining < 0) remaining = 0;
    var rawDate = data[i][6], dateStr = "-";
    if (rawDate) { dateStr = (rawDate instanceof Date) ? Utilities.formatDate(rawDate, Session.getScriptTimeZone(), "dd/MM/yyyy") : String(rawDate).split(" ")[0]; }
    if (!classGroups[className]) { classGroups[className] = []; }
    classGroups[className].push({ name: String(data[i][1]).trim(), gender: String(data[i][10]).trim(), status: String(data[i][7]).trim(), fullFee: fullFee, paidAmt: paidAmt, remaining: remaining, date: dateStr });
  }
  return classGroups;
}

function getTeacherDashboardData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var studentSheet = ss.getSheetByName("Students_Payment") || ss.getSheets()[0];
  var historySheet = ss.getSheetByName("Payment_History");
  var studentData = studentSheet ? studentSheet.getDataRange().getValues() : [];
  var historyData = historySheet ? historySheet.getDataRange().getValues() : [];
  var totalPaidStudents = 0, totalFemalePaid = 0, totalCollected = 0, totalRemaining = 0, studentMap = {}, paidList = [];
  var headers = studentData[0] || [], idxId = headers.findIndex(h => String(h).includes('កូដ') || String(h).toLowerCase().includes('id')) || 0;
  var idxGender = headers.findIndex(h => String(h).includes('ភេទ') || String(h).toLowerCase().includes('gender')) || 2;
  var idxClass = headers.findIndex(h => String(h).includes('ថ្នាក់') || String(h).toLowerCase().includes('class')) || 3;
  var idxFullFee = headers.findIndex(h => String(h).includes('សរុប') || String(h).toLowerCase().includes('fee')) || 4;
  var idxAmount = headers.findIndex(h => String(h).includes('បង់រួច') || String(h).toLowerCase().includes('amount')) || 5;
  if(idxId === -1) idxId = 0; if(idxGender === -1) idxGender = 2; if(idxClass === -1) idxClass = 3; if(idxFullFee === -1) idxFullFee = 4; if(idxAmount === -1) idxAmount = 5;

  for (var i = 1; i < studentData.length; i++) {
    var id = String(studentData[i][idxId]).trim();
    if (!id) continue;
    var gender = String(studentData[i][idxGender]).trim(), paidAmt = Number(studentData[i][idxAmount]) || 0;
    var rem = (Number(studentData[i][idxFullFee]) || 0) - paidAmt; if (rem < 0) rem = 0;
    if (paidAmt > 0) { totalPaidStudents++; totalCollected += paidAmt; if (gender === "ស្រី" || gender.toLowerCase() === "female" || gender === "F" || gender === "f") { totalFemalePaid++; } }
    totalRemaining += rem; studentMap[id] = { className: String(studentData[i][idxClass]).trim() };
  }
  if (historyData.length > 1) {
    for (var j = historyData.length - 1, count = 0; j >= 1 && count < 25; j--, count++) {
      var sId = String(historyData[j][0]).trim(), pDate = historyData[j][2];
      if (!sId) continue;
      var dateStr = (pDate instanceof Date) ? Utilities.formatDate(pDate, Session.getScriptTimeZone(), "dd/MM/yyyy") : String(pDate).split(" ")[0] || String(pDate);
      paidList.push({ id: sId, name: String(historyData[j][1]).trim(), className: (studentMap[sId] || { className: "មិនច្បាស់" }).className, amount: Number(historyData[j][4]) || 0, date: dateStr, phase: historyData[j][3] });
    }
  }
  return { totalPaidStudents: totalPaidStudents, totalFemalePaid: totalFemalePaid, totalCollected: totalCollected, totalRemaining: totalRemaining, paidList: paidList };
}

function generateNextStudentId() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment") || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var lastRow = Math.max(sheet.getLastRow(), 2), data = sheet.getRange("A2:A" + lastRow).getValues();
  var maxNumber = 0;
  for (var i = 0; i < data.length; i++) {
    var currentId = String(data[i][0]).trim();
    if (currentId.indexOf("AKKNGS-") === 0) {
      var num = parseInt(currentId.replace("AKKNGS-", ""), 10);
      if (!isNaN(num) && num > maxNumber) { maxNumber = num; }
    }
  }
  var nextNumberStr = (maxNumber + 1).toString();
  while (nextNumberStr.length < 6) { nextNumberStr = "0" + nextNumberStr; }
  return "AKKNGS-" + nextNumberStr;
}
