// Start our script by adding the import button(s) to the page
showImportButton();

/**
 * Shows buttons to allow the user to import subjects into the timetabler
 */
function showImportButton() {
  // Add import button to each subject
  var importButton = crel("button",
    {"class": "btn importButton"},
    "Subject Found. Import Classes?"
  );
  $(".qv_table").prepend(importButton);

  // Add importAll button if more than one subject exists
  if ($(".qv_table").length > 1) {
    var importAllButton = crel("button",
      {"class": "btn importAllButton"},
      "Multiple Subjects Found. Import ALL Classes?"
    );
    $(".divider:nth-of-type(1)").prepend(importAllButton);
  }
}

/**
 * Handles the importing of class times. Grabs the data from the table and sends it to the timetabler page
 */
function exportUnitData(table) {
  // Get the unit ID and subject name from above the table
  var unitString;
  if (location.pathname == "/qv/ttab_student_p.show") { // Enrollment page
    unitString = $(table).prev().prev().find("strong").html().trim();
  } else { // Search page
    unitString = $(table).prevAll().eq(3).html();
  }

  // Extract the unit ID (e.g. MAB126) and name (e.g. Mathematics)
  var unitID = unitString.split(" ")[0];
  var unitName = unitString.substr(unitString.indexOf(" ") + 1);

  // Create a new array for the unit
  var unitData = {
    "unitID": unitID,
    "unitName": unitName,
    "classes": []
  };

  // Extract all of the row data from the table
  $(table).find("tr:not(:first-child)").each(function (index, element) {
    var classData = {
      "className": $(this).children("td").eq(0).html(),
      "classType": $(this).children("td").eq(1).html(),
      "day": $(this).children("td").eq(2).html(),
      "time":  { // raw = "11:00AM-01:00PM" or "11:00am - 01:00pm"
        "raw" : $(this).children("td").eq(3).html().toLowerCase().replace("m-", "m - "),
        "start" : $(this).children("td").eq(3).html().split("-")[0].trim(),
        "end" : $(this).children("td").eq(3).html().split("-")[1].trim(),
      },
      "location": $.trim($(this).children("td").eq(4).text()),
      "staff": $(this).children("td").eq(5).html().replace(/(\r\n|\n|\r)/gm,"")
    };

    // Push the row data into our classInfo object
    unitData.classes.push(classData);
  });

  sendUnit(unitData);
}

/**
 * Send the unit information via Chrome Messages to the timetabler
 */
function sendUnit(unitData) {
  chrome.runtime.sendMessage({
    type: "unit_import",
    class_info: JSON.stringify(unitData)
  });
}

/**
 * Forces the code to wait for a given number of milliseconds
 */
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds) {
      break;
    }
  }
}

/**
 * Add an event listener for the import button
 */
$("button.importButton").bind("click", function() {
  // Check the timetabler is running
  var sender = $(this);

  chrome.runtime.sendMessage({type: "checkTab"}, function(response) {
    if (response == "Done!") {
      // Send the script to sleep before importing classes
      // This ensures the timetabler is ready to receive the classes
      sleep(500);

      // Set the button to show the class has been imported
      sender.css("background-color", "#4CAF50");
      sender.text("Imported!");

      // Import the classes into the timetabler
      exportUnitData(sender.parent());
    }
  });
});

/*
 * Add an event listener for the import all button
 */
$("button.importAllButton").bind("click", function() {
  // Check the timetabler is running
  chrome.runtime.sendMessage({type: "checkTab"}, function(response) {
    // Wait for the timetabler to say it has finished loading
    if (response == "Done!") {
      // Send the script to sleep before importing classes
      // This ensures the timetabler is ready to receive the classes
      sleep(500);

      // Set the butten to show the class has been imported
      $(".btn").each(function() {
        $(this).css("background-color", "#4CAF50");
        $(this).text("Imported!");
      });

      // Import the classes into the timetabler
      $(".qv_table").each(function() {
        exportUnitData(this);
      });
    }
  });
});