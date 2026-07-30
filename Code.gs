// ==========================================
// ⚙️ ផ្នែកកំណត់រចនាសម្ព័ន្ធ TELEGRAM (សូមប្តូរនៅទីនេះ)
// ==========================================
var TELEGRAM_BOT_TOKEN = "8877919591:AAHy-g0du2GBVJx0sHisVFTIsD32NAd35qA"; // សូមយក Token ពី @BotFather មកដាក់ជំនួសទីនេះ
var TELEGRAM_CHAT_ID = "-1004317236863";     // សូមយក Chat ID នៃ Group មកដាក់ជំនួសទីនេះ (ឧ. -10023456789)
function doGet(e) {
  var page = e.parameter.page;
  
  if (page === 'cashier') {
    return HtmlService.createHtmlOutputFromFile('Cashier')
      .setTitle('តុបេឡា (Cashier) - សាលាបឋមសិក្សាសម្តេចព្រះរាជអគ្គមហេសី')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } else if (page === 'teacher') {
    return HtmlService.createHtmlOutputFromFile('Teacher')
      .setTitle('ប្រព័ន្ធគ្រូបង្រៀន (Teacher) - ពិនិត្យការបង់ប្រាក់')
      // 👇 បន្ទាត់នេះហើយដែលបញ្ជាឱ្យ App រីកពេញអេក្រង់ទូរសព្ទ 100% យ៉ាងស្រស់ស្អាត!
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } else if (page === 'reminder') {
    return HtmlService.createHtmlOutputFromFile('Reminder')
      .setTitle('របាយការណ៍សិស្សជំពាក់ប្រាក់ឆមាសទី២')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } else {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('ផ្ទាំងគ្រប់គ្រងរដ្ឋបាល (Admin Dashboard)')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

// តុទី១ (ច្របាច់បញ្ចូលគ្នា)៖ បញ្ចូលទិន្នន័យសិស្ស និងទទួលប្រាក់តែម្តង
function addNewStudent(studentName, gender, studentClass, paymentType, amount, otherNote, schoolYear, fullYearFeeInput, paymentMethod, cashierName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Students_Payment");
  var historySheet = ss.getSheetByName("Payment_History");
  
  var studentId = generateNextStudentId();
  var dateCreated = new Date();
  
  var actualAmount = Number(amount);
  var fullYearFee = Number(fullYearFeeInput);
  
  // កំណត់លក្ខខណ្ឌលើកលែង
  if (otherNote === "សិស្សក្រីក្រ (លើកលែង)" || otherNote === "សិស្សលើកលែង") {
    fullYearFee = 0;
    actualAmount = 0;
    paymentMethod = "លើកលែង (Exempted)";
  }
  
  var remainingBalance = fullYearFee - actualAmount;
  if (remainingBalance < 0) remainingBalance = 0;
  
  // ១. បញ្ចូលទិន្នន័យសិស្ស និងកំណត់ Status ថា "Paid" តែម្តង
  sheet.appendRow([
    studentId, studentName, studentClass, paymentType, actualAmount, 
    paymentMethod, dateCreated, "Paid", cashierName, otherNote, gender, schoolYear, fullYearFee, remainingBalance
  ]);
  
  // ២. កត់ត្រាចូល Payment_History
  var historyLog = (paymentType === "១ឆ្នាំពេញ") ? "បង់១ឆ្នាំពេញ" : "បង់ឆមាសទី១";
  if (historySheet) {
    historySheet.appendRow([studentId, studentName, dateCreated, historyLog, actualAmount, paymentMethod, cashierName]);
  }
  
  // ៣. បញ្ជូនសារទៅកាន់ Telegram Group
  var dateStr = Utilities.formatDate(dateCreated, Session.getScriptTimeZone(), "dd/MM/yyyy hh:mm a");
  var telegramText = "🔔 <b><u>ជូនដំណឹងការចុះឈ្មោះ និងបង់ប្រាក់</u></b>\n" +
                     "--------------------------------------------------\n" +
                     "📝 <b>លេខវិក្កយបត្រ៖</b> " + studentId + "\n" +
                     "👤 <b>ឈ្មោះសិស្ស៖</b> " + studentName + "\n" +
                     "🏫 <b>ថ្នាក់រៀន៖</b> " + studentClass + "\n" +
                     "📦 <b>ដំណាក់កាលបង់៖</b> " + historyLog + "\n" +
                     "💰 <b>ទឹកប្រាក់ទទួលបាន៖</b> " + actualAmount.toLocaleString() + " KHR\n" +
                     "💵 <b>ប្រាក់ខ្វះ (ជំពាក់)៖</b> " + remainingBalance.toLocaleString() + " KHR\n" +
                     "💳 <b>វិធីសាស្ត្របង់៖</b> " + paymentMethod + "\n" +
                     "🧑‍💻 <b>បេឡាអ្នកទទួល៖</b> " + cashierName + "\n" +
                     "📅 <b>កាលបរិច្ឆេទ៖</b> " + dateStr + "\n" +
                     "--------------------------------------------------\n" +
                     "សាលាបឋមសិក្សាសម្តេចព្រះរាជអគ្គមហេសី នរោត្តម មុនីនាថ សីហនុ";
  sendTelegramMessage(telegramText);
  
  return studentId;
}

function updateDashboard() {
        document.getElementById('searchInput').value = "";
        document.getElementById('studentTableBody').innerHTML = `<tr><td colspan="9" class="p-4 text-center text-gray-400">កំពុងទាញយកទិន្នន័យ...</td></tr>`;
        
        google.script.run
          .withSuccessHandler(function(stats) {
            // 🔴 បង្ហាញសារពណ៌ក្រហម ប្រសិនបើ Server មានបញ្ហា
            if (stats && stats.error) {
               document.getElementById('studentTableBody').innerHTML = `<tr><td colspan="9" class="p-4 text-center text-red-500 font-bold">កំហុសទិន្នន័យ៖ ${stats.error}</td></tr>`;
               return;
            }
            if (!stats) return;

            document.getElementById('cardTotalPaid').innerText = stats.totalPaid + " នាក់";
            document.getElementById('cardTotalFemale').innerText = stats.totalFemale + " នាក់";
            document.getElementById('cardTotalDiscounted').innerText = stats.totalDiscounted + " នាក់";
            document.getElementById('cardTotalExempted').innerText = stats.totalExempted + " នាក់";
            document.getElementById('cardRevenue').innerText = stats.totalRevenue;
            
            allStudentsCache = stats.students;
            renderTableRows(stats.students);
          })
          .withFailureHandler(function(error) {
            // 🔴 ចាប់កំហុសផ្សេងៗទៀតរបស់ប្រព័ន្ធ
            document.getElementById('studentTableBody').innerHTML = `<tr><td colspan="9" class="p-4 text-center text-red-500 font-bold">កំហុសប្រព័ន្ធ៖ ${error.message}</td></tr>`;
          })
          .getDashboardData();
      }


// តុទី១៖ ធ្វើបច្ចុប្បន្នភាពទិន្នន័យសិស្ស (Edit)
// តុទី១៖ ធ្វើបច្ចុប្បន្នភាពទិន្នន័យសិស្ស និងទឹកប្រាក់ (Edit)
function updateStudentInfo(studentId, studentName, gender, studentClass, schoolYear, paymentType, otherNote, fullYearFeeInput, amountInput) {
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
      sheet.getRange(row, 2).setValue(studentName);       // ឈ្មោះ
      sheet.getRange(row, 3).setValue(studentClass);      // ថ្នាក់
      sheet.getRange(row, 4).setValue(paymentType);       // ប្រភេទបង់
      sheet.getRange(row, 5).setValue(actualAmount);      // ទឹកប្រាក់បានបង់
      sheet.getRange(row, 10).setValue(otherNote);        // លក្ខខណ្ឌផ្សេងៗ
      sheet.getRange(row, 11).setValue(gender);           // ភេទ
      sheet.getRange(row, 12).setValue(schoolYear);       // ឆ្នាំសិក្សា
      sheet.getRange(row, 13).setValue(fullYearFee);      // តម្លៃពេញ
      sheet.getRange(row, 14).setValue(remainingBalance); // ប្រាក់ខ្វះ
      
      // បើលុយខ្វះ > 0 យើងប្តូរ Status ទៅជារង់ចាំបង់ប្រាក់វិញ បើគ្មានជំពាក់ទេ ដាក់ Paid
      if (remainingBalance > 0) {
         sheet.getRange(row, 8).setValue("Pending"); // ឬអាចដាក់ថា "ជំពាក់" ក៏បាន
      } else {
         sheet.getRange(row, 8).setValue("Paid");
      }
      
      return "បានធ្វើបច្ចុប្បន្នភាពព័ត៌មាន និងទឹកប្រាក់របស់ " + studentName + " រួចរាល់!";
    }
  }
  return "រកមិនឃើញសិស្សដើម្បីកែប្រែឡើយ!";
}

