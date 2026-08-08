// ==========================================
// ⚙️ ផ្នែកកំណត់រចនាសម្ព័ន្ធ TELEGRAM (សូមប្តូរនៅទីនេះ)
// ==========================================
var TELEGRAM_BOT_TOKEN = "8877919591:AAHy-g0du2GBVJx0sHisVFTIsD32NAd35qA"; 
var TELEGRAM_CHAT_ID = "-1004317236863";     
var RECEIPT_FOLDER_ID = "1nOrIud1_6VP6VuZ6nbflAu56J1K3iJo_"; 

function doGet(e) {
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
  
  // កែសម្រួល៖ កំណត់ Status អោយត្រូវតាមជាក់ស្តែង មិនមែន "Paid" រហូតទេ
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
    fullYearFee = 0;
    actualAmount = 0;
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
      
      if (remainingBalance > 0) {
         sheet.getRange(row, 8).setValue("Pending"); 
      } else {
         sheet.getRange(row, 8).setValue("Paid");
      }
      
      return "បានធ្វើបច្ចុប្បន្នភាពព័ត៌មាន និងទឹកប្រាក់របស់ " + studentName + " រួចរាល់!";
    }
  }
  return "រកមិនឃើញសិស្សដើម្បីកែប្រែឡើយ!";
}

function deleteStudentRow(studentId, cashierName) {
  if (cashierName !== "ហម ម៉ាលីនដា") {
    return { success: false, message: "សុំទោស! អ្នកគ្មានសិទ្ធិលុបទិន្នន័យនេះទេ។" };
  }
  
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
        id: data[i][0],
        name: data[i][1],
        class: data[i][2],
        type: data[i][3],
        amount: Number(data[i][4]) || 0,
        status: data[i][7],
        other: data[i][9],
        gender: data[i][10],
        year: data[i][11] || "",
        fullFee: Number(data[i][12]) || 0,
        remaining: Number(data[i][13]) || 0,
        phone: data[i][14] || ""
      });
    }
    
    if (results.length >= 20) break; 
  }
  return results;
}

function getDashboardData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment");
  var data = sheet.getDataRange().getValues();
  
  var totalPaidStudents = 0;
  var totalFemalePaid = 0;
  var totalRevenue = 0;
  var totalDiscounted = 0;
  var totalExempted = 0;
  var studentsList = [];
  
  for (var i = data.length - 1; i >= 1; i--) {
    var id = data[i][0];
    var name = data[i][1];
    var sClass = data[i][2];
    var type = data[i][3];
    var amount = Number(data[i][4]) || 0;
    var status = data[i][7];
    var other = data[i][9];
    var gender = data[i][10];
    var sYear = data[i][11] || "";
    var fullFee = Number(data[i][12]) || 0;
    var remaining = Number(data[i][13]) || 0;
    var phone = data[i][14] || ""; 
    
    // កែសម្រួល៖ បូកសរុបប្រាក់ចំណូល និងចំនួនសិស្ស ឱ្យតែគាត់បានបង់ប្រាក់ពិតប្រាកដ (amount > 0)
    if (amount > 0) {
      totalPaidStudents++;
      totalRevenue += amount;
      if (gender === "ស្រី" || gender === "Female" || gender === "f" || gender === "F") {
          totalFemalePaid++;
      }
    }
    
    if (other === "សិស្សបញ្ចុះតម្លៃ") {
      totalDiscounted++;
    } else if (other === "សិស្សក្រីក្រ (លើកលែង)" || other === "សិស្សលើកលែង") {
      totalExempted++;
    }
    
    if(studentsList.length < 15) {
      studentsList.push({
        id: id, name: name, gender: gender, class: sClass, type: type, 
        amount: amount, status: status, other: other, year: sYear, 
        fullFee: fullFee, remaining: remaining, phone: phone
      });
    }
  }
  
  return {
    totalPaid: totalPaidStudents,
    totalFemale: totalFemalePaid,
    totalRevenue: totalRevenue.toLocaleString() + " KHR",
    totalDiscounted: totalDiscounted,
    totalExempted: totalExempted,
    students: studentsList
  };
}

