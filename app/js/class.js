/**
 * Create a unique identifier for classes on the calendar, following the
 * format: unitID_classType_locCampus_locRoom_timeDay_timeStart_timeEnd
 */
function getClassID(classElement) {
  // TODO Consider replacing this ID system with "[unitID][classIndex]",
  // e.g. "MAB126_0", where the classIndex originates from localStorage
  // console.time("oldFunc");
  var idData = [
    classElement.getAttribute("unitID"),
    classElement.getAttribute("className").replace(" ", "_"),
    classElement.getAttribute("classType"),
    classElement.getAttribute("location").replace(" ", "_"),
    classElement.getAttribute("day"),
    classElement.getAttribute("start"),
    classElement.getAttribute("end")
  ];
  // console.timeEnd("oldFunc");

  // Much slower than current implementation
  // console.time("newFunc");
  // var idData = classElement.getAttribute("unitID") +
  //   $(classElement.parentNode.parentNode).find(".class").index(classElement);
  // console.timeEnd("newFunc");

  return idData.join("_");
}

/**
 * Create a human-readable description of the class to be used in the calendar
 */
function getClassText(classData) {
  return classData.getAttribute("unitID") + "\n" +
    classData.getAttribute("classType") + " " +
    classData.getAttribute("location") + "\n\n" +
    classData.getAttribute("unitName");

  // TODO Include number of sessions (requires parsing)
}

/**
 * Create a human-readable overview of the class to be used in the class output
 */
function getClassOverview(classData) {
  return classData.getAttribute("day") + " " +
    classData.getAttribute("start") + " - " +
    classData.getAttribute("end") + " " +
    classData.getAttribute("location");
}

/**
 * Add a new class
 */
function addClass(classElement) {
  classElement.selected = true;

  // Remove the event previes
  var cal = $(".calendar");
  cal.fullCalendar("removeEvents", "preview");

  // Add a button to remove the selected class
  classElement.prepend(crel("div", {
    "class": "list-button remove-class",
    "aria-hidden": true
  }, "x"));

  // Add the event to the calendar and perform checks
  checkClassOverlap(classElement);
  addClassEvent(cal, classElement);
  updateClassSelected(classElement);
  addDuplicateBadge(classElement);
  generateClassOutput();
}

/**
 * Update the selected status of a class in localStorage
 */
function updateClassSelected(classElement) {
  // Get the class data
  var unitID = classElement.getAttribute("unitid");
  var classIndex = classElement.getAttribute("classIndex");

  // Update the 'selected' state in localStorage
  var storedData = JSON.parse(localStorage.getItem("unitData")) || {};
  storedData[unitID].classes[classIndex].selected = classElement.selected;
  localStorage.setItem("unitData", JSON.stringify(storedData));
}

/**
 * Add a new class event to the calendar
 */
function addClassEvent(calendar, classData) {
  calendar.fullCalendar("renderEvent", {
    id: getClassID(classData),
    title: getClassText(classData),
    start: Date.parse(classData.getAttribute("day") + " " + classData.getAttribute("start")),
    end: Date.parse(classData.getAttribute("day") + " " + classData.getAttribute("end")),
    className: classData.getAttribute("classType").toLowerCase()
  });
}

/**
 * Remove a class event from the calendar
 */
function removeClassEvent(calendar, classData) {
  calendar.fullCalendar("removeEvents", getClassID(classData));
  classData.selected = false;
  $(classData).find(".remove-class").remove();
}

/**
 * Remove a unit from localStorage
 */
function removeUnit(unitID) {
  var storedData = JSON.parse(localStorage.getItem("unitData")) || {};
  delete storedData[unitID];
  localStorage.setItem("unitData", JSON.stringify(storedData));
}

/*
 * Create an event to be added to the calendar
 */
function createEvent(classData) {
  return {
    id: "preview",
    title: getClassText(classData),
    start: Date.parse(classData.getAttribute("day") + " " + classData.getAttribute("start")),
    end: Date.parse(classData.getAttribute("day") + " " + classData.getAttribute("end")),
    className: "preview " + classData.getAttribute("classType").toLowerCase()
  };
}

/**
 * Add a class preview to the calendar
 */
function previewClass(calendar, classData) {
  // Check if the class has been added to the calendar
  if (!classData.selected) {
    // Add the event details to the calendar as a preview
    calendar.fullCalendar("renderEvent", createEvent(classData));
  } else {
    // Find the event on the calendar and make it a preview
    var id = getClassID(classData);
    var events = $(".calendar").fullCalendar("clientEvents", id);
    if (events[0].className.indexOf("preview") === -1) {
      events[0].className.push("preview");
      calendar.fullCalendar("updateEvent", events[0]);
    }
  }
}

/*
 * Add a list of class previews to the calendar
 */