// ទាញយកស្ថិតិសម្រាប់ Cards
// ទាញយកស្ថិតិសម្រាប់ Cards (មានប្រព័ន្ធការពារ Ghost Rows មិនឱ្យគាំង)
function getDashboardData() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment");
    if (!sheet) return null;
    
    var data = sheet.getDataRange().getValues();
    
    var totalPaidStudents = 0;
    var totalFemalePaid = 0;
    var totalRevenue = 0;
    var totalDiscounted = 0;
    var totalExempted = 0;
    var studentsList = [];
    
    // រត់ស្វែងរកទិន្នន័យពីក្រោមឡើងលើ
    for (var i = data.length - 1; i >= 1; i--) {
      var id = String(data[i][0] || "").trim();
      
      // 🔴 ចំណុចសំខាន់៖ បើជួរនោះគ្មានលេខកូដសិស្សទេ វាបោះបង់ (Skip) មិនយកមកគណនាឡើយ
      if (!id) continue; 
      
      var name = String(data[i][1] || "");
      var sClass = String(data[i][2] || "");
      var type = String(data[i][3] || "");
      var amount = Number(data[i][4]) || 0;
      var status = String(data[i][7] || "");
      var other = String(data[i][9] || "");
      var gender = String(data[i][10] || ""); 
      var sYear = String(data[i][11] || "");
      var fullFee = Number(data[i][12]) || 0;
      var remaining = Number(data[i][13]) || 0;
      
      if (status === "Paid" || status === "បានបង់") {
        totalPaidStudents++;
        totalRevenue += amount;
        if (gender === "ស្រី") totalFemalePaid++;
      }
      
      if (other.indexOf("បញ្ចុះតម្លៃ") !== -1) {
        totalDiscounted++;
      } else if (other.indexOf("ក្រីក្រ") !== -1 || other.indexOf("លើកលែង") !== -1) {
        totalExempted++;
      }
      
      if(studentsList.length < 15) {
        studentsList.push({
          id: id, name: name, gender: gender, class: sClass, type: type, 
          amount: amount, status: status, other: other, year: sYear, 
          fullFee: fullFee, remaining: remaining
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
  } catch(e) {
    return { error: e.toString() }; // បញ្ជូនកំហុសទៅប្រាប់ Dashboard បើមានបញ្ហា
  }
}

// តុទី២៖ ស្វែងរកទិន្នន័យសិស្សតាម ID
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
        remaining: data[i][13] 
      };
    }
  }
  return null;
}