function getStudentById(studentId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment");
  var data = sheet.getDataRange().getValues();
  var searchId = String(studentId).trim();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === searchId) {
      return {
        id: data[i][0], 
        name: data[i][1], 
        class: data[i][2], 
        type: data[i][3],
        amount: data[i][4], 
        method: data[i][5],
        status: data[i][7], 
        other: data[i][9], 
        gender: data[i][10],
        year: data[i][11],     
        fullFee: data[i][12],  
        remaining: data[i][13],
        phone: data[i][14] || ""
      };
    }
  }
  return null;
}

function getPendingStudents() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment");
  var data = sheet.getDataRange().getValues();
  var pendingList = [];
  
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][7] === "Pending") { 
      pendingList.push({
        id: data[i][0],
        name: data[i][1],
        class: data[i][2],
        type: data[i][3],
        amount: Number(data[i][4]) || 0,
        fullFee: Number(data[i][12]) || 0,
        remaining: Number(data[i][13]) || 0,
        phone: data[i][14] || ""
      });
    }
  }
  return pendingList;
}

function confirmPayment(studentId, paymentMethod, cashierName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment");
  var historySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Payment_History");
  var data = sheet.getDataRange().getValues();
  var searchId = String(studentId).trim();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === searchId) {
      var row = i + 1; 
      var stuName = data[i][1];
      var stuClass = data[i][2];
      var paymentType = data[i][3]; 
      var amount = Number(data[i][4]) || 0; 
      var fullFee = Number(data[i][12]) || 0;
      
      var remaining = fullFee - amount;
      if (remaining < 0) remaining = 0;
      var status = (remaining > 0) ? "Pending" : "Paid";
      
      sheet.getRange(row, 6).setValue(paymentMethod); 
      sheet.getRange(row, 8).setValue(status);        
      sheet.getRange(row, 9).setValue(cashierName);   
      
      var historyLog = (paymentType === "១ឆ្នាំពេញ") ? "បង់១ឆ្នាំពេញ" : "បង់ឆមាសទី១";
      
      if(historySheet) {
        historySheet.appendRow([searchId, stuName, new Date(), historyLog, amount, paymentMethod, cashierName]);
      }
      
      var dateStr = new Date().toLocaleString('en-GB', { hour12: true });
      var telegramText = "🔔 <b><u>ជូនដំណឹងការបង់ប្រាក់ (លើកទី១)</u></b>\n" +
                         "--------------------------------------------------\n" +
                         "📝 <b>លេខវិក្កយបត្រ៖</b> " + searchId + "\n" +
                         "👤 <b>ឈ្មោះសិស្ស៖</b> " + stuName + "\n" +
                         "🏫 <b>ថ្នាក់រៀន៖</b> " + stuClass + "\n" +
                         "📦 <b>ដំណាក់កាលបង់៖</b> " + historyLog + "\n" +
                         "💰 <b>ទឹកប្រាក់ទទួលបាន៖</b> " + amount.toLocaleString() + " KHR\n" +
                         "💵 <b>ប្រាក់ខ្វះ (ជំពាក់)៖</b> " + remaining.toLocaleString() + " KHR\n" +
                         "💳 <b>វិធីសាស្ត្របង់៖</b> " + paymentMethod + "\n" +
                         "🧑‍💻 <b>បេឡាអ្នកទទួល៖</b> " + cashierName + "\n" +
                         "📅 <b>កាលបរិច្ឆេទ៖</b> " + dateStr + "\n" +
                         "--------------------------------------------------\n" +
                         "សាលាបឋមសិក្សាសម្តេចព្រះរាជអគ្គមហេសី នរោត្តម មុនីនាថ សីហនុ";
      sendTelegramMessage(telegramText);
      
      return "ជោគជ័យ៖ បានបញ្ជាក់ការបង់ប្រាក់សម្រាប់ " + stuName;
    }
  }
  return "រកមិនឃើញលេខកូដសិស្ស!";
}

