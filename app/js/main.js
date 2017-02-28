// TODO Replace jQuery functions with vanilla Javascript to boost performance
// TODO Replace showError() checks with new JSON-oriented validation

/* GLOBAL */
var ENTER_KEY = 13;
var hasError = false;

/**
 * Show an error message with available solutions
 */
function showError(text) {
  if (!hasError) {
    hasError = true;

    $.confirm({
      title: 'Oh no! An error has occurred!',
      content: text + "</br></br>" + "How would you like to handle the issue?",
      type: 'red',
      buttons: {
        // TODO Add a button to automatically re-import all units
        fixManually: {
          text: 'Fix Manually'
        },
        removeData: {
          text: 'Remove Data',
          btnClass: 'btn-danger',
          action: function(){
            hasError = false;
            // TODO Clear localStorage and refresh data on page
          }
        },
      }
    });

  }
}

$(document).ready(function() {
  jconfirm.defaults = {
    backgroundDismiss: true
  };

  // Load the campus selector options for unit search
  getSemesterIDs().done(function() {
    // Load the previous campus into the dropdown
    loadCampus();
  }).fail(function() {
    // TODO Show an error or retry
  });

  // Load the helpful hints underneath the calendar
  loadHint();

  // Initialize the calendar
  var cal = $("#calendar").fullCalendar({
    header: false,
    allDaySlot: false,
    allDayDefault: false,
    defaultView: "agendaWeek",
    displayEventTime: false,
    editable: false,
    minTime: "08:00:00",
    maxTime: "22:00:00",
    height: "auto",
    columnFormat: "ddd",
    slotEventOverlap: false,
    weekends: false,
    tooltip: ('<div class="tooltip_title">' + 'title' + '</div>' + '<div>' + '10:00 to 12:00'+ '<br>' +' doing this' + '</div>')
  });

  // Load the class data into the sidebar and calendar
  loadClassData(cal);

  /**
   * Trigger a search when the user presses the Enter key in the search bar
   */
  $("#unit-search").keyup(function(e) {
    if (e.keyCode === ENTER_KEY) {
      var searchText = $(this).val().trim();
      if (searchText !== "") {
        var semesterID = $("#campus-selector").val();

        // Determine if search is a unit code or unit description
        var unitCodeRegex = /\b[a-zA-Z]{3}\d{3}\b/; // 3 letters, 3 digits
        if (unitCodeRegex.test(searchText)) {
          searchUnitCode(searchText, semesterID);
        } else {
          searchDescription(searchText, semesterID);
        }
      }

      // Select the text, ready for the next search
      $(this).select();
    }
  });

  /**
   * Open a new tab to the user's enrolled units
   */
  $("#view-enrolled").click(function(e) {
    window.open("https://qutvirtual3.qut.edu.au/qv/ttab_student_p.show");
  });

  /**
   * Show or hide the classes for an imported subject
   */
  $(document).on("click", ".unit-name", function() {
    var currentList = this.nextSibling;

    // Determine if the current list is showing
    if (currentList.style.display == "none") {
      var allLists = $(this.parentNode.parentNode).find(".classes");
      var allVisible = allLists.filter(":visible");

      // Hide any visible class lists before showing the clicked list
      if (allVisible.length !== 0) {
        allVisible.slideUp(function() {
          slideDownCurrentList(currentList, allLists);
        });
      } else {
        slideDownCurrentList(currentList, allLists);
      }
    } else {
      $(currentList).slideUp();
    }
  });

  /**
   * Preview all same-type classes when the user hovers over a class-type heading
   */
  $(document).on("mouseover", ".class-type", function() {
    var classes = $(this.parentNode).find(".class").not(":selected");
    previewClasses(cal, classes);
  });

  /**
   * Preview a class on the calendar when the user hovers over it in the sidebar
   */
  $(document).on("mouseover", ".class", function() {
    previewClass(cal, this);
  });

  /**
   * Remove higlight once user stops hovering over a selected class
   */
  $(document).on("mouseout", ".class:selected", function() {
    removeClassPreview(cal, this);
  });

  /**
   * Remove previews once user stops hovering over a class or class-type heading
   */
  $(document).on("mouseout", ".classes", function() {
    cal.fullCalendar("removeEvents", "preview");
  });

  /**
   * Add the class to the calendar when the user clicks on it
   */
  $(document).on("click", ".class-text", function() {
    // If the class is selected, it is already on the calendar
    var classElement = this.parentNode;
    if (!classElement.selected) {
      addClasses(classElement);
    }
  });

  /**
   * Remove a selected class from the calendar and its 'remove-class' button
   */
  $(document).on("click", ".remove-class", function() {
    var classElement = this.parentNode;
    removeClass(classElement);
  });

  /**
   * Remove a unit from the list of imported units in the sidebar
   */
  $(document).on("click", ".remove-unit", function() {
    var unitHeader = $(this).parent();

    // Remove all classes from this unit
    var subjectCode = unitHeader.find(".unit-name").text();
    cal.fullCalendar("removeEvents", function(event) {
      return (event.id.indexOf(subjectCode) > -1);
    });

    // Remove the unit listing
    unitHeader.remove();
    removeUnit(subjectCode);
    generateClassOutput();

    // Trigger a resize event to resize the sidebar
    $(window).trigger("resize");
  });

  /**
   * Save the current campus so we don't have to keep changing the dropdown
   */
  $(document).on("change", "#campus-selector", function() {
    localStorage.setItem("currentCampus", this.value);
  });

  /**
   * Open a new tab to the selected unit's outline
   */
  $(document).on("click", ".card-link", function() {
    var unitID = this.parentNode.textContent;
    window.open("https://www.qut.edu.au/study/unit?unitCode=" + unitID);
  });

});