// អនុគមន៍ថ្មី៖ ទាញយកបញ្ជីសិស្ស Pending សម្រាប់តុបេឡា
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
        remaining: Number(data[i][13]) || 0
      });
    }
  }
  return pendingList;
}

// តុទី២៖ Confirm ការបង់ប្រាក់លើកទី១ + លោត Alert ចូល Telegram
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
      
      sheet.getRange(row, 6).setValue(paymentMethod); 
      sheet.getRange(row, 8).setValue("Paid");        
      sheet.getRange(row, 9).setValue(cashierName);   
      
      var historyLog = (paymentType === "១ឆ្នាំពេញ") ? "បង់១ឆ្នាំពេញ" : "បង់ឆមាសទី១";
      
      if(historySheet) {
        historySheet.appendRow([searchId, stuName, new Date(), historyLog, amount, paymentMethod, cashierName]);
      }
      
      // 🚀 បញ្ជូនសារទៅកាន់ Telegram Group
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

// តុទី២៖ Confirm ការបង់ប្រាក់បង្គ្រប់លើកទី២ + លោត Alert ចូល Telegram
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
      
      sheet.getRange(row, 4).setValue("១ឆ្នាំពេញ");         
      sheet.getRange(row, 5).setValue(newAmount);         
      sheet.getRange(row, 6).setValue(paymentMethod);     
      sheet.getRange(row, 9).setValue(cashierName);       
      sheet.getRange(row, 14).setValue(0);                
      
      if(historySheet) {
        historySheet.appendRow([searchId, stuName, new Date(), "បង់បង្គ្រប់ (ឆមាសទី២)", addAmt, paymentMethod, cashierName]);
      }
      
      // 🚀 បញ្ជូនសារទៅកាន់ Telegram Group
      var dateStr = new Date().toLocaleString('en-GB', { hour12: true });
      var telegramText = "🔥 <b><u>ជូនដំណឹងការបង់ប្រាក់បង្គ្រប់ (លើកទី២)</u></b>\n" +
                         "--------------------------------------------------\n" +
                         "📝 <b>លេខវិក្កយបត្រ៖</b> " + searchId + "\n" +
                         "👤 <b>ឈ្មោះសិស្ស៖</b> " + stuName + "\n" +
                         "🏫 <b>ថ្នាក់រៀន៖</b> " + stuClass + "\n" +
                         "📦 <b>ដំណាក់កាលបង់៖</b> បង់បង្គ្រប់ (ឆមាសទី២) ✅\n" +
                         "💵 <b>ទឹកប្រាក់បង់បន្ថែម៖</b> " + addAmt.toLocaleString() + " KHR\n" +
                         "💰 <b>សរុបបានបង់ពេញ១ឆ្នាំ៖</b> " + newAmount.toLocaleString() + " KHR\n" +
                         "💵 <b>ប្រាក់ខ្វះ (ជំពាក់)៖</b> 0 KHR (បង់ដាច់)\n" +
                         "💳 <b>វិធីសាស្ត្របង់៖</b> " + paymentMethod + "\n" +
                         "🧑‍💻 <b>បេឡាអ្នកទទួល៖</b> " + cashierName + "\n" +
                         "📅 <b>កាលបរិច្ឆេទ៖</b> " + dateStr + "\n" +
                         "--------------------------------------------------\n" +
                         "សាលាបឋមសិក្សាសម្តេចព្រះរាជអគ្គមហេសី នរោត្តម មុនីនាថ សីហនុ";
      sendTelegramMessage(telegramText);
      
      return "ជោគជ័យ៖ បានទទួលប្រាក់បង្គ្រប់លើកទី២ ចំនួន " + addAmt.toLocaleString() + " KHR សម្រាប់សិស្ស " + stuName;
    }
  }
  return "រកមិនឃើញទិន្នន័យសិស្សឡើយ!";
}

