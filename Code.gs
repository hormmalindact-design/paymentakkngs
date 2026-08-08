// ==========================================
// ⚙️ ផ្នែកកំណត់រចនាសម្ព័ន្ធ TELEGRAM (សូមប្តូរនៅទីនេះ)
// ==========================================
var TELEGRAM_BOT_TOKEN = "8877919591:AAHy-g0du2GBVJx0sHisVFTIsD32NAd35qA"; 
var TELEGRAM_CHAT_ID = "-1004317236863";     
var RECEIPT_FOLDER_ID = "1nOrIud1_6VP6VuZ6nbflAu56J1K3iJo_"; 

function doGet(e) {
  // -------------------------------------------------------------
  // ផ្នែកទី១៖ នេះគឺជា API សម្រាប់ Vercel/GitHub ហៅយកទិន្នន័យ
  // -------------------------------------------------------------
  if (e.parameter && e.parameter.action) {
    var action = e.parameter.action;
    var p = e.parameter;
    var result = {};
    
    try {
      if (action === "verifyLogin") result = verifyLogin(p.user, p.pass);
      else if (action === "getDashboardData") result = getDashboardData();
      else if (action === "searchStudentsGlobal") result = searchStudentsGlobal(p.keyword);
      else if (action === "addNewStudent") result = addNewStudent(p.name, p.gender, p.sClass, p.phone, p.type, p.amt, p.note, p.sYear, p.fullFee, p.method, p.cashier);
      else if (action === "updateStudentInfo") result = updateStudentInfo(p.id, p.name, p.gender, p.sClass, p.phone, p.sYear, p.type, p.note, p.fullFee, p.amt);
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

  // -------------------------------------------------------------
  // ផ្នែកទី២៖ នេះគឺជាកូដសម្រាប់បង្ហាញផ្ទាំង HTML ធម្មតា
  // -------------------------------------------------------------
  var page = e.parameter.page || 'index'; 
  
  if (page === 'cashier') {
    return HtmlService.createHtmlOutputFromFile('Cashier')
      .setTitle('តុបេឡា (Cashier) - សាលាបឋមសិក្សាសម្តេចព្រះរាជអគ្គមហេសី')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if (page === 'teacher') {
    return HtmlService.createHtmlOutputFromFile('Teacher')
      .setTitle('ប្រព័ន្ធគ្រូបង្រៀន (Teacher) - ពិនិត្យការបង់ប្រាក់')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if (page === 'reminder') {
    return HtmlService.createHtmlOutputFromFile('Reminder')
      .setTitle('របាយការណ៍សិស្សជំពាក់ប្រាក់ឆមាសទី២')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if (page === 'semester2') {
    return HtmlService.createHtmlOutputFromFile('Semester2')
      .setTitle('របាយការណ៍ឆមាសទី២ - សាលាបឋមសិក្សាសម្តេចព្រះរាជអគ្គមហេសី')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('ផ្ទាំងគ្រប់គ្រងរដ្ឋបាល (Admin Dashboard)')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

function addNewStudent(studentName, gender, studentClass, phone, paymentType, amount, otherNote, schoolYear, fullYearFeeInput, paymentMethod, cashierName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Students_Payment");
  var historySheet = ss.getSheetByName("Payment_History");
  
  var studentId = generateNextStudentId();
  var dateCreated = new Date();
  
  var actualAmount = Number(amount);
  var fullYearFee = Number(fullYearFeeInput);
  
  if (otherNote === "សិស្សក្រីក្រ (លើកលែង)" || otherNote === "សិស្សលើកលែង") {
    fullYearFee = 0;
    actualAmount = 0;
    paymentMethod = "លើកលែង (Exempted)";
  }
  
  var remainingBalance = fullYearFee - actualAmount;
  if (remainingBalance < 0) remainingBalance = 0;
  
  var status = (remainingBalance > 0) ? "Pending" : "Paid";
  
  sheet.appendRow([
    studentId, studentName, studentClass, paymentType, actualAmount, 
    paymentMethod, dateCreated, status, cashierName, otherNote, gender, schoolYear, fullYearFee, remainingBalance, phone
  ]);
  
  var historyLog = (paymentType === "១ឆ្នាំពេញ") ? "បង់១ឆ្នាំពេញ" : "បង់ឆមាសទី១";
  if (historySheet) {
    historySheet.appendRow([studentId, studentName, dateCreated, historyLog, actualAmount, paymentMethod, cashierName]);
  }
  
  var dateStr = Utilities.formatDate(dateCreated, Session.getScriptTimeZone(), "dd/MM/yyyy hh:mm a");
  var telegramText = "🔔 <b><u>ជូនដំណឹងការចុះឈ្មោះ និងបង់ប្រាក់</u></b>\n" +
                     "--------------------------------------------------\n" +
                     "📝 <b>លេខវិក្កយបត្រ៖</b> " + studentId + "\n" +
                     "👤 <b>ឈ្មោះសិស្ស៖</b> " + studentName + "\n" +
                     "🏫 <b>ថ្នាក់រៀន៖</b> " + studentClass + "\n" +
                     "📱 <b>លេខទូរសព្ទ៖</b> " + phone + "\n" +
                     "📦 <b>ដំណាក់កាលបង់៖</b> " + historyLog + "\n" +
                     "💰 <b>ទឹកប្រាក់ទទួលបាន៖</b> " + actualAmount.toLocaleString() + " KHR\n" +
                     "💵 <b>ប្រាក់ខ្វះ (ជំពាក់)៖</b> " + remainingBalance.toLocaleString() + " KHR\n" +
                     "💳 <b>វិធីសាស្ត្របង់៖</b> " + paymentMethod + "\n" +
                     "🧑‍💻 <b>បេឡាអ្នកទទួល៖</b> " + cashierName + "\n" +
                     "📅 <b>កាលបរិច្ឆេទ៖</b> " + dateStr + "\n" +
                     "--------------------------------------------------\n" +
                     "សាលាបឋមសិក្សាសម្តេចព្រះរាជអគ្គមហេសី នរោត្តម មុនីនាថ សីហនុ";
  sendTelegramMessage(telegramText);
  saveReceiptToDrive(studentId, studentName, studentClass, actualAmount, paymentMethod, cashierName, historyLog);
  return studentId;
}

function updateStudentInfo(studentId, studentName, gender, studentClass, phone, schoolYear, paymentType, otherNote, fullYearFeeInput, amountInput) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment");
  var data = sheet.getDataRange().getValues();
  var searchId = String(studentId).trim();
  var actualAmount = Number(amountInput);
  var fullYearFee = Number(fullYearFeeInput);
  
  if (otherNote === "សិស្សក្រីក្រ (លើកលែង)" || otherNote === "សិស្សលើកលែង") {
    fullYearFee = 0; actualAmount = 0;
  }
  var remainingBalance = fullYearFee - actualAmount;
  if (remainingBalance < 0) remainingBalance = 0;
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === searchId) {
      var row = i + 1;
      sheet.getRange(row, 2).setValue(studentName);       
      sheet.getRange(row, 3).setValue(studentClass);      
      sheet.getRange(row, 4).setValue(paymentType);       
      sheet.getRange(row, 5).setValue(actualAmount);      
      sheet.getRange(row, 10).setValue(otherNote);        
      sheet.getRange(row, 11).setValue(gender);           
      sheet.getRange(row, 12).setValue(schoolYear);       
      sheet.getRange(row, 13).setValue(fullYearFee);      
      sheet.getRange(row, 14).setValue(remainingBalance); 
      sheet.getRange(row, 15).setValue(phone);            
      if (remainingBalance > 0) { sheet.getRange(row, 8).setValue("Pending"); } 
      else { sheet.getRange(row, 8).setValue("Paid"); }
      return "បានធ្វើបច្ចុប្បន្នភាពព័ត៌មាន និងទឹកប្រាក់របស់ " + studentName + " រួចរាល់!";
    }
  }
  return "រកមិនឃើញសិស្សដើម្បីកែប្រែឡើយ!";
}

function deleteStudentRow(studentId, cashierName) {
  if (cashierName !== "ហម ម៉ាលីនដា") { return { success: false, message: "សុំទោស! អ្នកគ្មានសិទ្ធិលុបទិន្នន័យនេះទេ។" }; }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Students_Payment");
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
  var results = [];
  var lowerKeyword = String(keyword).toLowerCase().trim();
  if (!lowerKeyword) return [];
  for (var i = data.length - 1; i >= 1; i--) {
    var id = String(data[i][0] || "").toLowerCase();
    var name = String(data[i][1] || "").toLowerCase();
    var phone = String(data[i][14] || "").toLowerCase();
    if (id.includes(lowerKeyword) || name.includes(lowerKeyword) || phone.includes(lowerKeyword)) {
      results.push({
        id: data[i][0], name: data[i][1], class: data[i][2], type: data[i][3], amount: Number(data[i][4]) || 0,
        status: data[i][7], other: data[i][9], gender: data[i][10], year: data[i][11] || "",
        fullFee: Number(data[i][12]) || 0, remaining: Number(data[i][13]) || 0, phone: data[i][14] || ""
      });
    }
    if (results.length >= 20) break; 
  }
  return results;
}

function getDashboardData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment");
  var data = sheet.getDataRange().getValues();
  var totalPaidStudents = 0, totalFemalePaid = 0, totalRevenue = 0, totalDiscounted = 0, totalExempted = 0;
  var studentsList = [];
  
  for (var i = data.length - 1; i >= 1; i--) {
    var id = data[i][0], name = data[i][1], sClass = data[i][2], type = data[i][3], amount = Number(data[i][4]) || 0;
    var status = data[i][7], other = data[i][9], gender = data[i][10], sYear = data[i][11] || "";
    var fullFee = Number(data[i][12]) || 0, remaining = Number(data[i][13]) || 0, phone = data[i][14] || ""; 
    
    if (amount > 0) {
      totalPaidStudents++; totalRevenue += amount;
      if (gender === "ស្រី" || gender === "Female" || gender === "f" || gender === "F") { totalFemalePaid++; }
    }
    if (other === "សិស្សបញ្ចុះតម្លៃ") { totalDiscounted++; } 
    else if (other === "សិស្សក្រីក្រ (លើកលែង)" || other === "សិស្សលើកលែង") { totalExempted++; }
    
    if(studentsList.length < 15) {
      studentsList.push({ id: id, name: name, gender: gender, class: sClass, type: type, amount: amount, status: status, other: other, year: sYear, fullFee: fullFee, remaining: remaining, phone: phone });
    }
  }
  return { totalPaid: totalPaidStudents, totalFemale: totalFemalePaid, totalRevenue: totalRevenue.toLocaleString() + " KHR", totalDiscounted: totalDiscounted, totalExempted: totalExempted, students: studentsList };
}

function getStudentById(studentId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment");
  var data = sheet.getDataRange().getValues();
  var searchId = String(studentId).trim();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === searchId) {
      return { id: data[i][0], name: data[i][1], class: data[i][2], type: data[i][3], amount: data[i][4], method: data[i][5], status: data[i][7], other: data[i][9], gender: data[i][10], year: data[i][11], fullFee: data[i][12], remaining: data[i][13], phone: data[i][14] || "" };
    }
  }
  return null;
}

function collectSecondPayment(studentId, additionalAmount, paymentMethod, cashierName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment");
  var historySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Payment_History");
  var data = sheet.getDataRange().getValues();
  var searchId = String(studentId).trim();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === searchId) {
      var row = i + 1;
      var stuName = data[i][1], stuClass = data[i][2], currentAmount = Number(data[i][4]) || 0;
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
      var dateStr = new Date().toLocaleString('en-GB', { hour12: true });
      var telegramText = "🔥 <b><u>ជូនដំណឹងការបង់ប្រាក់បង្គ្រប់ (លើកទី២)</u></b>\n" +
                         "--------------------------------------------------\n" +
                         "📝 <b>លេខវិក្កយបត្រ៖</b> " + searchId + "\n" +
                         "👤 <b>ឈ្មោះសិស្ស៖</b> " + stuName + "\n" +
                         "🏫 <b>ថ្នាក់រៀន៖</b> " + stuClass + "\n" +
                         "📦 <b>ដំណាក់កាលបង់៖</b> បង់បង្គ្រប់ (ឆមាសទី២) ✅\n" +
                         "💵 <b>ទឹកប្រាក់បង់បន្ថែម៖</b> " + addAmt.toLocaleString() + " KHR\n" +
                         "💰 <b>សរុបបានបង់ពេញ១ឆ្នាំ៖</b> " + newAmount.toLocaleString() + " KHR\n" +
                         "💵 <b>ប្រាក់ខ្វះ (ជំពាក់)៖</b> " + remaining.toLocaleString() + " KHR\n" +
                         "💳 <b>វិធីសាស្ត្របង់៖</b> " + paymentMethod + "\n" +
                         "🧑‍💻 <b>បេឡាអ្នកទទួល៖</b> " + cashierName + "\n" +
                         "📅 <b>កាលបរិច្ឆេទ៖</b> " + dateStr + "\n" +
                         "--------------------------------------------------\n" +
                         "សាលាបឋមសិក្សាសម្តេចព្រះរាជអគ្គមហេសី នរោត្តម មុនីនាថ សីហនុ";
      sendTelegramMessage(telegramText);
      saveReceiptToDrive(searchId, stuName, stuClass, addAmt, paymentMethod, cashierName, "បង់បង្គ្រប់លើកទី២");
      return "ជោគជ័យ៖ បានទទួលប្រាក់បង្គ្រប់លើកទី២ ចំនួន " + addAmt.toLocaleString() + " KHR សម្រាប់សិស្ស " + stuName;
    }
  }
  return "រកមិនឃើញទិន្នន័យសិស្សឡើយ!";
}

