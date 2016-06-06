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
    unitString = $(table).prevAll("h2:first").html();
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
    var td = $(this).children("td");
    var classData = {
      "className": td.eq(0).text().trim(),
      "classType": td.eq(1).text(),
      "day": td.eq(2).text(),
      "time":  { // raw = "11:00AM-01:00PM" or "11:00am - 01:00pm"
        "raw" : td.eq(3).text().toLowerCase().replace("m-", "m - "),
        "start" : td.eq(3).text().split("-")[0].trim(),
        "end" : td.eq(3).text().split("-")[1].trim(),
      },
      "location": td.eq(4).text().trim(),
      "staff": td.eq(5).text().replace(/(\r\n|\n|\r)/gm, "")
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
 * Add an event listener for the import button
 */
$("button.importButton").bind("click", function() {
  // Check the timetabler is running
  var sender = $(this);

  chrome.runtime.sendMessage({type: "checkTab"}, function(response) {
    if (response == "Done!") {
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