function collectSecondPayment(studentId, additionalAmount, paymentMethod, cashierName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment");
  var historySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Payment_History");
  var data = sheet.getDataRange().getValues();
  var searchId = String(studentId).trim();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === searchId) {
      var row = i + 1;
      var stuName = data[i][1];
      var stuClass = data[i][2];
      
      var currentAmount = Number(data[i][4]) || 0;
      var addAmt = Number(additionalAmount);
      var newAmount = currentAmount + addAmt; 
      
      // កែសម្រួល៖ ធ្វើការគណនាប្រាក់នៅខ្វះឲ្យបានត្រឹមត្រូវ ជៀសវាងការដាក់លេខ 0 ចូលតែម្តង
      var fullFee = Number(data[i][12]) || 0;
      var remaining = fullFee - newAmount;
      if (remaining < 0) remaining = 0;
      var status = (remaining > 0) ? "Pending" : "Paid";
      
      sheet.getRange(row, 4).setValue("១ឆ្នាំពេញ");         
      sheet.getRange(row, 5).setValue(newAmount);         
      sheet.getRange(row, 6).setValue(paymentMethod);     
      sheet.getRange(row, 9).setValue(cashierName);       
      sheet.getRange(row, 14).setValue(remaining);                
      sheet.getRange(row, 8).setValue(status);
      
      if(historySheet) {
        historySheet.appendRow([searchId, stuName, new Date(), "បង់បង្គ្រប់ (ឆមាសទី២)", addAmt, paymentMethod, cashierName]);
      }
      
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
  if (TELEGRAM_BOT_TOKEN === "YOUR_BOT_TOKEN_HERE" || TELEGRAM_CHAT_ID === "YOUR_CHAT_ID_HERE") {
    return; 
  }
  var url = "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage";
  var payload = {
    "chat_id": TELEGRAM_CHAT_ID,
    "text": text,
    "parse_mode": "HTML"
  };
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch(e) {
    Logger.log("Telegram Error: " + e.message);
  }
}

function getStudentHistoryLog(studentId) {
  var historySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Payment_History");
  if (!historySheet) return []; 
  
  var data = historySheet.getDataRange().getValues();
  var searchId = String(studentId).trim();
  var history = [];
  
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]).trim() === searchId) {
      var rawDate = new Date(data[i][2]);
      var formattedDate = Utilities.formatDate(rawDate, Session.getScriptTimeZone(), "dd/MM/yyyy hh:mm a");
      
      history.push({
        date: formattedDate,
        phase: data[i][3],       
        amount: Number(data[i][4]) || 0, 
        method: data[i][5],      
        cashier: data[i][6]      
      });
    }
  }
  return history;
}

function getDailyClosingReport() {
  var historySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Payment_History");
  if (!historySheet) return null;
  
  var data = historySheet.getDataRange().getValues();
  var today = new Date();
  var todayStr = Utilities.formatDate(today, Session.getScriptTimeZone(), "dd/MM/yyyy");
  
  var report = {
    date: todayStr,
    totalTx: 0,
    cashTotal: 0,
    qrTotal: 0,
    exemptTotal: 0,
    grandTotal: 0,
    details: []
  };
  
  for (var i = 1; i < data.length; i++) {
    if (!data[i][2]) continue; 
    
    var rowDate = new Date(data[i][2]);
    var rowDateStr = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "dd/MM/yyyy");
    
    if (rowDateStr === todayStr) {
      var amount = Number(data[i][4]) || 0;
      var method = String(data[i][5]);
      var cashier = String(data[i][6]);
      
      report.totalTx++;
      report.grandTotal += amount;
      
      if (method.indexOf("Cash") !== -1 || method.indexOf("សាច់ប្រាក់") !== -1) {
        report.cashTotal += amount;
      } else if (method.indexOf("KHQR") !== -1 || method.indexOf("ស្កែន") !== -1) {
        report.qrTotal += amount;
      } else {
        report.exemptTotal += amount;
      }
      
      report.details.push({
        id: data[i][0],
        name: data[i][1],
        phase: data[i][3],
        amount: amount,
        method: method,
        cashier: cashier
      });
    }
  }
  return report;
}

function verifyLogin(username, password) {
  var users = {
    "malinda": { pass: "123456", name: "ហម ម៉ាលីនដា" },
    "admin": { pass: "admin123", name: "នាយកសាលា" }
  };
  
  var user = users[username.toLowerCase()];
  
  if (user && user.pass === password) {
    return { success: true, cashierName: user.name };
  } else {
    return { success: false, message: "ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវទេ!" };
  }
}