// 🌐 អនុគមន៍ជំនួយ៖ សម្រាប់បាញ់កូដភ្ជាប់ទៅ Telegram API តាមរយះអ៊ីនធឺណិត
function sendTelegramMessage(text) {
  if (TELEGRAM_BOT_TOKEN === "YOUR_BOT_TOKEN_HERE" || TELEGRAM_CHAT_ID === "YOUR_CHAT_ID_HERE") {
    return; // បង្ការកំហុស បើមិនទាន់ដូរលេខកូដ មិនឱ្យដំណើរការឡើយ
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


// មុខងារសម្រាប់តេស្តរកកំហុស Telegram 
function testTelegramBot() {
  var url = "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage";
  var payload = {
    "chat_id": TELEGRAM_CHAT_ID,
    "text": "🔔 នេះគឺជាសារសាកល្បងពីប្រព័ន្ធគ្រប់គ្រងការបង់ប្រាក់សាលារៀន!"
  };
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  
  var response = UrlFetchApp.fetch(url, options);
  Logger.log("លទ្ធផលពី Telegram: " + response.getContentText());
}


// អនុគមន៍ថ្មី៖ ទាញយកប្រវត្តិបង់ប្រាក់លម្អិតរបស់សិស្សម្នាក់ៗ
function getStudentHistoryLog(studentId) {
  var historySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Payment_History");
  if (!historySheet) return []; 
  
  var data = historySheet.getDataRange().getValues();
  var searchId = String(studentId).trim();
  var history = [];
  
  // រត់ស្វែងរកទិន្នន័យពីក្រោមឡើងលើ (យកថ្មីៗមកបង្ហាញមុន)
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]).trim() === searchId) {
      // បំប្លែងកាលបរិច្ឆេទឱ្យងាយស្រួលមើល
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


// អនុគមន៍ថ្មី៖ ទាញយកទិន្នន័យសម្រាប់បិទបញ្ជីប្រចាំថ្ងៃ (Daily Closing Report)
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
  
  // រត់ស្វែងរកទិន្នន័យពីលើចុះក្រោម យកតែថ្ងៃនេះ
  for (var i = 1; i < data.length; i++) {
    if (!data[i][2]) continue; // រំលងជួរទទេ
    
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

// អនុគមន៍ផ្ទៀងផ្ទាត់ការ Login (ជម្រើសទី១)
// =====================================================================
// 🔒 ១. អនុគមន៍ផ្ទៀងផ្ទាត់ការ Login ថ្មី (ទាញពី Sheet "Admin_Users")
// =====================================================================
function verifyLogin(username, password) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Admin_Users");
  
  if (!sheet) {
    return { success: false, message: "មិនទាន់មាន Sheet 'Admin_Users' សម្រាប់ផ្ទៀងផ្ទាត់ទេ!" };
  }
  
  var data = sheet.getDataRange().getValues();
  var inputUser = String(username).toLowerCase().trim();
  var inputPass = String(password).trim();
  
  // រត់ស្វែងរកទិន្នន័យពីជួរទី២ចុះក្រោម
  for (var i = 1; i < data.length; i++) {
    var dbUser = String(data[i][0]).toLowerCase().trim(); 
    var dbPass = String(data[i][1]).trim();               
    var dbName = String(data[i][2]).trim();               
    
    if (dbUser === inputUser && dbPass === inputPass) {
      return { success: true, cashierName: dbName };
    }
  }
  
  return { success: false, message: "ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវទេ!" };
}



// =====================================================================
// 💾 ២. អនុគមន៍ Backup ទិន្នន័យប្រព័ន្ធ
// =====================================================================
function autoBackupSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var formattedDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MM-yyyy");
  var backupName = "Backup_PaymentSystem_" + formattedDate;
  
  // ចម្លងឯកសារបច្ចុប្បន្ន
  var file = DriveApp.getFileById(ss.getId());
  var backupFolder = DriveApp.getRootFolder(); // វានឹង Save ចូលក្នុង My Drive ខាងក្រៅ
  file.makeCopy(backupName, backupFolder);
  
  // លោតសារចូល Telegram ប្រាប់ Admin
  var text = "✅ <b>ប្រព័ន្ធបានធ្វើ Backup ទិន្នន័យដោយស្វ័យប្រវត្តិរួចរាល់!</b>\n" +
             "📁 <b>ឈ្មោះហ្វាយស៍៖</b> " + backupName + "\n" +
             "📅 <b>កាលបរិច្ឆេទ៖</b> " + new Date().toLocaleString('en-GB', { hour12: true });
  sendTelegramMessage(text);
}

