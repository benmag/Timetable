/**
 * Toggle the visibility of the sidebar
 */
$("#menu-toggle").click(function(e) {
  e.preventDefault();
  $(".wrapper").toggleClass("toggled");
});

/**
 * Set an appropriate max-height for the current class list and show it
 */
function slideDownCurrentList(currentList, allLists) {
  // TODO Replace jQuery functions with vanilla Javascript to boost performance
  currentList.removeAttribute("max-height");
  $(currentList).slideDown();

  var underOffset = 0;
  if (allLists.length > 1) {
    var listsUnderCurrent = allLists.length - $(currentList).index(".classes") - 1;
    underOffset = listsUnderCurrent * $(currentList).prev(".unit-name").height();
  }

  maxHeight = Math.max(window.innerHeight - currentList.offsetTop - underOffset, 150);
  currentList.style.maxHeight = maxHeight + "px";
}

/**
 * Handle sidebar height adjustments when the window is resized
 */
$(window).resize(function() {
  var currentList = $(".class-container").find(".classes:visible");
  if (currentList.length === 1) {
    var allLists = $(".class-container").find(".classes");
    slideDownCurrentList(currentList[0], allLists);
  }
});
