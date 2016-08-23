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
  calendar.fullCalendar("renderEvent", {
    id: getClassID(classData),
    title: getClassText(classData),
    start: Date.parse(classData.attr("day") + " " + classData.attr("start")),
    end: Date.parse(classData.attr("day") + " " + classData.attr("end")),
    className: classData.attr("classType").toLowerCase()
  });
}

/**
 * Remove an existing class from the calendar
 */
function removeClass(calendar, classData) {
  calendar.fullCalendar("removeEvents", getClassID(classData));
  classData.removeAttr("selected");
}

/**
 * Add a class preview to the calendar
 */
function previewClass(calendar, classData) {
  // Check if the class has been added to the calendar
  if (classData.attr("selected") != "selected") {
    // Add the event details to the calendar as a preview
    calendar.fullCalendar("renderEvent", {
      id: "preview",
      title: getClassText(classData),
      start: Date.parse(classData.attr("day") + " " + classData.attr("start")),
      end: Date.parse(classData.attr("day") + " " + classData.attr("end")),
      className: "preview " + classData.attr("classType").toLowerCase()
    });
  } else {
    // Find the event on the calendar and make it a preview
    var id = getClassID(classData);
    var events = $(".calendar").fullCalendar('clientEvents', id);
    if (events[0].className.indexOf("preview") === -1) {
      events[0].className.push("preview");
      calendar.fullCalendar('updateEvent', events[0]);
    }
  }
}

/**
 * Remove a class preview from the calendar
 */
function removeClassPreview(calendar, classData) {
  // Get the event from the calendar
  var id = getClassID(classData);
  var events = $(".calendar").fullCalendar('clientEvents', id);

  // Check if the preview for this class exists
  if (events.length === 1) {
    // Remove the 'preview' className
    var index = events[0].className.indexOf("preview");
    if (index > -1) {
      events[0].className.splice(index, 1);
      calendar.fullCalendar('updateEvent', events[0]);
    }
  }
}

/**
 * Restore saved subjects from localStorage
 */
function loadClassData(calendar) {
  var classLists = localStorage.getItem("classLists");

  if (classLists !== null) {
    $(".class-container").append(classLists);
    $(".classes").scrollLock();
    generateClassOutput();

    // Add the selected units to the calendar
    if (!hasError) {
      $(".class[selected='selected']").each(function() {
        addClass(calendar, $(this));
      });
    }
  }
}

/**
 * Save subjects into localStorage
 */
function saveClassData() {
  var classLists = "";
  $(".class-list").each(function() {
    classLists += $(this).get(0).outerHTML;
  });

  localStorage.setItem("classLists", classLists);
}

/**
 * Add a warning badge for duplicate classes to the class type heading
 */
function addDuplicateBadge(classData) {
  var classCount = classData.siblings("[selected]").length;
  if (classCount > 0) {
    var title = classData.siblings("b");
    if (!title.has(".duplicate-badge").length) {
      title.append(crel("div", {
          "class": "duplicate-badge",
          "title": "Duplicate classes detected!"
        }, crel("img", {
          "src": "img/warn.png"
        })
      ));
    }
  }
}

/**
 * Remove the duplicate classes badge from the class type heading
 */
function removeDuplicateBadge(classData) {
  // Check for duplicate classes
  var classCount = classData.siblings("[selected]").length;
  if (classCount < 2) {
    classData.siblings("b").children(".duplicate-badge").remove();
  }
}