// អនុគមន៍ថ្មី៖ ទាញយកទិន្នន័យសង្ខេបសម្រាប់ផ្ទាំង Dashboard គ្រូបង្រៀន
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
  
  // ស្វែងរកទីតាំង Column ដោយស្វ័យប្រវត្តិដើម្បីការពារកំហុស
  var headers = studentData[0] || [];
  var idxId = headers.findIndex(h => String(h).includes('កូដ') || String(h).toLowerCase().includes('id')) || 0;
  var idxGender = headers.findIndex(h => String(h).includes('ភេទ') || String(h).toLowerCase().includes('gender')) || 2;
  var idxClass = headers.findIndex(h => String(h).includes('ថ្នាក់') || String(h).toLowerCase().includes('class')) || 3;
  var idxFullFee = headers.findIndex(h => String(h).includes('សរុប') || String(h).toLowerCase().includes('fee')) || 4;
  var idxAmount = headers.findIndex(h => String(h).includes('បង់រួច') || String(h).toLowerCase().includes('amount')) || 5;
  
  if(idxId === -1) idxId = 0; if(idxGender === -1) idxGender = 2; if(idxClass === -1) idxClass = 3;
  if(idxFullFee === -1) idxFullFee = 4; if(idxAmount === -1) idxAmount = 5;

  // គណនាស្ថិតិរួមពីសន្លឹកទិន្នន័យសិស្ស
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
    
    // រក្សាទុកព័ត៌មានថ្នាក់រៀនសម្រាប់យកទៅប្រើប្រាស់ខ្វែង
    studentMap[id] = { className: className };
  }
  
  // រៀបចំបញ្ជីឈ្មោះសិស្សដែលទើបបង់ប្រាក់ថ្មីៗ (ទាញពីប្រវត្តិបង់ប្រាក់)
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
      if (count >= 25) break; // បង្ហាញត្រឹម ២៥ នាក់ចុងក្រោយដើម្បីកុំឱ្យធ្ងន់ App ទូរសព្ទ
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