function getTeacherDashboardData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var studentSheet = ss.getSheetByName("Students_Payment") || ss.getSheets()[0];
  var historySheet = ss.getSheetByName("Payment_History");
  
  var studentData = studentSheet ? studentSheet.getDataRange().getValues() : [];
  var historyData = historySheet ? historySheet.getDataRange().getValues() : [];
  
  var totalPaidStudents = 0;
  var totalFemalePaid = 0;
  var totalCollected = 0;
  var totalRemaining = 0;
  var studentMap = {};
  var paidList = [];
  
  var headers = studentData[0] || [];
  var idxId = headers.findIndex(h => String(h).includes('កូដ') || String(h).toLowerCase().includes('id')) || 0;
  var idxGender = headers.findIndex(h => String(h).includes('ភេទ') || String(h).toLowerCase().includes('gender')) || 2;
  var idxClass = headers.findIndex(h => String(h).includes('ថ្នាក់') || String(h).toLowerCase().includes('class')) || 3;
  var idxFullFee = headers.findIndex(h => String(h).includes('សរុប') || String(h).toLowerCase().includes('fee')) || 4;
  var idxAmount = headers.findIndex(h => String(h).includes('បង់រួច') || String(h).toLowerCase().includes('amount')) || 5;
  
  if(idxId === -1) idxId = 0; if(idxGender === -1) idxGender = 2; if(idxClass === -1) idxClass = 3;
  if(idxFullFee === -1) idxFullFee = 4; if(idxAmount === -1) idxAmount = 5;

  for (var i = 1; i < studentData.length; i++) {
    var id = String(studentData[i][idxId]).trim();
    if (!id) continue;
    
    var gender = String(studentData[i][idxGender]).trim();
    var className = String(studentData[i][idxClass]).trim();
    var fullFee = Number(studentData[i][idxFullFee]) || 0;
    var paidAmt = Number(studentData[i][idxAmount]) || 0;
    var rem = fullFee - paidAmt;
    if (rem < 0) rem = 0;
    
    if (paidAmt > 0) {
      totalPaidStudents++;
      if (gender === "ស្រី" || gender.toLowerCase() === "female" || gender === "F" || gender === "f") {
        totalFemalePaid++;
      }
      totalCollected += paidAmt;
    }
    totalRemaining += rem;
    
    studentMap[id] = { className: className };
  }
  
  if (historyData.length > 1) {
    var count = 0;
    for (var j = historyData.length - 1; j >= 1; j--) {
      var sId = String(historyData[j][0]).trim();
      var sName = String(historyData[j][1]).trim();
      var pDate = historyData[j][2];
      var pPhase = historyData[j][3];
      var pAmt = Number(historyData[j][4]) || 0;
      
      if (!sId) continue;
      
      var dateStr = "";
      if (pDate instanceof Date) {
        dateStr = Utilities.formatDate(pDate, Session.getScriptTimeZone(), "dd/MM/yyyy");
      } else {
        dateStr = String(pDate).split(" ")[0] || String(pDate);
      }
      
      var stuInfo = studentMap[sId] || { className: "មិនច្បាស់" };
      
      paidList.push({
        id: sId,
        name: sName,
        className: stuInfo.className,
        amount: pAmt,
        date: dateStr,
        phase: pPhase
      });
      
      count++;
      if (count >= 25) break; 
    }
  }
  
  return {
    totalPaidStudents: totalPaidStudents,
    totalFemalePaid: totalFemalePaid,
    totalCollected: totalCollected,
    totalRemaining: totalRemaining,
    paidList: paidList
  };
}

