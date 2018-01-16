/**
 * Create a unique identifier for classes on the calendar, following the
 * Format: [unitID][classIndex]
 */
function getClassID(classElement) {
  const unitElement = ($(classElement).parents().eq(2))[0],
        unitID = unitElement.getAttribute("unitID"),
        classIndex = classElement.getAttribute("classIndex");
  return unitID + classIndex;
}

/**
 * Create a human-readable description of the class to be used in the calendar
 */
function getClassText(classElement) {
    const classTypeElement = classElement.parentNode,
          unitElement = ($(classElement).parents().eq(2))[0];
    return `${unitElement.getAttribute("unitID")}
            ${classTypeElement.getAttribute("classType")} `+ 
           `${classElement.getAttribute("location")}\n
            ${unitElement.getAttribute("unitName")}`;

  // TODO Include number of sessions (requires parsing)
}

/**
 * Create a human-readable overview of the class to be used in the class output
 */
function getClassOverview(classElement) {
    return `${classElement.getAttribute("day")}
            ${classElement.getAttribute("start")} - 
            ${classElement.getAttribute("end")}
            ${classElement.getAttribute("location")}`;
}

/**
 * Add a list of classes
 */
function addClasses(classes) {
    if (classes.length> 0) for (i = 0; i < classes.length; i++) {
        addClass(classes[i]);
    }
    generateClassOutput();
}

/**
 * Add a new class to the calendar
 */
function addClass(classElement) {
    classElement.selected = true;

    // Remove the event previes
    const cal = $("#calendar");
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
    updateClassBadges(classElement);
    updateClassOutput(classElement);
}

/**
 * Remove an existing class from the calendar
 */
function removeClass(classElement) {
    const cal = $("#calendar");
    removeClassEvent(cal, classElement);
    updateClassSelected(classElement);
    updateClassBadges(classElement);
    updateClassOutput(classElement);
}

/**
 * Update the selected status of a class in localStorage
 */
function updateClassSelected(classElement) {
    // Get the class data
    const unitElement = ($(classElement).parents().eq(2))[0],
          unitID = unitElement.getAttribute("unitID"),
          classIndex = classElement.getAttribute("classIndex");

    // Update the 'selected' state in localStorage
    let storedData = JSON.parse(localStorage.getItem("unitData")) || {};
    storedData[unitID].classes[classIndex].selected = classElement.selected;
    localStorage.setItem("unitData", JSON.stringify(storedData));
}

/**
 * Add a new class event to the calendar
 */
function addClassEvent(calendar, classElement) {
    const classTypeElement = classElement.parentNode;
    calendar.fullCalendar("renderEvent", {
        id: getClassID(classElement),
        title: getClassText(classElement),
        start: Date.parse(`${classElement.getAttribute("day")} ${classElement.getAttribute("start")}`),
        end: Date.parse(`${classElement.getAttribute("day")} ${classElement.getAttribute("end")}`),
        className: classTypeElement.getAttribute("classType").toLowerCase()
    });
}

/**
 * Remove a class event from the calendar
 */
function removeClassEvent(calendar, classElement) {
    calendar.fullCalendar("removeEvents", getClassID(classElement));
    classElement.selected = false;
    $(classElement).find(".remove-class").remove();
}

/**
 * Remove a unit from localStorage
 */
function removeUnit(unitID) {
    let storedData = JSON.parse(localStorage.getItem("unitData")) || {};
    delete storedData[unitID];
    localStorage.setItem("unitData", JSON.stringify(storedData));
}

/*
 * Create an event to be added to the calendar
 */
function createEvent(classElement) {
    const classTypeElement = classElement.parentNode;
    return {
        id: "preview",
        title: getClassText(classElement),
        start: Date.parse(`$(classElement.getAttribute("day")) ${classElement.getAttribute("start")}`),
        end: Date.parse(`$(classElement.getAttribute("day") ${classElement.getAttribute("end")}`),
        className: `preview ${classTypeElement.getAttribute("classType").toLowerCase()}`
    };
}

/**
 * Add a class preview to the calendar
 */