// អនុគមន៍ថ្មី៖ ទាញយកសិស្សដែលនៅខ្វះប្រាក់ (ជំពាក់លើកទី២) ដោយតម្រៀបតាមថ្នាក់
// អនុគមន៍ថ្មី៖ ទាញយកសិស្សដែលនៅខ្វះប្រាក់ (ជំពាក់លើកទី២) ដោយតម្រៀបតាមថ្នាក់ រួមទាំងកាលបរិច្ឆេទ និងវិធីសាស្ត្រ
function getPendingSecondPaymentReport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var studentSheet = ss.getSheetByName("Students_Payment") || ss.getSheets()[0];
  var historySheet = ss.getSheetByName("Payment_History");
  
  var data = studentSheet.getDataRange().getValues();
  var historyData = historySheet ? historySheet.getDataRange().getValues() : [];
  
  // ស្វែងរកប្រវត្តិបង់ប្រាក់ចុងក្រោយរបស់សិស្សម្នាក់ៗ
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
    
    // ដោយសារទិន្នន័យថ្មីៗធ្លាក់មកក្រោម វាអាប់ដេតយកថ្ងៃចុងក្រោយជានិច្ច
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

// =====================================================================
// ១. អនុគមន៍បង្កើតលេខកូដសិស្សស្វ័យប្រវត្តិ (ទម្រង់ AKKNGS-000001)
// =====================================================================
function generateNextStudentId() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Students_Payment") || ss.getSheets()[0];
  
  // ទាញយកទិន្នន័យលេខកូដទាំងអស់ក្នុង Column A (ចាប់ពីជួរទី២ចុះ)
  var lastRow = Math.max(sheet.getLastRow(), 2);
  var data = sheet.getRange("A2:A" + lastRow).getValues();
  
  var maxNumber = 0;
  
  // ស្វែងរកលេខកូដដែលធំជាងគេ
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
  
  // បូកថែម ១ សម្រាប់សិស្សថ្មី
  var nextNumber = maxNumber + 1;
  var nextNumberStr = nextNumber.toString();
  
  // បន្ថែមលេខសូន្យ (0) ពីមុខឱ្យគ្រប់ ៦ ខ្ទង់
  while (nextNumberStr.length < 6) {
    nextNumberStr = "0" + nextNumberStr;
  }
  
  return "AKKNGS-" + nextNumberStr;
}

// =====================================================================
// ២. អនុគមន៍រក្សាទុកទិន្នន័យចុះឈ្មោះថ្មីទៅក្នុង Sheet 
// (សូមកែឈ្មោះ property ឱ្យត្រូវនឹងទម្រង់ Form HTML របស់អ្នកបើចាំបាច់)
// =====================================================================
function saveNewStudent(studentData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Students_Payment");
  
  // ហៅមុខងារបង្កើតលេខកូដខាងលើ មកប្រើប្រាស់
  var newStudentId = generateNextStudentId();
  
  // រៀបចំទិន្នន័យតាមជួរឈរ (Column A ដល់ K) ផ្អែកលើរូបភាព Sheet របស់អ្នក
  var rowData = [
    newStudentId,                   // A: ID (ឧទាហរណ៍ AKKNGS-000001)
    studentData.name,               // B: Student Name (ឈ្មោះសិស្ស)
    studentData.className,          // C: Class (ថ្នាក់រៀន)
    studentData.paymentType,        // D: Payment Type (ប្រភេទបង់)
    Number(studentData.amount),     // E: Amount (ចំនួនទឹកប្រាក់បង់មុនគេ)
    studentData.paymentMethod || "មិនទាន់បង់", // F: Payment Method
    new Date(),                     // G: Date Created (ថ្ងៃខែចុះឈ្មោះ)
    "Pending",                      // H: Status (រង់ចាំបេឡាទទួលលុយ)
    studentData.cashier || "",      // I: Cashier
    studentData.other || "",        // J: Other (ផ្សេងៗ)
    studentData.gender              // K: Gender (ភេទ)
  ];
  
  // បញ្ចូលទិន្នន័យ១ជួរនេះទៅក្នុង Sheet
  sheet.appendRow(rowData);
  
  // បញ្ជូនសារជោគជ័យត្រឡប់ទៅកាន់ Web App វិញ
  return newStudentId; 
}


