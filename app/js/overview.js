/**
 * Generate a new unit card to contain unit details
 */
function newUnitCard(unitID, unitName) {
  var cardHeader = crel("h3", {
    "class": "card-header"
  }, crel("div", {
    "class": "card-link",
  }), unitID + " - " + unitName);

  var cardBody = crel("div", {
    "class": "card-body"
  });

  var card =  crel("div", {
    "class": "card " + unitID
  }, cardHeader, cardBody );

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
    "class": "card-text " + classType
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
  $(cardRow).children(".column").empty(); // Clear what was there before

  var selectedClasses = $(".class:selected");
  var numSelectedClasses = selectedClasses.length, i = 0;
  for (i; i < numSelectedClasses; i++) {
    // Check if there is a card for this unit
    var unitElement = ($(selectedClasses[i]).parents().eq(2))[0];
    var unitID = unitElement.getAttribute("unitID");
    var unitName = unitElement.getAttribute("unitName");
    var unitCard = $(".card." + unitID);
    if (unitCard.length < 1) {
      // Create the unit card
      unitCard = newUnitCard(unitID, unitName);

      // TODO Consider replacing Salvattore with Masonry for gap-filling
      salvattore.appendElements(cardRow[0], [unitCard]);
    }

    // Check if there is a type header (e.g. LEC) for this class
    var classTypeElement = selectedClasses[i].parentNode;
    var classType = classTypeElement.getAttribute("classType");
    var unitCardBody = $(unitCard).children(".card-body");
    var typeBlock = $(unitCardBody).find(".card-text." + classType);
    if (typeBlock.length < 1) {
      // Create new type block
      typeBlock = newCardBlock(selectedClasses[i]);
      unitCardBody.append(typeBlock);
    }

    // Get the class-text
    // TODO Convert 12-hour to 24-hour time format
    var cardText = crel("p", {
      "class": "card-text"
    }, Class.getOverview(selectedClasses[i]));
    typeBlock.append(cardText);
  }
}

/**
 * Update the classes displayed in the unit cards
 */
function updateClassOutput(classElement) {
  // Get the card to modify
  const unitID = Class.getUnitID(classElement);
  var unitOverview = document.getElementById("unitOverview");
  var unitCard = $(unitOverview).find(".card." + unitID);

  // Get the class-type block to modify
  var classTypeElement = classElement.parentNode;
  var classType = classTypeElement.getAttribute("classType");
  var classBlock = $(unitCard).find(".card-body > .card-text." + classType);

  // Regenerate the classes of this type
  var selectedClasses = $("[unitID=" + unitID + "] [classType=" + classType + "] .class:selected");
  var numSelectedClasses = selectedClasses.length, i = 0;
  var classTextList = [];
  for (i; i < numSelectedClasses; i++) {
    // Get the class-text
    var cardText = crel("p", {
      "class": "card-text"
    }, Class.getOverview(selectedClasses[i]));

    classTextList[i] = cardText;
  }

  // Check if the list of selected classes is empty
  if (classTextList.length === 0) {
    // Remove the class type block
    $(classBlock).remove();
  } else {
    // Replace the list of classes
    $(classBlock).find(".card-text").remove();
    classBlock.append(classTextList);
  }

}