function previewClasses(calendar, classData) {
  // Convert the list of classes into events
  var events = [];
  var len = classData.length, i = 0;
  for (i; i < len; i++) {
    var event = createEvent(classData[i]);
    events.push(event);
  }

  // Render all of the events together
  calendar.fullCalendar("renderEvents", events);
}

/**
 * Remove a class preview from the calendar
 */
function removeClassPreview(calendar, classData) {
  // Get the event from the calendar
  var id = getClassID(classData);
  var events = calendar.fullCalendar("clientEvents", id);

  // Check if the preview for this class exists
  if (events.length === 1) {
    // Remove the preview' className
    var index = events[0].className.indexOf("preview");
    if (index > -1) {
      events[0].className.splice(index, 1);
      calendar.fullCalendar("updateEvent", events[0]);
    }
  }
}

/**
 * Extract the beginning and end of a class element
 */
function getTimes(classElement) {
  var day = classElement.getAttribute("day");
  var start = Date.parse(day + " " + classElement.getAttribute("start"));
  var end = Date.parse(day + " " + classElement.getAttribute("end"));

  return {
    "start": start,
    "end": end
  };
}

/**
 *
 */
function checkClassOverlap(newClass) {
  // Check if there are at least two classes
  var selectedClasses = $(".classes").find(".class:selected").not(newClass);
  var len = selectedClasses.length, i = 0;
  if (len < 1) {
    return false;
  }

  var newClassTimes = getTimes(newClass);

  for (i; i < len; i++) {
    var oldClass = selectedClasses[i];
    var oldClassTimes = getTimes(oldClass);

    if (newClassTimes.start < oldClassTimes.end && newClassTimes.end > oldClassTimes.start) {
      // TODO Make sure these classes aren't meant to overlap (e.g. PR1 & PR2)
      // TODO Add "do not ask again" checkbox
      $.confirm({
        title: "Class Overlap!",
        content: "This new class:<br>" + getClassText(newClass) + "<br><br>" +
        "Clashes with the old:<br>" + getClassText(oldClass) + "<br><br>" +
        "Which should be kept?",
        buttons: {
          both: { /* Do nothing */ },
          old: {
            keys: ["esc"],
            action: function() {
              // Remove the new class from sidebar and the calendar
              $(newClass).find(".remove-class")[0].click();
              removeClassEvent($(".calendar"), newClass);
            }
          },
          new: {
            btnClass: "btn-primary",
            keys: ["enter"],
            action: function() {
              // Remove the old class from sidebar and the calendar
              $(oldClass).find(".remove-class")[0].click();
              removeClassEvent($(".calendar"), oldClass);
            }
          }
        }
      });

      // Break the loop so we don't keep checking classes
      return false;
    }
  }
}

/**
 * Restore saved subjects from localStorage
 * TODO Delay injected import until this has completed, or check for duplicates within this function.
 * BUG: This may be run after importing from inject script, causing duplicate units.
 */
function loadClassData(calendar) {
  var unitData = JSON.parse(localStorage.getItem("unitData")) || {};
  for (var unitID in unitData) {
    if (unitData.hasOwnProperty(unitID)) {
      updateUnitList(unitData[unitID]);
    }
  }

  var classes = $(".classes").find(".class:selected");
  var len = classes.length, i = 0;
  for (i; i < len; i++) {
    addClass(classes[i]);
  }
}

/**
 * Save subjects into localStorage
 */
function saveClassData() {
  // TODO Store selected unit in localStorage

  // var storedData = JSON.parse(localStorage.getItem("unitData")) || {};
  // storedData[unitID].classes[c].selected = selected;
  // localStorage.setItem("unitData", JSON.stringify(storedData));
  //
  // // TODO Fix this mess
  // var units = $(".class-container").find(".class-list");
  // var ulen = units.length; u = 0;
  // for (u; u < ulen; u++) {
  //   var classes = $(units[u]).find(".class");
  //   var clen = classes.length; c = 0;
  //   for (c; c < clen; c++) {
  //     var selected = classes[c].selected;
  //     var unitID = $(units[u]).find(".unit-name").text();
  //     storedData[unitID].classes[c].selected = selected;
  //   }
  // }
  //
  // localStorage.setItem("unitData", JSON.stringify(storedData));

}

/**
 * Add a warning badge for duplicate classes to the class type heading
 */
function addDuplicateBadge(classData) {
  var classCount = $(classData.parentNode).find(".class:selected").length;
  if (classCount > 1) {
    var title = $(classData.parentNode).find(".class-type");
    if (!title.has(".duplicate-badge").length) {
      title.prepend(crel("div", {
          "class": "list-button duplicate-badge",
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
  var classCount = $(classData.parentNode).find(".class:selected").length;
  if (classCount < 2) {
    $(classData.parentNode).find(".duplicate-badge").remove();
  }
}