function sendTelegramMessage(text) {
  if (TELEGRAM_BOT_TOKEN === "YOUR_BOT_TOKEN_HERE" || TELEGRAM_CHAT_ID === "YOUR_CHAT_ID_HERE") { return; }
  var url = "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage";
  var payload = { "chat_id": TELEGRAM_CHAT_ID, "text": text, "parse_mode": "HTML" };
  var options = { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload), "muteHttpExceptions": true };
  try { UrlFetchApp.fetch(url, options); } catch(e) {}
}

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
      var amount = Number(data[i][4]) || 0;
      var method = String(data[i][5]);
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
  if (user && user.pass === password) { return { success: true, cashierName: user.name }; } 
  else { return { success: false, message: "ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវទេ!" }; }
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
      var amount = Number(data[i][4]) || 0;
      var method = String(data[i][5]);
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
  var totalPaidStudents = 0, totalFemalePaid = 0, totalCollected = 0, totalRemaining = 0;
  var studentMap = {}, paidList = [];
  var headers = studentData[0] || [];
  var idxId = headers.findIndex(h => String(h).includes('កូដ') || String(h).toLowerCase().includes('id')) || 0;
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
    if (paidAmt > 0) {
      totalPaidStudents++; totalCollected += paidAmt;
      if (gender === "ស្រី" || gender.toLowerCase() === "female" || gender === "F" || gender === "f") { totalFemalePaid++; }
    }
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

