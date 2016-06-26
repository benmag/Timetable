var requests_made = 0;
var max_requests = 50;
var baseURL = "https://qutvirtual3.qut.edu.au/qvpublic/ttab_unit_search_p.";

/**
 * Return the YQL statement necessary for getting cross-origin source code
 */
function statement(url) {
  return "select content from data.headers where url='" + url +  "'";
}

/**
 * Fetch semester IDs from the QUT advanced search page
 */
function getAllSemesterIDs() {
  // Use Yahoo Query Language (YQL) to extract data from URL
  // Using Open Data Tables to ignore robots.txt on QUTVirtual
  var url = baseURL + "show_search_adv";
  return $.queryYQL(statement(url), "all", function (data) {
    data = data.query.results.resources.content;

    // Extract the dropdown from the data
    var select = $(data).find("select[name='p_time_period_id']")[0];

    // Add each option to our own dropdown
    // TODO Store these results in localStorage with expiration for offline use
    $("#campus-selector").empty();
    $("#campus-selector").append($("<option/>").val(0).text("Always Ask..."));
    $("#campus-selector").append($("<option/>").val(0).text(""));
    $("#campus-selector").append($("<option/>").val(1).text("Gardens Point (GP)"));
    $("#campus-selector").append($("<option/>").val(2).text("Kelvin Grove (KG)"));
    $("#campus-selector").append($("<option/>").val(3).text("Caboolture (CB)"));
    $("#campus-selector").append($("<option/>").val(0).text(""));
    $.each(select.options, function() {
      // Remove the date ranges from the text
      var regex = /.+(?:GP|KG|CB)/;
      var text = regex.exec(this.text)[0];
      $("#campus-selector").append($("<option/>").val(this.value).text(text));
    });
  });
}

/**
 *
 */
function searchUnitCode(unitID, semesterID) {
  // TODO (?) Change behaviour of "Gardens Point (GP)" option
  // to search all GP semesters, instead of just the latest.

  // Show a loading icon while fetching data
  $(".loader").show();

  semesterIDs = [];

  // Execute YQL GET to extract available campus IDs
  var params = { "p_unit_cd": unitID };
  var url = baseURL + "process_teach_period_search?" + $.param(params);
  $.queryYQL(statement(url), "all", function (data) {
    data = data.query.results.resources.content;

    // Check if there are semesters available
    var selects = $(data).find("select[name='p_time_period_id']");
    if (selects.length > 0) {
      var select = selects[0];

      // Extract the dropdown options
      $.each(select.options, function() {
        // Remove the date ranges from the text
        var regex = /.+(?:GP|KG|CB)/;
        var text = regex.exec(this.text)[0];
        semesterIDs.push({"text": text, "value": this.value});
      });
    } else {
      // No semesters found
      semesterIDs = null;
    }

  }).done(function() {
    if (semesterIDs === null || semesterIDs.length === 0) {
      $.alert({
        title: "Unit Not Found!",
        content: "Unit does not have any recent or future timetables."
      });
    } else {

      if (semesterIDs.length == 1) {
        importUnit(semesterIDs[0].value, unitID);
        return;
      }

      if (semesterID === 0) { // Always ask
        selectSemesterandImport(unitID, semesterIDs);
        return;
      }

      semesterID = getLatest(semesterID);

      // Extract the semester ID values
      var semesterValues = $.map(semesterIDs, function(semester) {
        return semester.value;
      });

      // Check if the unit is in the selected semester
      if (semesterValues.indexOf(semesterID) > -1) {
        importUnit(semesterID, unitID);
      } else {
        // TODO Suggest which semester to select
        var semesterText = $("#campus-selector > option[value=" + semesterID + "]").text();
        $.alert({
          title: "Invalid Campus or Semester",
          content: "Unit exists, but was not found in " + semesterText + "."
        });
      }
    }
  }).fail(function() {
    $.alert({
      title: "Unknown Error",
      content: "An unknown error has occured while fetching unit data."
    });
  }).always(function() {
    // Hide the loading spinner
    $(".loader").hide();
  });
}