function getPendingSecondPaymentReport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var studentSheet = ss.getSheetByName("Students_Payment") || ss.getSheets()[0];
  var historySheet = ss.getSheetByName("Payment_History");
  
  var data = studentSheet.getDataRange().getValues();
  var historyData = historySheet ? historySheet.getDataRange().getValues() : [];
  
  var lastPaymentInfo = {};
  for (var h = 1; h < historyData.length; h++) {
    var sId = String(historyData[h][0]).trim();
    var pDate = historyData[h][2];
    var pMethod = String(historyData[h][5]).trim();
    
    var dateStr = "មិនទាន់មាន";
    if (pDate) {
      if (pDate instanceof Date) {
        dateStr = Utilities.formatDate(pDate, Session.getScriptTimeZone(), "dd/MM/yyyy");
      } else {
        dateStr = String(pDate).split(" ")[0];
      }
    }
    
    lastPaymentInfo[sId] = {
      date: dateStr,
      method: pMethod || "-"
    };
  }
  
  var headers = data[0];
  var idxId = headers.findIndex(h => String(h).includes('កូដ') || String(h).toLowerCase().includes('id'));
  var idxName = headers.findIndex(h => String(h).includes('ឈ្មោះ') || String(h).toLowerCase().includes('name'));
  var idxGender = headers.findIndex(h => String(h).includes('ភេទ') || String(h).toLowerCase().includes('gender'));
  var idxClass = headers.findIndex(h => String(h).includes('ថ្នាក់') || String(h).toLowerCase().includes('class'));
  var idxFullFee = headers.findIndex(h => String(h).includes('សរុប') || String(h).toLowerCase().includes('fee'));
  var idxAmount = headers.findIndex(h => String(h).includes('បង់រួច') || String(h).toLowerCase().includes('amount'));
  
  var classesGroup = {};
  var grandTotalRemaining = 0;
  var grandTotalStudents = 0;
  
  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][idxId]).trim();
    if (!id) continue;
    
    var name = String(data[i][idxName]).trim();
    var gender = String(data[i][idxGender]).trim();
    var className = String(data[i][idxClass]).trim() || "មិនទាន់កំណត់ថ្នាក់";
    var fullFee = Number(data[i][idxFullFee]) || 0;
    var paidAmt = Number(data[i][idxAmount]) || 0;
    var remaining = fullFee - paidAmt;
    
    if (remaining > 0) {
      if (!classesGroup[className]) {
        classesGroup[className] = {
          students: [],
          classRemainingTotal: 0
        };
      }
      
      var payInfo = lastPaymentInfo[id] || { date: "មិនទាន់មាន", method: "-" };
      
      classesGroup[className].students.push({
        id: id,
        name: name,
        gender: gender,
        fullFee: fullFee,
        paidAmt: paidAmt,
        remaining: remaining,
        lastPayDate: payInfo.date,
        lastPayMethod: payInfo.method
      });
      
      classesGroup[className].classRemainingTotal += remaining;
      grandTotalRemaining += remaining;
      grandTotalStudents++;
    }
  }
  
  return {
    classes: classesGroup,
    grandTotalRemaining: grandTotalRemaining,
    grandTotalStudents: grandTotalStudents,
    dateGenerated: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy")
  };
}

function generateNextStudentId() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Students_Payment") || ss.getSheets()[0];
  
  var lastRow = Math.max(sheet.getLastRow(), 2);
  var data = sheet.getRange("A2:A" + lastRow).getValues();
  
  var maxNumber = 0;
  
  for (var i = 0; i < data.length; i++) {
    var currentId = String(data[i][0]).trim();
    if (currentId.indexOf("AKKNGS-") === 0) {
      var numStr = currentId.replace("AKKNGS-", "");
      var num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }
  var nextNumber = maxNumber + 1;
  var nextNumberStr = nextNumber.toString();
  while (nextNumberStr.length < 6) { nextNumberStr = "0" + nextNumberStr; }
  return "AKKNGS-" + nextNumberStr;
}

function saveNewStudent(studentData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Students_Payment");
  var newStudentId = generateNextStudentId();
  var rowData = [
    newStudentId,                   
    studentData.name,               
    studentData.className,          
    studentData.paymentType,        
    Number(studentData.amount),     
    studentData.paymentMethod || "មិនទាន់បង់", 
    new Date(),                     
    "Pending",                      
    studentData.cashier || "",      
    studentData.other || "",        
    studentData.gender,
    "", "", "", studentData.phone || "" 
  ];
  sheet.appendRow(rowData);
  return newStudentId; 
}

function getClassMonitoringData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Students_Payment") || ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idxId = 0, idxName = 1, idxClass = 2, idxAmount = 4, idxDate = 6, idxStatus = 7, idxGender = 10;
  var idxFullFee = headers.findIndex(h => String(h).includes('សរុប') || String(h).toLowerCase().includes('fee'));
  if (idxFullFee === -1) idxFullFee = 4; 
  
  var classGroups = {};
  
  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][idxId]).trim();
    if (!id) continue;
    
    var name = String(data[i][idxName]).trim();
    var className = String(data[i][idxClass]).trim() || "មិនកំណត់";
    var status = String(data[i][idxStatus]).trim();
    var gender = String(data[i][idxGender]).trim();
    
    var paidAmt = Number(data[i][idxAmount]) || 0;
    var fullFee = Number(data[i][idxFullFee]) || paidAmt;
    var remaining = fullFee - paidAmt;
    if (remaining < 0) remaining = 0;
    
    var rawDate = data[i][idxDate];
    var dateStr = "-";
    if (rawDate) {
      if (rawDate instanceof Date) {
        dateStr = Utilities.formatDate(rawDate, Session.getScriptTimeZone(), "dd/MM/yyyy");
      } else {
        dateStr = String(rawDate).split(" ")[0];
      }
    }
    
    if (!classGroups[className]) { classGroups[className] = []; }
    classGroups[className].push({ name: name, gender: gender, status: status, fullFee: fullFee, paidAmt: paidAmt, remaining: remaining, date: dateStr });
  }
  
  return classGroups;
}

