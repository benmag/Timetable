// Start our script by adding the import button(s) to the page
showImportButton();

/**
 * Shows buttons to allow the user to import subjects into the timetabler
 */
function showImportButton() {
  // Add import button to each subject
  var importButton = crel("button",
    {"class": "btn-timetable importButton"},
    "Subject Found. Import Classes?"
  );

  var qv_table = $(".qv_table");
  qv_table.prepend(importButton);

  // Add importAll button if more than one subject exists
  if (qv_table.length > 1) {
    var importAllButton = crel("button",
      {"class": "btn-timetable importAllButton"},
      "Multiple Subjects Found. Import ALL Classes?"
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

/*
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
      } else {
        buttons = [sender];
        tables = [sender.parentNode];
      }

      // Set the buttons to show the class has been imported
      var len = buttons.length, i = 0;
      for (i; i < len; i++) {
        buttons[i].style.backgroundColor = "#4CAF50";
        buttons[i].textContent = "Imported!";
      }

      // Import the classes into the timetabler
      len = tables.length;
      i = 0;
      for (i; i < len; i++) {
        var unitData = extractUnitData(tables[i]);
        sendUnit(unitData);
      }
    }
  });
});
