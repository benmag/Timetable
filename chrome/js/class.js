/**
* Create a unique identifier for classes on the calendar, following the
* format: unitID_classType_locCampus_locRoom_timeDay_timeStart_timeEnd
*/
function getClassID(classData) {
  var idData = [
    classData.attr("unitID"),
    classData.attr("className").replace(" ", "_"),
    classData.attr("classType"),
    classData.attr("location").replace(" ", "_"),
    classData.attr("day"),
    classData.attr("start"),
    classData.attr("end")
  ];
  return idData.join("_");
}

/**
* Create a human-readable description of the class to be used in the calendar
*/
function getClassText(classData) {
  return classData.attr("unitID") + "\n" +
  classData.attr("classType") + " " +
  classData.attr("location") + "\n\n" +
  classData.attr("unitName");

  //TODO Include number of sessions
}

/**
* Create a human-readable overview of the class to be used in the class output
*/
function getClassOverview(classData) {
  return classData.attr("classType") + " " +
  classData.attr("day") + " " +
  classData.attr("start") + " - " +
  classData.attr("end") + " " +
  classData.attr("location") + "<br />";
}

/**
* Add a new class to the calendar
*/
function addClass(calendar, classData) {
  calendar.fullCalendar("renderEvent" , {
    id: getClassID(classData),
    title: getClassText(classData),
    start: Date.parse(classData.attr("day") + " " + classData.attr("start")),
    end: Date.parse(classData.attr("day") + " " + classData.attr("end")),
    className: classData.attr("classType").toLowerCase()
  });
}

/**
* Add a class preview to the calendar
*/
function previewClass(calendar, classData) {
  // Only continue if class is not selected
  if (classData.attr("selected") != "selected") {
    // Add the event details to the calendar
    calendar.fullCalendar("renderEvent", {
      id: "preview",
      title: getClassText(classData),
      start: Date.parse(classData.attr("day") + " " + classData.attr("start")),
      end: Date.parse(classData.attr("day") + " " + classData.attr("end")),
      className: "preview " + classData.attr("classType").toLowerCase()
    });
  }
}

/**
 * Restore saved subjects from localStorage
 */
function loadClassData() {
  var classLists = localStorage.getItem("classLists");

  if (classLists !== null) {
    $(".class_container").append(classLists);
    $(".classes").scrollLock();
    generateClassOutput();

    // Add the selected units to the calendar
    if (!hasError) {
      $(".class[selected='selected']").each(function() {
        addClass(cal, $(this));
      });
    }
  }
}

/**
 * Save subjects into localStorage
 */
function saveClassData() {
    var classLists = "";
    $(".class_list").each(function() {
      classLists += $(this).get(0).outerHTML;
    });

    localStorage.setItem("classLists", classLists);
}