function getMonthlyClosingReport() {
  var historySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Payment_History");
  if (!historySheet) return null;
  
  var data = historySheet.getDataRange().getValues();
  var today = new Date();
  var currentMonth = today.getMonth(); 
  var currentYear = today.getFullYear(); 
  
  var monthNames = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
  
  var report = {
    monthStr: monthNames[currentMonth] + " ឆ្នាំ " + currentYear,
    totalTx: 0,
    cashTotal: 0,
    qrTotal: 0,
    grandTotal: 0,
    details: []
  };
  
  for (var i = 1; i < data.length; i++) {
    if (!data[i][2]) continue; 
    
    var rowDate = new Date(data[i][2]);
    if (rowDate.getMonth() === currentMonth && rowDate.getFullYear() === currentYear) {
      var amount = Number(data[i][4]) || 0;
      var method = String(data[i][5]);
      
      report.totalTx++;
      report.grandTotal += amount;
      
      if (method.indexOf("Cash") !== -1 || method.indexOf("សាច់ប្រាក់") !== -1) {
        report.cashTotal += amount;
      } else if (method.indexOf("KHQR") !== -1 || method.indexOf("ស្កែន") !== -1) {
        report.qrTotal += amount;
      }
      
      report.details.push({
        date: Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "dd/MM/yyyy"),
        id: data[i][0],
        name: data[i][1],
        phase: data[i][3],
        amount: amount,
        method: method
      });
    }
  }
  return report;
}

function getSemester2PendingData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Students_Payment") || ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  
  var validData = [];
  var totalAmount = 0;
  var totalFemale = 0;
  
  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][0]).trim();        
    if (!id) continue;
    
    var name = String(data[i][1]).trim();      
    var className = String(data[i][2]).trim(); 
    var paidAmt = Number(data[i][4]) || 0;     
    var gender = String(data[i][10]).trim();   
    var fullFee = Number(data[i][12]) || 0;    
    var remaining = Number(data[i][13]) || 0;  
    var phone = String(data[i][14]).trim();    
    
    if (remaining > 0) {
      totalAmount += remaining;
      
      if (gender === 'ស្រី' || gender.toLowerCase() === 'female' || gender.toLowerCase() === 'f') {
        totalFemale++;
      }
      
      if (phone !== "" && !phone.startsWith("0") && !isNaN(phone)) {
        phone = "0" + phone;
      }
      
      validData.push({
        id: id,
        name: name,
        gender: gender,
        className: className,
        fullFee: fullFee,
        paidAmt: paidAmt,
        remaining: remaining,
        phone: phone || "មិនមាន"
      });
    }
  }
  
  validData.sort(function(a, b) {
    if (a.className < b.className) return -1;
    if (a.className > b.className) return 1;
    return 0;
  });
  
  return {
    data: validData,
    totalAmount: totalAmount,
    totalStudents: validData.length,
    totalFemale: totalFemale
  };
}

function getAppUrl() {
  return ScriptApp.getService().getUrl();
}