// =====================================================================
// អនុគមន៍ថ្មី៖ ទាញយកទិន្នន័យសិស្សទាំងអស់បែងចែកតាមថ្នាក់សម្រាប់ទំព័រគ្រូ
// =====================================================================

// =====================================================================
// អនុគមន៍កែប្រែថ្មី៖ ទាញយកទិន្នន័យសិស្សបែងចែកតាមថ្នាក់ (បន្ថែម តម្លៃ, បង់រួច, នៅខ្វះ, ថ្ងៃខែ)
// =====================================================================
function getClassMonitoringData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Students_Payment") || ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  
  var headers = data[0];
  // ស្វែងរកទីតាំង Column ដោយស្វ័យប្រវត្តិ
  var idxId = 0, idxName = 1, idxClass = 2, idxAmount = 4, idxDate = 6, idxStatus = 7, idxGender = 10;
  var idxFullFee = headers.findIndex(h => String(h).includes('សរុប') || String(h).toLowerCase().includes('fee'));
  if (idxFullFee === -1) idxFullFee = 4; // បើរកមិនឃើញ យកតម្លៃ Amount ជា Default
  
  var classGroups = {};
  
  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][idxId]).trim();
    if (!id) continue;
    
    var name = String(data[i][idxName]).trim();
    var className = String(data[i][idxClass]).trim() || "មិនកំណត់";
    var status = String(data[i][idxStatus]).trim();
    var gender = String(data[i][idxGender]).trim();
    
    // គណនាទឹកប្រាក់
    var paidAmt = Number(data[i][idxAmount]) || 0;
    var fullFee = Number(data[i][idxFullFee]) || paidAmt;
    var remaining = fullFee - paidAmt;
    if (remaining < 0) remaining = 0;
    
    // ទាញយកថ្ងៃខែបង់ប្រាក់
    var rawDate = data[i][idxDate];
    var dateStr = "-";
    if (rawDate) {
      if (rawDate instanceof Date) {
        dateStr = Utilities.formatDate(rawDate, Session.getScriptTimeZone(), "dd/MM/yyyy");
      } else {
        dateStr = String(rawDate).split(" ")[0];
      }
    }
    
    if (!classGroups[className]) {
      classGroups[className] = [];
    }
    
    classGroups[className].push({
      name: name,
      gender: gender,
      status: status,
      fullFee: fullFee,
      paidAmt: paidAmt,
      remaining: remaining,
      date: dateStr
    });
  }
  
  return classGroups;
}


