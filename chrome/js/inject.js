
$(function() {

  var subject;  // hold all the imported times

  /**
   * Shows buttons to allow the user to import subjects into the timetabler
   */
  function showImportButton() {
    // CSS to style our buttons
    $('head').append(`<style type='text/css'>
      .btn {
        color: #fff;
        background-color: #1E88E5; /* Blue */
        display: inline-block;
        padding: 6px 12px;
        margin-bottom: 0;
        font-size: 14px;
        font-weight: 400;
        line-height: 1.42857143;
        text-align: center;
        white-space: nowrap;
        vertical-align: middle;
        ms-touch-action: manipulation;
        touch-action: manipulation;
        cursor: pointer;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        background-image: none;
        border: 1px solid transparent;
        border-radius: 4px;
        margin-bottom: 10px;
      }

      .importAllButton {
        background-color: #F44336; /* Red */
      }
    </style>`);

    // Add import button to each subject
    $('.qv_table').prepend('<button class="btn importButton">Subject Found. Import Classes?</button>');

    // Add importAll button if more than one subject exists
    if ($('.qv_table').length > 1) {
      $('.divider:nth-of-type(1)').prepend('<button class="btn importAllButton">Multiple Subjects Found. Import ALL Classes?</button>');
    }
  }

  /**
   * Handles the importing of class times. Grabs the data from the table and sends it to the timetabler page
   */
  function importClasses(table) {
    // Get the unit ID and subject name from above the table
    var subject_name = '';

    // Current enrollment page
    if (location.pathname == "/qv/ttab_student_p.show")
      subject_name = $.trim($(table).prev().prev().find('strong').html());
    else // Search page
      subject_name = $.trim($(table).prev().prev().prev().prev().html());

    var unit = subject_name.split(' ')[0];

    // Create a new array for the unit
    subject = { 'unit': unit, 'subject': subject_name };
    subject['times'] = [];

    // Loop through table and get times
    $(table).find('tr:not(:first-child)').each(function (index, element) {
      // Construct an object containing the row information
      var rows = {
        'subject_name': subject.subject,
        'subject_code': subject.unit,
        'class': $(this).children('td').eq(0).html(),
        'activity': $(this).children('td').eq(1).html(),
        'day': $(this).children('td').eq(2).html(),
        'time':  {
          'raw' : $(this).children('td').eq(3).html(),
          'start' : $(this).children('td').eq(3).html().split("-")[0],
          'end' : $(this).children('td').eq(3).html().split("-")[1],
        },
        'location': $.trim($(this).children('td').eq(4).text()),
        'teaching_staff': $(this).children('td').eq(5).html()
      }

      // Push it in
      subject['times'].push(rows);
    });

    fireCompletionMessage(unit);
  }

  function fireCompletionMessage(unit) {
    // Trigger import complete method in timetable_launcher.js
    chrome.runtime.sendMessage({type: "importComplete", unit: unit, class_info: JSON.stringify(subject)}, function(response) {
      console.log(response)
    });
  }

  // Add the import button to the table
  showImportButton();

  function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds) {
        break;
      }
    }
  }

  // Add an event listener for the import button
  $('button.importButton').bind('click', function() {
    // Check the timetabler is running
    var sender = $(this);

    chrome.runtime.sendMessage({type: "checkTab"}, function(response) {
      if (response == "Done!") {
        // Send the script to sleep before importing classes
        // This ensures the timetabler is ready to receive the classes
        sleep(500);

        // Set the button to show the class has been imported
        sender.css("background-color", "#4CAF50");
        sender.text("Imported!");

        // Import the classes into the timetabler
        importClasses(sender.parent());
      }
    });
  });


  // Add an event listener for the import all button
  $('button.importAllButton').bind('click', function() {
    // Check the timetabler is running
    chrome.runtime.sendMessage({type: "checkTab"}, function(response) {

      // Wait for the timetabler to say it has finished loading
      if (response == "Done!") {

        // Send the script to sleep before importing classes
        // This ensures the timetabler is ready to receive the classes
        sleep(500);

        // Set the butten to show the class has been imported
        $('.btn').each(function() {
          $(this).css("background-color", "#4CAF50");
          $(this).text("Imported!");
        });

        // Import the classes into the timetabler
        $('.qv_table').each(function() {
          importClasses(this);
        });
      }
    });
  });
});
