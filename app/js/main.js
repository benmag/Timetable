// TODO Replace jQuery functions with vanilla Javascript to boost performance
// TODO Replace showError() checks with new JSON-oriented validation

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
            $(".class-container").empty();
            generateClassOutput();
          }
        },
      }
    });

  }
}

function newUnitColumn(unitID) {
  var cardHeader = crel("h3", {
    "class": "card-header"
  }, unitID);

  var card =  crel("div", {
    "class": "card " + unitID
  }, cardHeader /* , _cardBlock_ */ );

  return card;
}

function newCardBlock(classElement) {
  var className = classElement.getAttribute("className");
  var cardTitle = crel("h4", {
    "class": "card-title"
  }, className);

  var classType = classElement.getAttribute("classType");
  var cardBlock = crel("div", {
    "class": "card-block " + classType
  }, cardTitle);

  return cardBlock;
}

/**
 * Generate a nice little output of the classes the user has selected
 * so they can be ready for registration day
 * TODO Make sure this function is only called once per update (check refresh)
 */
function generateClassOutput() {
  // TODO Find a way to organise cards left-to-right to prevent empty columns

  var cardRow = $(".unitOverview");
  cardRow.empty(); // Clear what was there before

  var selectedClasses = $(".class:selected");
  var len = selectedClasses.length, i = 0;
  for (i; i < len; i++) {
    // Check if there is a card for this unit
    var unitID = selectedClasses[i].getAttribute("unitID");
    var unitCard = $(".card." + unitID);
    if (unitCard.length < 1) {
      // Create the unit card
      unitCard = newUnitColumn(unitID);
      cardRow.append(unitCard);
    }

    // Check if there is a type header for this class
    var classType = selectedClasses[i].getAttribute("classType");
    var typeBlock = $(unitCard).find(".card-block." + classType);
    if (typeBlock.length < 1) {
      // Create new type block
      typeBlock = newCardBlock(selectedClasses[i]);
      unitCard.append(typeBlock);
    }

    // Get the class-text
    var cardText = crel("p", {
      "class": "card-text"
    }, getClassOverview(selectedClasses[i]));
    typeBlock.append(cardText);
  }
}

/**
 * Load a hint underneath the calendar
 */
function loadHint() {
  // TODO Load hints from an external source
  var hints = [
    "Hover your mouse over a class type in the sidebar to preview all available classes of that type!",
    "Search for a unit code or description using the search bar at the top-left and pressing 'Enter'!",
    "Use the dropdown in the search bar to select your campus when searching for classes!",
    "New to QUT? We have 3 campuses: Gardens Point (GP), Kelvin Grove (KG) and Caboolture (CB)!",
    "These tips will show every time you refresh the page. Want to see a new one? Ctrl+R!",
    "You can search for a unit code, or a unit description using the 'unit search' box in the sidebar!"
  ];

  // Randomly select a hint from the array
  var hint = hints[Math.floor(Math.random() * hints.length)];
  $(".alert").append(hint);
}

/**
 * Save current units so we don't have to import them every time we refresh
 */
window.onbeforeunload = function() {
  saveClassData();
  saveCampus();
};

$(document).ready(function() {
  jconfirm.defaults = {
    backgroundDismiss: true
  };

  // Load the campus selector options for unit search
  getSemesterIDs().done(function() {
    // Load the previous campus into the dropdown
    loadCampus();
  }).fail(function() {

  });

  // Load the helpful hints underneath the calendar
  loadHint();

  // Initialize the calendar
  var cal = $(".calendar").fullCalendar({
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
    weekends: false
  });

  // Load the class data into the sidebar and calendar
  loadClassData(cal);

  /**
   * Trigger a search when the user presses the Enter key in the search bar
   */
  $("#unit-search").keyup(function(e) {
    if (e.keyCode == 13) { // ENTER_KEY
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
    if (!hasError) {
      var classes = $(this.parentNode).find(".class").not(":selected");
      previewClasses(cal, classes);
    }
  });

  /**
   * Preview a class on the calendar when the user hovers over it in the sidebar
   */
  $(document).on("mouseover", ".class", function() {
    if (!hasError) {
      previewClass(cal, this);
    }
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
    if (!hasError && !classElement.selected) {
      addClass(classElement);
    }
  });

  /**
   * Remove a selected class from the calendar and its 'remove-class' button
   */
  $(document).on("click", ".remove-class", function() {
    var classElement = this.parentNode;
    removeClassEvent(cal, classElement);
    updateClassSelected(classElement);
    removeDuplicateBadge(classElement);
    generateClassOutput();
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

    //Trigger a resize event to resize the sidebar
    $(window).trigger("resize");
  });

});
