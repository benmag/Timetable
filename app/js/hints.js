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
  $("#hints").append(hint);
}
