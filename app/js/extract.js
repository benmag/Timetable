/**
 * Handles the importing of class times. Grabs the data from the table and
 * sends it to the timetabler page
 */
function extractUnitData(table) {
  // Get the unit ID and subject name from above the table
  var unitString = "";
  if (location.pathname == "/qv/ttab_student_p.show") { // Enrollment page
    unitString = $(table).prev().prev().find("strong").text().trim();
  } else { // Search page
    unitString = $(table).prevAll("h2:first").text();
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
  var rows = $(table).find("tr").not(":first-child");
  var len = rows.length, i = 0;
  for (i; i < len; i++) {
    var cells = rows[i].children;

    // raw = "11:00AM-01:00PM" or "11:00am - 01:00pm"
    var times = cells[3].textContent.toLowerCase().split("-");

    // TODO Consider moving classType attribute to a container
    var classData = {
      "className": cells[0].textContent.trim(),
      "classType": cells[1].textContent,
      "day": cells[2].textContent,
      "start" : times[0].trim(),
      "end" : times[1].trim(),
      "location": cells[4].textContent.trim(),
      "staff": cells[5].textContent.replace(/(\r\n|\n|\r)/gm, "")
    };

    // Push the class data into our unit data object
    unitData.classes.push(classData);
  }

  return unitData;
}
