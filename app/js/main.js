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

jconfirm.defaults = {
  backgroundDismiss: true
};

// Load the campus selector options for unit search
getSemesterIDs().done(function() {
  // Load the previous campus into the dropdown
  loadCampus();
}).fail(function() {
  // TODO Retry
  $("#campus-selector").
  alert("Unable to retrieve QUT semesters. The search will not function.");
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
  windowResize: function(view) {
    if ($(window).width() < 576) {
      $('#calendar').fullCalendar('changeView', 'listWeek');
    } else {
      $('#calendar').fullCalendar('changeView', 'agendaWeek');
    }
  }
});

Class.load(cal);

/**
 * Open a new tab to the selected unit's outline
 */
$(document).on("click", ".card-link", function() {
  var unitID = this.parentNode.textContent.substring(0, 6);
  window.open("https://www.qut.edu.au/study/unit?unitCode=" + unitID);
});