// អនុគមន៍ថ្មី៖ ទាញយកទិន្នន័យសម្រាប់របាយការណ៍បិទបញ្ជីប្រចាំខែ
function getMonthlyClosingReport() {
  var historySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Payment_History");
  if (!historySheet) return null;
  
  var data = historySheet.getDataRange().getValues();
  var today = new Date();
  var currentMonth = today.getMonth(); // ខែបច្ចុប្បន្ន
  var currentYear = today.getFullYear(); // ឆ្នាំបច្ចុប្បន្ន
  
  // ឈ្មោះខែជាភាសាខ្មែរ
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
    if (!data[i][2]) continue; // រំលងជួរទទេ
    
    var rowDate = new Date(data[i][2]);
    // ពិនិត្យមើលថាតើទិន្នន័យស្ថិតក្នុងខែ និងឆ្នាំបច្ចុប្បន្នដែរឬទេ
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


// =====================================================================
// 🔔 ៤. អនុគមន៍បូកសរុបសិស្សជំពាក់ និងផ្ញើចូល Telegram
// =====================================================================
function sendMonthlyPendingReminder() {
  var pendingList = getPendingStudents(); // ហៅអនុគមន៍ទាញយកសិស្ស Pending
  
  if (pendingList.length === 0) return; // បើគ្មានអ្នកជំពាក់ មិនបាច់ផ្ញើ
  
  var totalRemaining = 0;
  for (var i = 0; i < pendingList.length; i++) {
    totalRemaining += pendingList[i].remaining;
  }
  
  var text = "⚠️ <b><u>របាយការណ៍សិស្សជំពាក់ប្រាក់ (ប្រចាំខែ)</u></b>\n" +
             "--------------------------------------------------\n" +
             "📊 <b>ចំនួនសិស្សជំពាក់សរុប៖</b> " + pendingList.length + " នាក់\n" +
             "💰 <b>ទំហំទឹកប្រាក់ជំពាក់សរុប៖</b> " + totalRemaining.toLocaleString() + " KHR\n" +
             "--------------------------------------------------\n" +
             "<i>សូមលោកគ្រូអ្នកគ្រូ និងបេឡាជួយតាមដានបន្ត! 🙏</i>";
             
  sendTelegramMessage(text);
}


// =====================================================================
// ⏱️ ៥. អនុគមន៍ដំឡើង Triggers (Run តែម្តងគត់ ដើម្បី Set up)
// =====================================================================
function setupSystemTriggers() {
  // លុប Triggers ចាស់ចោលសិន (បើមាន) ការពារកុំឱ្យដើរត្រួតគ្នា
  var allTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < allTriggers.length; i++) {
    ScriptApp.deleteTrigger(allTriggers[i]);
  }
  
  // ១. កំណត់ឱ្យធ្វើ Backup រៀងរាល់ថ្ងៃអាទិត្យ ម៉ោង ២ រំលងអធ្រាត្រ
  ScriptApp.newTrigger("autoBackupSystem")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(2)
    .create();
    
  // ២. កំណត់ឱ្យផ្ញើសាររំលឹកសិស្សជំពាក់ ជារៀងរាល់ថ្ងៃទី ១ ដើមខែ ម៉ោង ៨ ព្រឹក
  ScriptApp.newTrigger("sendMonthlyPendingReminder")
    .timeBased()
    .onMonthDay(1)
    .atHour(8)
    .create();
    
  Logger.log("ការដំឡើងប្រព័ន្ធស្វ័យប្រវត្តិ (Triggers) បានជោគជ័យ!");
}


// ==========================================
// អនុគមន៍ថ្មី៖ ស្វែងរកសិស្ស (Search) តាម ID ឬ ឈ្មោះ
// ==========================================
function searchStudents(keyword) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students_Payment");
  var data = sheet.getDataRange().getValues();
  var results = [];
  var kw = String(keyword).toLowerCase().trim();

  // រត់ស្វែងរកពីក្រោមឡើងលើ ដើម្បីបានទិន្នន័យថ្មីៗមុន
  for (var i = data.length - 1; i >= 1; i--) {
    var id = String(data[i][0]).toLowerCase();
    var name = String(data[i][1]).toLowerCase();
    
    // បើលេខកូដ ឬឈ្មោះ មានផ្ទុកពាក្យដែលបានវាយបញ្ចូល
    if (id.indexOf(kw) !== -1 || name.indexOf(kw) !== -1) {
      results.push({
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
        remaining: data[i][13]
      });
    }
  }
  return results;
}


// =====================================================================
// 🗑️ អនុគមន៍ថ្មី៖ លុបទិន្នន័យសិស្សចេញពី Google Sheet ទាំងស្រុង
// =====================================================================
function deleteStudent(studentId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Students_Payment");
  var data = sheet.getDataRange().getValues();
  var searchId = String(studentId).trim();
  
  // រត់ស្វែងរកទិន្នន័យពីលើចុះក្រោម
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === searchId) {
      var rowToDelete = i + 1; // បូក ១ ព្រោះ Array ចាប់ផ្តើមពី 0 ចំណែកជួរ Sheet ចាប់ផ្តើមពី 1
      
      // លុបជួរនោះចេញពី Sheet ទាំងស្រុងតែម្តង
      sheet.deleteRow(rowToDelete);
      
      return "ជោគជ័យ៖ បានលុបទិន្នន័យសិស្សកូដ " + searchId + " ចេញពីប្រព័ន្ធរួចរាល់!";
    }
  }
  
  return "បរាជ័យ៖ រកមិនឃើញទិន្នន័យសិស្សនេះទេ!";
}