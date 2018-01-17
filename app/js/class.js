let Class = {
    // Grabs unit element from class element
    getUnitElement: (element)=>($(element).parents().eq(2))[0],
    
    // Grabs unit index from class element
    getUnitID: function(element){
        return this.getUnitElement(element).getAttribute("unitID");
    },
    
    // Grabs class index from class element
    getClassIndex: (element) => element.getAttribute("classIndex"),
    
    // Grabs ID & Index Data
    getMarkers: (element) => [Class.getUnitID(element), Class.getClassIndex(element)],
    
    //Create a unique identifier for classes on the calendar, [unitID][classIndex]
    getUID: function (classElement) {
        return this.getUnitID(classElement) + this.getClassIndex(classElement);
    },
    
    // Generates textual description of class
    getDescription: (classElement) => {
        const classTypeElement = classElement.parentNode,
          unitElement = ($(classElement).parents().eq(2))[0];
        return `${unitElement.getAttribute("unitID")}
                ${classTypeElement.getAttribute("classType")} `+ 
               `${classElement.getAttribute("location")}\n
                ${unitElement.getAttribute("unitName")}`;
    },
    
    // Creates a human-readable overview of the class to be used in the class output
    getOverview: (classElement) => {
        return `${classElement.getAttribute("day")}
                ${classElement.getAttribute("start")} - 
                ${classElement.getAttribute("end")}
                ${classElement.getAttribute("location")}`;
    },
    
    // Extracts the beginning and end times of a class element
    getTimes: (classElement) => {
        const day = classElement.getAttribute("day"),
              start = Date.parse(`${day} ${classElement.getAttribute("start")}`),
              end = Date.parse(`${day} ${classElement.getAttribute("end")}`);
        return {
            "start": start,
            "end": end
        };
    },
    
    // Add a list of classes 
    addMulti: (classes) => {
        if (classes.length> 0) for (i = 0; i < classes.length; i++) Class.add(classes[i]);
        generateClassOutput();
    },
    
    // Generate preview event to be added to calendar
    genPreview: (classElement) => ({
        id: "preview",
        title: Class.getDescription(classElement),
        start: Date.parse(Class.getTimes(classElement).start),
        end:  Date.parse(Class.getTimes(classElement).end),
        className: `preview ${classElement.parentNode.getAttribute("classType").toLowerCase()}`
    }),
    
    
    // Re-gen class related dom material
    update: {
        main: (classEle) => {
            Class.save(classEle);
            Class.update.badges(classEle);
            updateClassOutput(classEle);
        },
        badges: (classEle) => {
            const classCount = $(classEle.parentNode).find(".class:selected").length,
                  title = $(classEle.parentNode).find(".class-type");

            if (classCount != 0 && !title.has(`.badge-${classCount == 1 ? 'done' : 'warn'}`).length){
                title.prepend(crel("div", {
                        "class": `list-button badge-${classCount == 1 ? 'done' : 'warn'}`,
                        "title": "Done!"
                    }, crel("img", {
                        "src": `img/${classCount == 1 ? 'done' : 'warn'}.png`
                    })
                ));
            }

            // Remove the warning badge
            if (classCount < 2) $(classEle.parentNode).find(".badge-warn").remove();

            // Remove the done badge
            if (classCount !== 1) $(classEle.parentNode).find(".badge-done").remove();
        }
    },
    
    // Add a new class to the calendar
    add: (classEle) => {
        classEle.selected = true;
        let cal = $("#calendar");
        cal.fullCalendar("removeEvents", "preview");
        classEle.prepend(crel("div", {
            "class": "list-button remove-class",
            "aria-hidden": true
        }, "x"));
        Class.checkOverlap(classEle);
        Class.addCalEvent(cal, classEle);
        Class.update.main(classEle);
    },
    
    // Remove an existing class from the calendar
    remove: (classEle) => {
        Class.removeCalEvent($("#calendar"), classEle);
        Class.update.main(classEle);
    },
    
    // Add class calendar event to calendar
    addCalEvent: (cal, classEle) => {
        cal.fullCalendar("renderEvent", {
            id: Class.getUID(classEle),
            title: Class.getDescription(classEle),
            start: Date.parse(Class.getTimes(classEle).start),
            end:  Date.parse(Class.getTimes(classEle).end),
            className: classEle.parentNode.getAttribute("classType").toLowerCase()
        });
    },
    
    // Update the selected status of a class in localStorage
    save: (classEle) => {
        let storedData = JSON.parse(localStorage.getItem("unitData")) || {},
            [unitID, classIndex] = Class.getMarkers(classEle);
        storedData[unitID].classes[classIndex].selected = classEle.selected;
        localStorage.setItem("unitData", JSON.stringify(storedData));
    }, 
    
    // Load saved classes from local storage
    load: (cal) => {
        const unitData = JSON.parse(localStorage.getItem("unitData")) || {};
        for (let unitID in unitData) if (unitData.hasOwnProperty(unitID)) updateUnitList(unitData[unitID]);
        Class.addMulti($(".classes").find(".class:selected"));
    },
    
    // Check for class overlaps
    checkOverlap: (newClass) => {
        // Check if there are at least two classes
        const selectedClasses = $(".classes").find(".class:selected").not(newClass),
              len = selectedClasses.length;

        // Break as conflict is impossible
        if (len < 1) return false;

        const newClassTimes = Class.getTimes(newClass);

        for (let i=0; i < len; i++) {
            const oldClass = selectedClasses[i],
                  oldClassTimes = Class.getTimes(oldClass);

            if (newClassTimes.start < oldClassTimes.end && newClassTimes.end > oldClassTimes.start) {
              // TODO Make sure these classes aren't meant to overlap (e.g. PR1 & PR2)
              // TODO Add "do not ask again" checkbox
                $.confirm({
                    title: "Class Overlap!",
                    content: `This new class:<br> ${Class.getDescription(newClass)} <br><br>
                              Clashes with the old:<br> ${Class.getDescription(oldClass)} + <br><br>
                              Which should be kept?`,
                    buttons: {
                        both: { /* Do nothing */ },
                            old: {
                            keys: ["esc"],
                            action: function() {
                              Class.remove(newClass);
                            }
                        }, new: {
                            btnClass: "btn-primary",
                            keys: ["enter"],
                            action: function() {
                              Class.remove(oldClass);
                        }}
                    }
                });

                // Break the loop so we don't keep checking classes
                return false;
            }
        }
    },
    
    // Remove class element from calendar element
    removeCalEvent: (cal, classEle) => {
        cal.fullCalendar("removeEvents", Class.getUID(classEle));
        classEle.selected = false;
        $(classEle).find(".remove-class").remove();
    },
    
    // Remove a unit from local storage
    removeUnit: (unitID) => {
        let storedData = JSON.parse(localStorage.getItem("unitData")) || {};
        delete storedData[unitID];
        localStorage.setItem("unitData", JSON.stringify(storedData));
    },
    
    // Add a class preview to the calendar
    preview: (cal, classEle) => {
        // Check if the class has been added to the calendar
        if (!classEle.selected) {
            // Add the event details to the calendar as a preview
            cal.fullCalendar("renderEvent", Class.genPreview(classEle));
        } else {
            // Find the event on the calendar and make it a preview
            const id = Class.getUID(classEle);
            let events = $("#calendar").fullCalendar("clientEvents", id);
            if (events[0].className.indexOf("preview") === -1) {
                events[0].className.push("preview");
                cal.fullCalendar("updateEvent", events[0]);
            }
        }
    },
    
    //
    previewAll: (cal, classEle) => {
        let events = [];
        for (let i=0; i < classEle.length; i++) events.push(Class.genPreview(classEle[i]));
        cal.fullCalendar("renderEvents", events);
    },
    
    // Remove a class preview from the calendar
    removePreview: (cal, classEle) => {
        // Get the event from the calendar
        let id = Class.getUID(classEle),
            events = cal.fullCalendar("clientEvents", id);

        // Check if the preview for this class exists
        if (events.length === 1) {
            // Remove the preview' className
            const index = events[0].className.indexOf("preview");
            if (index > -1) {
                    events[0].className.splice(index, 1);
                    cal.fullCalendar("updateEvent", events[0]);
            }
        }
    }
}