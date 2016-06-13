var requests_made = 0;
var max_requests = 50;
var semesterIDs = [];
var baseURL = "https://qutvirtual3.qut.edu.au/qvpublic/ttab_unit_search_p.";

/**
 * Fetch semester IDs from the QUT advanced search page using HTTP GET
 */
function getAllSemesterIDs() {
  // Use Yahoo Query Language to extract data from URL
  // Using Open Data Tables to ignore robots.txt on QUTVirtual
  var advSearch = "https://qutvirtual3.qut.edu.au/qvpublic/ttab_unit_search_p.show_search_adv";
  var statement = "select content from data.headers where url='" + advSearch +  "'";
  return $.queryYQL(statement, "all", function (data) {
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

function getClassCampus(unitID, semesterID) {
  // Show a loading icon while fetching data
  $(".loader").show();

  semesterIDs = [];

  // Execute YQL GET to extract available campus IDs
  var params = { "p_unit_cd": unitID };
  var url = baseURL + "process_teach_period_search?" + $.param(params);
  var statement = "select content from data.headers where url='" + url +  "'";
  $.queryYQL(statement, "all", function (data) {
    data = data.query.results.resources.content;

    // Extract the dropdown options
    var select = $(data).find("select[name='p_time_period_id']")[0];
    $.each(select.options, function() {
      // Remove the date ranges from the text
      var regex = /.+(?:GP|KG|CB)/;
      var text = regex.exec(this.text)[0];

      // Add the result to our list
      semesterIDs.push({"text": text, "value": this.value})
    })
  }).done(function() {
    // Hide the loading spinner
    $(".loader").hide();

    var IDs = $.map(semesterIDs, function(semester) {
      return semester.value;
    });

    switch(semesterID) {
      case "0": // Always ask
        allPlacesSearched(unitID, semesterIDs);
        break;
      case "1": // Latest GP
        semesterID = $("#campus-selector option:contains('GP')")[1].value;
      case "2": // Latest KG
        semesterID = $("#campus-selector option:contains('KG')")[1].value;
      case "3": // Latest CB
        semesterID = $("#campus-selector option:contains('CB')")[1].value;
      default: // User has selected a semester
        if (IDs.indexOf(semesterID) > -1) {
          allPlacesSearched(unitID, [{"value": semesterID}]);
        }
        break;
    }
  });
}

// Gets run after each place is searched as I couldn't think of a
// better way of doing asynchronously and waiting till all are complete
function allPlacesSearched(unitID, semesterIDs) {

  if (semesterIDs.length == 1) {
    // Unit only found in one semester. Import
    var campusID = semesterIDs[0].value;
    importUnit(campusID, unitID);
  } else if (semesterIDs == null || semesterIDs.length == 0) {
    $.alert({
      title: "Error occurred!",
      content: "An error has occurred, or there is no unit by this name."
    })
  } else {
    var bodyText = "Please Select a Teaching Period<br><select id='timePeriod'>";
    semesterIDs.forEach(function(id) {
      bodyText += "<option value='" + id.value + "'>" + id.text + "</option>";
    })
    bodyText += "</select>";

    $.confirm({
      title: 'Select an Option!',
      content: bodyText,
      confirm: function () {
        var campusID = $('#timePeriod').val();
        importUnit(campusID, unitID);
      },
    });
  }
}

function importUnit(campusID, unitID) {
  // Construct the URL
  var params = {
    p_time_period_id: campusID,
    p_unit_cd: unitID
  };
  var url = baseURL + "process_search?" + $.param(params);

  // Fetch the page containing the unit details
  var statement = "select content from data.headers where url='" + url +  "'";
  $.queryYQL(statement, "all", function (data) {
    // Get to the good stuff
    data = data.query.results.resources.content;

    // Extract and import the unit data
    var table = $(data).find(".qv_table")[0];
    unitData = extractUnitData(table);
    updateUnitList(unitData);
  })
}

/**
 * Handles the importing of class times. Grabs the data from the table and sends it to the timetabler page
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

/**Actually open up the new page with the provided values **/
function unitSearch(description, semesterID){
  switch(semesterID) {
    case "0":
      // Ask the user to select the semester
        var bodyText = "Please Select a Teaching Period<br>";
        var length = $("#campus-selector")[0].length;
        var options = $("#campus-selector option").slice(length-50, length);

        var timePeriod = $("<select id='timePeriod'/>");
        $.each(options, function() {
          timePeriod.append($("<option/>").val(this.value).text(this.text));
        });

        bodyText += $(timePeriod).prop('outerHTML');;

        $.alert({
          title: 'Select an Option!',
          content: bodyText,
          confirm: function () {
            semesterID = $('#timePeriod').val();
            openWindow(description, semesterID);
          },
        });
      break;
    case "1":
      // Select the latest GP
      semesterID = $("#campus-selector option:contains('GP')")[1].value;
      openWindow(description, semesterID);
      break;
    case "2":
      // Select the latest KG
      semesterID = $("#campus-selector option:contains('KG')")[1].value;
      openWindow(description, semesterID);
      break;
    case "3":
      // Select the latest CB
      semesterID = $("#campus-selector option:contains('CB')")[1].value;
      openWindow(description, semesterID);
      break;
    default:
      openWindow(description, semesterID);
      break;
  }

  function openWindow(description, semesterID) {
    // Construct the search URL
    var params = {
      "p_time_period_id": semesterID,
      "p_unit_description": description
    };
    var url = baseURL + "process_search?" + $.param(params);

    // Open the window in a new tab
    window.open(url, "_blank");
  }
}