function saveReceiptToDrive(studentId, studentName, studentClass, amount, method, cashier, phase) {
  try {
    if (!RECEIPT_FOLDER_ID) return null;
    
    var folder = DriveApp.getFolderById(RECEIPT_FOLDER_ID);
    var dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MM-yyyy HH:mm");
    
    var fileName = studentId + "_" + studentName + "_" + phase + ".pdf";

    var fullFeeText = "មិនទាន់កំណត់";
    var student = getStudentById(studentId); 
    if (student && student.fullFee) {
       fullFeeText = Number(student.fullFee).toLocaleString() + " KHR";
    }

    var logoUrl = "https://drive.google.com/uc?export=view&id=1oIqI5efkxsTz8sQy_C-BPqZrXar_NbHO"; 

    var html = `
      <div style="font-family: 'Khmer OS Siemreap', Arial, sans-serif; padding: 40px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto; background: #ffffff;">
        
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoUrl}" alt="School Logo" style="width: 80px; height: 80px; margin-bottom: 10px;">
            <h2 style="color: #1e3a8a; margin: 0; font-size: 22px;">សាលាបឋមសិក្សាសម្តេចព្រះរាជអគ្គមហេសី</h2>
            <p style="color: #64748b; margin: 5px 0 0 0; font-size: 15px;">វិក្កយបត្របង់ប្រាក់ (Official E-Receipt)</p>
        </div>

        <hr style="border: none; border-top: 2px dashed #cbd5e1; margin: 25px 0;">

        <table style="width: 100%; border-collapse: collapse; font-size: 15px; color: #334155;">
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; width: 45%;"><strong>លេខវិក្កយបត្រ៖</strong></td>
                <td style="text-align: right; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a;">${studentId}</td>
            </tr>
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><strong>ឈ្មោះសិស្ស៖</strong></td>
                <td style="text-align: right; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #1e3a8a;">${studentName}</td>
            </tr>
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><strong>ថ្នាក់រៀន៖</strong></td>
                <td style="text-align: right; border-bottom: 1px solid #f1f5f9;">${studentClass}</td>
            </tr>
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><strong>ដំណាក់កាលបង់៖</strong></td>
                <td style="text-align: right; border-bottom: 1px solid #f1f5f9;">${phase}</td>
            </tr>
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; background-color: #fbfbfb;"><strong>ថវិកាសរុបក្នុង១ឆ្នាំ៖</strong></td>
                <td style="text-align: right; border-bottom: 1px solid #f1f5f9; background-color: #fbfbfb;">${fullFeeText}</td>
            </tr>
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><strong>វិធីសាស្ត្របង់៖</strong></td>
                <td style="text-align: right; border-bottom: 1px solid #f1f5f9;">${method}</td>
            </tr>
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><strong>អ្នកទទួលប្រាក់៖</strong></td>
                <td style="text-align: right; border-bottom: 1px solid #f1f5f9;">${cashier}</td>
            </tr>
            <tr>
                <td style="padding: 12px 0;"><strong>កាលបរិច្ឆេទ៖</strong></td>
                <td style="text-align: right;">${dateStr}</td>
            </tr>
        </table>

        <div style="margin-top: 30px; background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 16px; color: #475569;">ទឹកប្រាក់ទទួលបាន (Amount Paid)</p>
            <h1 style="margin: 10px 0 0 0; color: #059669; font-size: 28px;">${amount.toLocaleString()} KHR</h1>
        </div>

        <div style="margin-top: 30px; text-align: center; color: #94a3b8; font-size: 12px;">
            <p>សូមអរគុណ! ឯកសារនេះត្រូវបានបង្កើតដោយប្រព័ន្ធស្វ័យប្រវត្តិ។</p>
        </div>
      </div>
    `;

    var blob = Utilities.newBlob(html, MimeType.HTML).getAs(MimeType.PDF).setName(fileName);
    var file = folder.createFile(blob);
    
    return file.getUrl();
  } catch (e) {
    Logger.log("Error saving PDF: " + e.message);
    return null;
  }
}

function authorizeDrive() {
  var folder = DriveApp.getFolderById(RECEIPT_FOLDER_ID);
  Logger.log("បានភ្ជាប់ទៅកាន់ Folder៖ " + folder.getName());
}

function testCreatePDF() {
  try {
    var folderId = "1nOrIud1_6VP6VuZ6nbflAu56J1K3iJo_";
    var folder = DriveApp.getFolderById(folderId);
    
    var html = "<div style='text-align:center; padding:20px;'><h1>សាកល្បងបង្កើត PDF</h1><p>នេះគឺជាការធ្វើតេស្តប្រព័ន្ធរក្សាទុកឯកសារ។</p></div>";
    
    var blob = Utilities.newBlob(html, MimeType.HTML).getAs(MimeType.PDF).setName("Test_Receipt.pdf");
    var file = folder.createFile(blob);
    
    Logger.log("✅ ជោគជ័យ! ឯកសារត្រូវបានបង្កើត។ តំណភ្ជាប់៖ " + file.getUrl());
  } catch (e) {
    Logger.log("❌ កំហុស (Error): " + e.message);
  }
}

function forceDriveScope() {
  DriveApp.createFile("AuthTest.txt", "សាកល្បងសិទ្ធិ", MimeType.PLAIN_TEXT);
}
