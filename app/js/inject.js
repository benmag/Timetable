window.onload = function() {
  if(window.location.href.indexOf(".qut.edu.au/qv") > -1) {
      $(function() {

        // Start our script by adding the import button(s) to the page
        showImportButton();

        /**
         * Shows buttons to allow the user to import subjects into the timetabler
         */
        function showImportButton() {
          // CSS to style our buttons
          $('head').append("<style>.btn{color:#fff;display:inline-block;padding:6px 12px;font-size:14px;font-weight:400;line-height:1.42857143;text-align:center;white-space:nowrap;vertical-align:middle;ms-touch-action:manipulation;touch-action:manipulation;cursor:pointer;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;background-image:none;border:1px solid transparent;border-radius:4px;margin-bottom:10px}.importButton{background-color:#1E88E5}.importAllButton{background-color:#F44336}</style>");

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
        function exportUnitData(table) {
          // Get the unit ID and subject name from above the table
          var unitString;
          if (location.pathname == "/qv/ttab_student_p.show") { // Enrollment page
            unitString = $(table).prev().prev().find("strong").html().trim();
          } else { // Search page
            unitString = $(table).prevAll().eq(3).html();
          }

          // Extract the unit ID (e.g. MAB126) and name (e.g. Mathematics)
          var unitID = unitString.split(" ")[0];
          var unitName = unitString.substr(unitString.indexOf(" ") + 1);

          // Create a new array for the unit
          var unitData = {
            "unitID": unitID,
            "unitName": unitName,
            "classes": []
          };

          // Extract all of the row data from the table
          $(table).find("tr:not(:first-child)").each(function (index, element) {
            var classData = {
              "className": $(this).children("td").eq(0).html(),
              "classType": $(this).children("td").eq(1).html(),
              "day": $(this).children("td").eq(2).html(),
              "time":  { // raw = "11:00AM-01:00PM" or "11:00am - 01:00pm"
                "raw" : $(this).children("td").eq(3).html().toLowerCase().replace("m-", "m - "),
                "start" : $(this).children("td").eq(3).html().split("-")[0].trim(),
                "end" : $(this).children("td").eq(3).html().split("-")[1].trim(),
              },
              "location": $.trim($(this).children("td").eq(4).text()),
              "staff": $(this).children("td").eq(5).html().replace(/(\r\n|\n|\r)/gm,"")
            };

            // Push the row data into our classInfo object
            unitData.classes.push(classData);
          });

          sendUnit(unitData);
        }

        function sendUnit(unitData) {
          // Trigger import complete method in timetable_launcher.js
          //ipcRenderer.sendToHost('classInfo-sent', JSON.stringify(subject));
          var ipcRenderer = require('electron').ipcRenderer;
          ipcRenderer.sendToHost(JSON.stringify(unitData));
        }

        // Add an event listener for the import button
        $('button.importButton').bind('click', function() {
          // Check the timetabler is running
          var sender = $(this);
          // Set the button to show the class has been imported
          sender.css("background-color", "#4CAF50");
          sender.text("Imported!");

          // Import the classes into the timetabler
          exportUnitData(sender.parent());
        });


        // Add an event listener for the import all button
        $('button.importAllButton').bind('click', function() {
          // Set the butten to show the class has been imported
          $('.btn').each(function() {
            $(this).css("background-color", "#4CAF50");
            $(this).text("Imported!");
          });

          // Import the classes into the timetabler
          $('.qv_table').each(function() {
            exportUnitData(this);
          });
        });
      });
  }
};