function saveReceiptToDrive(studentId, studentName, studentClass, amount, method, cashier, phase) {
  try {
    if (!RECEIPT_FOLDER_ID) return null;
    var folder = DriveApp.getFolderById(RECEIPT_FOLDER_ID);
    var dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MM-yyyy HH:mm");
    var fileName = studentId + "_" + studentName + "_" + phase + ".pdf";
    var fullFeeText = "មិនទាន់កំណត់", student = getStudentById(studentId); 
    if (student && student.fullFee) { fullFeeText = Number(student.fullFee).toLocaleString() + " KHR"; }
    var logoUrl = "https://drive.google.com/uc?export=view&id=1oIqI5efkxsTz8sQy_C-BPqZrXar_NbHO"; 

    var html = `<div style="font-family: 'Khmer OS Siemreap', Arial, sans-serif; padding: 40px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;"><img src="${logoUrl}" alt="School Logo" style="width: 80px; height: 80px; margin-bottom: 10px;"><h2 style="color: #1e3a8a; margin: 0; font-size: 22px;">សាលាបឋមសិក្សាសម្តេចព្រះរាជអគ្គមហេសី</h2><p style="color: #64748b; margin: 5px 0 0 0; font-size: 15px;">វិក្កយបត្របង់ប្រាក់ (Official E-Receipt)</p></div>
        <hr style="border: none; border-top: 2px dashed #cbd5e1; margin: 25px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 15px; color: #334155;">
            <tr><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; width: 45%;"><strong>លេខវិក្កយបត្រ៖</strong></td><td style="text-align: right; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a;">${studentId}</td></tr>
            <tr><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><strong>ឈ្មោះសិស្ស៖</strong></td><td style="text-align: right; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #1e3a8a;">${studentName}</td></tr>
            <tr><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><strong>ថ្នាក់រៀន៖</strong></td><td style="text-align: right; border-bottom: 1px solid #f1f5f9;">${studentClass}</td></tr>
            <tr><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><strong>ដំណាក់កាលបង់៖</strong></td><td style="text-align: right; border-bottom: 1px solid #f1f5f9;">${phase}</td></tr>
            <tr><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; background-color: #fbfbfb;"><strong>ថវិកាសរុបក្នុង១ឆ្នាំ៖</strong></td><td style="text-align: right; border-bottom: 1px solid #f1f5f9; background-color: #fbfbfb;">${fullFeeText}</td></tr>
            <tr><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><strong>វិធីសាស្ត្របង់៖</strong></td><td style="text-align: right; border-bottom: 1px solid #f1f5f9;">${method}</td></tr>
            <tr><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><strong>អ្នកទទួលប្រាក់៖</strong></td><td style="text-align: right; border-bottom: 1px solid #f1f5f9;">${cashier}</td></tr>
            <tr><td style="padding: 12px 0;"><strong>កាលបរិច្ឆេទ៖</strong></td><td style="text-align: right;">${dateStr}</td></tr>
        </table>
        <div style="margin-top: 30px; background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; border: 1px solid #e2e8f0;"><p style="margin: 0; font-size: 16px; color: #475569;">ទឹកប្រាក់ទទួលបាន (Amount Paid)</p><h1 style="margin: 10px 0 0 0; color: #059669; font-size: 28px;">${amount.toLocaleString()} KHR</h1></div>
      </div>`;
    var blob = Utilities.newBlob(html, MimeType.HTML).getAs(MimeType.PDF).setName(fileName);
    var file = folder.createFile(blob);
    return file.getUrl();
  } catch (e) { return null; }
}
