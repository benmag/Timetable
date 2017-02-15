/**
 * This class enables data extraction from QUT pages using Yahoo Query Language
 * (YQL) and Open Data Tables to ignore the server's robots.txt
 */

/* GLOBAL */
var baseURL = "https://qutvirtual3.qut.edu.au/qvpublic/ttab_unit_search_p.";

/**
 * Extract a list of <option> tags containing available semesters
 */
function extractTag(tag, data) {
  // Extract the dropdown from the data using regex
  // Using $.find() seems to load unwanted assets
  var regex = new RegExp("<" + tag + "[^>]*>([^]*)<\/" + tag + ">");
  return $(data.match(regex)[0])[0];
}

/**
 * TODO
 */
function checkSelectName(select, name) {
  if (select === undefined || select.name !== name) {
    $("#campus-selector")[0].options[0].textContent = "Error loading...";
    $("#campus-selector").append($("<option/>").val(0).text("QUT Virtual may be unavailable"));
    return false;
  }
  return true;
}

/**
 * Fetch semester IDs from QUT's 'advanced unit search' page
 */
function getSemesterIDs() {
  // TODO Add a fallback for if this functions fails, maybe retry
  // TODO Store semester IDs in localStorage with expiration for offline use
  return $.queryYQL(createYQLStatement("show_search_adv"), "all", function(data) {
    data = extractYQLData(data);

    // Get the list of semesters from the response
    var semesters = extractTag("select", data);
    if (!checkSelectName(semesters, "p_time_period_id")) {
      return false;
    }

    // Remove the date ranges from the text
    regex = /.+(?:GP|KG|CB)/;
    var len = semesters.length, i = 0;
    for (i; i < len; i++) {
      var parsed = regex.exec(semesters[i].textContent)[0];
      semesters[i].textContent = parsed;
    }

    // Add each option to our own dropdown
    var campusSelector = $("#campus-selector");
    campusSelector[0].options[0].textContent = "Always Ask...";
    campusSelector.append(semesters.options);
    campusSelector[0].value = 0; // Default to 'Always Ask'
  });
}

/**
 * Search for a unit code in a given semester
 */
function searchUnitCode(unitID, semesterID) {
  // Show a loading icon while fetching data
  $("#loader").show();

  // Construct the URL for the teaching period search
  var url = "process_teach_period_search?" + $.param({
    "p_unit_cd": unitID
  });

  // Maintain a list of available semester IDs for this unit
  var semesterIDs = null;

  // Get available semesterIDs for this unit
  $.queryYQL(createYQLStatement(url), "all", function(data) {
    data = extractYQLData(data);

    // Get the list of semesters from the response
    var semesters = extractTag("select", data);
    if (!checkSelectName(semesters, "p_time_period_id")) {
      return false;
    }

    // Extract only the numeric semester IDs
    semesterIDs = [];
    var len = semesters.length, i = 0;
    for (i; i < len; i++) {
      semesterIDs[i] = semesters[i].value;
    }
  }).done(function() {
    if (semesterIDs === null || semesterIDs.length === 0) {
      $.alert({
        title: "Unit Not Found!",
        content: "Unit does not have any recent or future timetables.",
        buttons: {
          ok: {
            keys: ['enter']
          }
        }
      });
      return false;
    }

    // Unit has been found in one or more teaching periods
    // Check if user selected to 'Always Ask'
    if (semesterID === "0") {
      selectSemesterandImport(unitID, semesterIDs);
      return false;
    }

    // Check if the unit is in the selected semester
    if ($.inArray(semesterID, semesterIDs) > -1) {
      importUnit(semesterID, unitID);
      return false;
    }

    // Unit is not available in selected semester
    // TODO List all available semesters in a dropdown
    var semesterText = $("#campus-selector > option[value=" + semesterID + "]").text();
    $.alert({
      title: "Invalid Campus or Semester",
      content: "Unit exists, but was not found in " + semesterText + ".",
      buttons: {
        ok: {
          keys: ['enter']
        }
      }
    });
  }).fail(function() {
    $.alert({
      title: "Unknown Error",
      content: "An unknown error has occured while fetching unit data.",
      buttons: {
        ok: {
          keys: ['enter']
        }
      }
    });
  }).always(function() {
    // Hide the loading icon
    $("#loader").hide();
  });
}

