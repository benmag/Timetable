/**
 * Generate a new unit card to contain unit details
 */
function newUnitColumn(unitID) {
  var cardHeader = crel("h3", {
    "class": "card-header"
  }, unitID, crel("div", {
    "class": "card-link",
  }));

  var card =  crel("div", {
    "class": "card " + unitID
  }, cardHeader /* , _cardBlock_ */ );

  return card;
}

/**
 * Generate a new unit card block to contain class details
 */
function newCardBlock(classElement) {
  var classTypeElement = classElement.parentNode;
  var className = classElement.getAttribute("className");
  var cardTitle = crel("h4", {
    "class": "card-title"
  }, className);

  var classType = classTypeElement.getAttribute("classType");
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
  var cardRow = $("#unitOverview");
  cardRow.empty(); // Clear what was there before

  var selectedClasses = $(".class:selected");
  var len = selectedClasses.length, i = 0;
  for (i; i < len; i++) {
    // Check if there is a card for this unit
    var unitElement = ($(selectedClasses[i]).parents().eq(2))[0];
    var unitID = unitElement.getAttribute("unitID");
    var unitCard = $(".card." + unitID);
    if (unitCard.length < 1) {
      // Create the unit card
      unitCard = newUnitColumn(unitID);
      cardRow.append(unitCard);
    }

    // Check if there is a type header for this class
    var classTypeElement = selectedClasses[i].parentNode;
    var classType = classTypeElement.getAttribute("classType");
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