/**
 * Prompt the user to select a semester to perform an import
 */
function selectSemesterandImport(unitID, semesterIDs) {
  var timePeriod = $("<select id='timePeriod'/>");
  semesterIDs.forEach(function(id) {
    timePeriod.append($("<option/>").val(id.value).text(id.text));
  });

  var bodyText = timePeriod.prop('outerHTML');

  $.confirm({
    title: 'Select a Teaching Period!',
    content: bodyText,
    confirmButton: 'Import',
    cancelButton: 'Cancel',
    confirm: function () {
      var campusID = $('#timePeriod').val();
      importUnit(campusID, unitID);
    },
  });
}

/**
 * Import a unit into the timetabler using the unit code and semester ID
 */
function importUnit(semesterID, unitID) {
  // Construct the URL
  var params = {
    p_time_period_id: semesterID,
    p_unit_cd: unitID
  };
  var url = baseURL + "process_search?" + $.param(params);

  // Fetch the page containing the unit details
  $.queryYQL(statement(url), "all", function (data) {
    // Get to the good stuff
    data = data.query.results.resources.content;

    // Extract and import the unit data
    var table = $(data).find(".qv_table")[0];
    unitData = extractUnitData(table);
    updateUnitList(unitData);

    var semesterText = $("#campus-selector > option[value=" + semesterID + "]").text();
    $.alert({
      title: "Import Successful",
      content: "Imported " + unitID.toUpperCase() + " (" + semesterText + ")"
    });
  });
}

/**
 * Handles the importing of class times. Grabs the data from the table and
 * sends it to the timetabler page
 */
function extractUnitData(table) {
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

  return unitData;
}

/**
 * Open a QUT search for a unit description in a new tab
 */
function searchDescription(description, semesterID){
  if (semesterID === 0) { // Always ask
    // Copy the semesterID options
    var bodyText = "Please select a teaching period...<br>";
    var length = $("#campus-selector")[0].length;
    var options = $("#campus-selector > option").clone().slice(6, length);
    var timePeriod = $("<select id='timePeriod'/>").append(options);
    bodyText += timePeriod.prop('outerHTML');

    $.confirm({
      title: 'Select Semester To Search',
      content: bodyText,
      confirm: function () {
        semesterID = $('#timePeriod').val();
        openSearchResults(description, semesterID);
      },
    });
  } else {
    semesterID = getLatest(semesterID);
    openSearchResults(description, semesterID);
  }
}

/**
 * Return the semester ID for the latest selected campus
 * latestID: 1 = GP, 2 = KG, 3 = CB
 */
function getLatest(latestID) {
  // TODO Return latest SEMESTER instead of latest teaching period
  var result = latestID;
  if (latestID == 1) { // Latest GP
    result = $("#campus-selector > option:contains('GP')")[1].value;
  } else if (latestID == 2) { // Latest KG
    result = $("#campus-selector > option:contains('KG')")[1].value;
  } else if (latestID == 3) { // Latest CB
    result = $("#campus-selector > option:contains('CB')")[1].value;
  }
  return result;
}

/**
 * Open a new window with the search results of the given parameters
 */
function openSearchResults(description, semesterID) {
  // Construct the search URL
  var params = {
    "p_time_period_id": semesterID,
    "p_unit_description": description
  };
  var url = baseURL + "process_search?" + $.param(params);

  // Open the window in a new tab
  window.open(url, "_blank");
}

/**
 * Load the previously selected campus
 */
function loadCampus() {
  //TODO Update to handle missing semester IDs
  var currentCampus = localStorage.getItem("currentCampus");
  if (currentCampus !== null) {
    $("#campus-selector").val(currentCampus);
  }
}

/**
 * Save the current campus so we don't have to keep changing the dropdown
 */
function saveCampus() {
  var currentCampus = $("#campus-selector").val();
  localStorage.setItem("currentCampus", currentCampus);
}