/**
 * Prompt the user to select a semester before importing
 */
function selectSemesterandImport(unitID, semesterIDs) {
  // Create a new <select> element
  var timePeriod = $("<select class='timePeriod'/>");

  // Create a list of <option> elements to populate the <select>
  var campusSelector = $("#campus-selector");
  var len = semesterIDs.length, i = 0;
  for (i; i < len; i++) {
    var text = campusSelector.find("option[value=" + semesterIDs[i] + "]").text();
    var option = $("<option/>").val(semesterIDs[i]).text(text);
    timePeriod.append(option);
  }

  $.confirm({
    title: 'Import a teaching period...',
    content: timePeriod.prop('outerHTML'),
    buttons: {
      import: {
        text: "Import",
        keys: ['enter'],
        action: function() {
          var campusID = $('.timePeriod').val();
          importUnit(campusID, unitID);
        }
      }
    }
  });
}

/**
 * TODO
 */
function checkTableName(table, className) {
  if (table === undefined || table.className !== className) {
    $.alert({
      title: "Error!",
      content: "Unable to extract class data. QUT Virtual may be unavailable.",
      buttons: {
        ok: {
          keys: ['enter']
        }
      }
    });
    return false;
  }
  return true;
}

/**
 * Import a unit into the timetabler using the unit code and semester ID
 */
function importUnit(semesterID, unitID) {
  // Show a loading icon while fetching data
  $("#loader").show();

  // Construct the URL
  var url = "process_search?" + $.param({
    p_time_period_id: semesterID,
    p_unit_cd: unitID
  });

  // Fetch the page containing the unit details
  $.queryYQL(createYQLStatement(url), "all", function(data) {
    data = extractYQLData(data);

    // Extract the class data table
    // BUG TODO Undo this extractTag() so that extractUnitData()
    // can still get the unit name and ID
    // var table = extractTag("table", data);
    // if (!checkTableName(table, "qv_table")) {
    //   return false;
    // }

    var table = $(data).find(".qv_table");

    // Extract and import the unit data
    unitData = extractUnitData(table);
    updateUnitList(unitData);

    var semesterText = $("#campus-selector > option[value=" + semesterID + "]").text();
    $.alert({
      title: "Import Successful",
      content: "Imported " + unitID.toUpperCase() + " (" + semesterText + ")",
      buttons: {
        ok: {
          keys: ['enter']
        }
      }
    });
  }).always(function() {
    // Hide the loading icon
    $("#loader").hide();
  });
}

/**
 * Open a new tab with a unit description search
 */
function searchDescription(description, semesterID) {
  if (semesterID === "0") { // Always ask
    // Copy the semesterID options
    var length = $("#campus-selector")[0].length;
    var options = $("#campus-selector > option").clone().slice(1, length);
    var timePeriod = $("<select class='timePeriod'/>").append(options);

    $.confirm({
      title: 'Search a teaching period...',
      content: timePeriod.prop('outerHTML'),
      buttons: {
        confirm: {
          text: 'Search',
          keys: ['enter'],
          action: function() {
            semesterID = $('.timePeriod').val();
            openSearchResults(description, semesterID);
          }
        }
      }
    });
  } else {
    openSearchResults(description, semesterID);
  }
}

/**
 * Open a new window with the search results of the given parameters
 */
function openSearchResults(description, semesterID) {
  // Construct the search URL
  var url = baseURL + "process_search?" + $.param({
    "p_time_period_id": semesterID,
    "p_unit_description": description
  });

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
  var data = JSONdata.query.results.resources.content;

  // Remove 'img' and 'link' tags to prevent jQuery
  // throwing 404's for attempting to load missing assets
  // TODO Find a way to prevent jQuery from evaluating
  // these tags instead of removing them
  // data = data.replace(/<[head][^>]*>/g, "");

  return data;
}

/**
 * Load the previously selected campus
 */
function loadCampus() {
  // TODO Update to handle missing semester IDs
  var currentCampus = localStorage.getItem("currentCampus");
  var exists = $('#campus-selector option[value='+ currentCampus +']').length !== 0;
  if (currentCampus !== null && exists) {
    $("#campus-selector").val(currentCampus);
  }
}
