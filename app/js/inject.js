// Start our script by adding the import button(s) to the page
showImportButton();

/**
 * Shows buttons to allow the user to import units into the timetabler
 */
function showImportButton() {
  // Unit import button
  var importUnitButton = crel("button",
    {"class": "btn-timetable importUnitButton"},
    "Unit Found. Import Classes?"
  );

  // Add import button to every unit table
  var qv_table = $(".qv_table");
  qv_table.prepend(importUnitButton);

  // Semester import button
  var semesterButton = crel("button",
    {"class": "btn-timetable importSemesterButton"},
    "Semester Found. Import Units?"
  );

  // Add semester import button to every semester
  var semesters = $("h2:contains(' to ')"); // /qv/
  if (semesters.length === 0) semesters = $("p > strong:only-child").parent(); // /qvpublic/
  $(semesters).after(semesterButton);

  // Add importAll button if more than one unit exists
  if (semesters.length > 1) {
    var importAllButton = crel("button",
      {"class": "btn-timetable importAllButton"},
      "Multiple Semesters Found. Import ALL Units?"
    );
    $(".divider:nth-of-type(1)").prepend(importAllButton);
  }
}

/**
 * Send the unit information via Chrome Messages to the timetabler
 */
function sendUnit(unitData) {
  chrome.runtime.sendMessage({
    unitImport: true,
    unitData: JSON.stringify(unitData)
  });
}

/**
 * Add an event listener for the import buttons
 */
$("button.btn-timetable").bind("click", function() {
  // Check the timetabler is running
  var sender = this;
  chrome.runtime.sendMessage({checkTab: true}, function(response) {
    // Wait for the timetabler to say it has finished loading
    if (response === "Done!") {
      var buttons, tables;

      // Determine whether to import one or all classes
      if (sender.className.indexOf("importAllButton") > -1) {
        buttons = $(".btn-timetable");
        tables = $(".qv_table");
      } else if (sender.className.indexOf("importSemesterButton") > -1) {
        tables = $(sender).nextUntil(".importSemesterButton", ".qv_table");
        buttons = tables.children(".btn-timetable");

        // Set the button style
        sender.style.backgroundColor = "#4CAF50";
        sender.textContent = "Imported!";
      } else {
        buttons = [sender];
        tables = [sender.parentNode];
      }

      // Set the button style to show the unit has been imported
      $(buttons).css("backgroundColor", "#4caf50");
      $(buttons).text("Imported!");

      // var len = buttons.length, i = 0;
      // for (i; i < len; i++) {
      //   buttons[i].style.backgroundColor = "#4CAF50";
      //   buttons[i].textContent = "Imported!";
      // }

      // Import the classes into the timetabler
      len = tables.length;
      var i = 0;
      for (i; i < len; i++) {
        var unitData = extractUnitData(tables[i]);
        sendUnit(unitData);
      }
    }
  });
});
