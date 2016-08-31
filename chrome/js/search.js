/**
 * This class enables data extraction from QUT pages using
 * Yahoo Query Language (YQL) and Open Data Tables to ignore robots.txt
 */

/* GLOBAL */
var baseURL = "https://qutvirtual3.qut.edu.au/qvpublic/ttab_unit_search_p.";

/**
 * Fetch semester IDs from QUT's 'advanced unit search' page
 */
function getSemesterIDs() {
  var options = null;

  return $.queryYQL(createYQLStatement("show_search_adv"), "all", function(data) {
    data = extractYQLData(data);

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

    // Remove the date ranges from the text
    $.each(select.options, function() {
      var regex = /.+(?:GP|KG|CB)/;
      var text = regex.exec(this.text)[0];
      this.text = text;
    });

    $("#campus-selector").append(select.options);
  });
}

/**
 * Search for a unit code in a given semester
 */
function searchUnitCode(unitID, semesterID) {
  // TODO (?) Change behaviour of "Gardens Point (GP)" option
  // to search all GP semesters, instead of just the latest.

  // Show a loading icon while fetching data
  $(".loader").show();

  // Construct the URL for the teaching period search
  var params = {
    "p_unit_cd": unitID
  };
  var url = "process_teach_period_search?" + $.param(params);

  //
  var semesterIDs = null;

  // Get available semesterIDs for this unit
  $.queryYQL(createYQLStatement(url), "all", function(result) {
    // Check if there are semesters available
    data = extractYQLData(result);
    var selects = $(data).find("select[name='p_time_period_id']");
    if (selects.length > 0) {
      // Extract only the numeric semester IDs
      semesterIDs = $(selects[0].options).map(function() {
        return $(this).val();
      });
    }
  }).done(function() {
    if (semesterIDs === null || semesterIDs.length === 0) {
      $.alert({
        title: "Unit Not Found!",
        content: "Unit does not have any recent or future timetables."
      });
    } else { // Unit has been found in one or more teaching periods
      // Check if user selected to 'Always Ask'
      if (semesterID === "0") {
        selectSemesterandImport(unitID, semesterIDs);
        return;
      }

      // Get the latest semester ID if the user has chosen a campus
      semesterID = getLatest(semesterID);

      // Check if the unit is in the selected semester
      if ($.inArray(semesterID, semesterIDs) > -1) {
        importUnit(semesterID, unitID);
      } else {
        // Unit is not available in selected semester

        // TODO List all available semesters in a dropdown
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
    // Hide the loading icon
    $(".loader").hide();
  });
}

/**
 * Prompt the user to select a semester before importing
 */
function selectSemesterandImport(unitID, semesterIDs) {
  var timePeriod = $("<select class='timePeriod'/>");
  semesterIDs.each(function(index, semesterID) {
    var text = $("#campus-selector > option[value=" + semesterID + "]").text();
    timePeriod.append($("<option/>").val(semesterID).text(text));
  });

  $.confirm({
    title: 'Select a Teaching Period!',
    content: timePeriod.prop('outerHTML'),
    confirmButton: 'Import',
    confirm: function() {
      var campusID = $('.timePeriod').val();
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
  var url = "process_search?" + $.param(params);

  // Fetch the page containing the unit details
  $.queryYQL(createYQLStatement(url), "all", function(data) {
    data = extractYQLData(data);

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
  $(table).find("tr:not(:first-child)").each(function(index, element) {
    var td = $(this).children("td");
    var classData = {
      "className": td.eq(0).text().trim(),
      "classType": td.eq(1).text(),
      "day": td.eq(2).text(),
      "time": { // raw = "11:00AM-01:00PM" or "11:00am - 01:00pm"
        "start" : td.eq(3).text().toLowerCase().replace("m-", "m - ").split("-")[0].trim(),
        "end" : td.eq(3).text().toLowerCase().replace("m-", "m - ").split("-")[1].trim(),
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
 * Open a new tab with a unit description search
 */
function searchDescription(description, semesterID) {
  if (semesterID === "0") { // Always ask
    // Copy the semesterID options
    var length = $("#campus-selector")[0].length;
    var options = $("#campus-selector > option").clone().slice(6, length);
    var timePeriod = $("<select class='timePeriod'/>").append(options);

    var bodyText = "Please select a teaching period...<br>";
    bodyText += timePeriod.prop('outerHTML');

    $.confirm({
      title: 'Select Semester To Search',
      content: bodyText,
      confirm: function() {
        semesterID = $('.timePeriod').val();
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
 * campusID: 1 = GP, 2 = KG, 3 = CB
 */
function getLatest(semesterID) {
  // TODO Return latest SEMESTER instead of latest teaching period
  if (semesterID == 1) { // Latest GP
    semesterID = $("#campus-selector > option:contains('GP')")[1].value;
  } else if (semesterID == 2) { // Latest KG
    semesterID = $("#campus-selector > option:contains('KG')")[1].value;
  } else if (semesterID == 3) { // Latest CB
    semesterID = $("#campus-selector > option:contains('CB')")[1].value;
  }
  return semesterID;
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
 * Return the YQL statement necessary for getting cross-origin source code
 */
function createYQLStatement(url) {
  return "select content from data.headers where url='" + baseURL + url + "'";
}

/**
 * Traverse JSON and strip evaluated tags
 */
function extractYQLData(JSONdata) {
  // Get to the good stuff
  content = JSONdata.query.results.resources.content;

  // Remove 'img' and 'link' tags to prevent jQuery
  // throwing 404's for attempting to load missing assets
  // TODO Find a way to prevent jQuery from evaluating
  // these tags instead of removing them
  data = content.replace(/<[img|link][^>]*>/g, "");

  return data;
}

/**
 * Load the previously selected campus
 */
function loadCampus() {
  //TODO Update to handle missing semester IDs
  var currentCampus = localStorage.getItem("currentCampus");
  var exists = $('#campus-selector option[value='+ currentCampus +']').length !== 0;
  if (currentCampus !== null && exists) {
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