function previewClass(calendar, classElement) {
    // Check if the class has been added to the calendar
    if (!classElement.selected) {
        // Add the event details to the calendar as a preview
        calendar.fullCalendar("renderEvent", createEvent(classElement));
    } else {
        // Find the event on the calendar and make it a preview
        const id = getClassID(classElement);
        let events = $("#calendar").fullCalendar("clientEvents", id);
        if (events[0].className.indexOf("preview") === -1) {
            events[0].className.push("preview");
            calendar.fullCalendar("updateEvent", events[0]);
        }
    }
}

/*
 * Add a list of class previews to the calendar
 */
function previewClasses(calendar, classElements) {
    // Generate list of events from classes
    let events = [];
    [].slice.call(classElements).forEach((v, i, o) => {
        events.push(createEvent(v))
    })
    console.log(events);
    // Render all of the events together
    calendar.fullCalendar("renderEvents", events);
}

/**
 * Remove a class preview from the calendar
 */
function removeClassPreview(calendar, classElement) {
    // Get the event from the calendar
    let id = getClassID(classElement),
        events = calendar.fullCalendar("clientEvents", id);

    // Check if the preview for this class exists
    if (events.length === 1) {
        // Remove the preview' className
        const index = events[0].className.indexOf("preview");
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
    const day = classElement.getAttribute("day"),
          start = Date.parse(day + " " + classElement.getAttribute("start")),
          end = Date.parse(day + " " + classElement.getAttribute("end"));
    return {
        "start": start,
        "end": end
    };
}

/**
 * Determine if any selected classes are overlapping
 */
function checkClassOverlap(newClass) {
    // Check if there are at least two classes
    const selectedClasses = $(".classes").find(".class:selected").not(newClass),
          len = selectedClasses.length;
    
    // Break as conflict is impossible
    if (len < 1) return false;
  
    const newClassTimes = getTimes(newClass);

    for (let i=0; i < len; i++) {
        const oldClass = selectedClasses[i],
              oldClassTimes = getTimes(oldClass);

        if (newClassTimes.start < oldClassTimes.end && newClassTimes.end > oldClassTimes.start) {
          // TODO Make sure these classes aren't meant to overlap (e.g. PR1 & PR2)
          // TODO Add "do not ask again" checkbox
            $.confirm({
                title: "Class Overlap!",
                content: `This new class:<br> ${getClassText(newClass)} <br><br>
                          Clashes with the old:<br> ${getClassText(oldClass)} + <br><br>
                          Which should be kept?`,
                buttons: {
                    both: { /* Do nothing */ },
                        old: {
                        keys: ["esc"],
                        action: function() {
                          removeClass(newClass);
                        }
                    }, new: {
                        btnClass: "btn-primary",
                        keys: ["enter"],
                        action: function() {
                          removeClass(oldClass);
                    }}
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
    const unitData = JSON.parse(localStorage.getItem("unitData")) || {};
    for (let unitID in unitData) if (unitData.hasOwnProperty(unitID)) updateUnitList(unitData[unitID]);
    const classes = $(".classes").find(".class:selected");
    addClasses(classes);
}

/**
 * Add a warning badge for duplicate classes or a done badge for valid ones
 */
function updateClassBadges(classElement) {
    const classCount = $(classElement.parentNode).find(".class:selected").length,
          title = $(classElement.parentNode).find(".class-type");

    // Check to see if a status badge should be added
    if (classCount == 1 && !title.has(".badge-done").length) {
        title.prepend(crel("div", {
                "class": "list-button badge-done",
                "title": "Done!"
            }, crel("img", {
                "src": "img/done.png"
            })
        ));
    } else {
        title.prepend(crel("div", {
                "class": "list-button badge-warn",
                "title": "Duplicate classes!"
            }, crel("img", {
                "src": "img/warn.png"
            })
        ));
    }

    // Remove the warning badge
    if (classCount < 2) $(classElement.parentNode).find(".badge-warn").remove();
 
    // Remove the done badge
    if (classCount !== 1) $(classElement.parentNode).find(".badge-done").remove();
}