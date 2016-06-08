/**
 * Created by mitch on 06-Jun-16.
 */


var subject = "CAB202"

function getClassesLocation() {
    var advSearch = "https://qutvirtual3.qut.edu.au/qvpublic/ttab_unit_search_p.show_search_adv";

    // Attempt cross-site GET
    $.get(advSearch, function (data) {
        // Extract the dropdown from the data
        var select = $(data).find("select[name='p_time_period_id']")[0];

        //save the length of it to a public variable
        total_requests = data.length;
        // Add each option to our own dropdown
        // TODO Store these results in localStorage for offline use
        $.each(select.options, function () {
            // Remove the date ranges from the text
            var regex = /.+(?:GP|KG|CB)/;
            var text = regex.exec(this.text);
            //Run the checking script for each location
            checkCampus(this.value, subject, text[0]);
        })
    })
}


var requests_made = 0;
var total_requests = 0;
var locations = [];

function checkCampus(campusId, courseId, campus) {
    var search_url = 'https://qutvirtual3.qut.edu.au/qvpublic/ttab_unit_search_p.process_search?p_time_period_id=' + campusId + '&p_unit_cd=' + courseId;
    $.get(search_url, function (data) {
        // TODO Need to change this logic as it is currently relying on no error text
        var noResultRegex = /No results matched your search criteria. Please return to the/;
        var match = noResultRegex.exec(data);
        if (match == null || match.length <= 0) {
            locations.push({'campusId': campusId, "campusText": campus})
        }
        requests_made++;
        allPlacesSearched();
    })
}


function allPlacesSearched() {
    if (requests_made == total_requests - 1) {
        if (locations.length == 1) {//there is only one place
            console.log("Just load it");
        } else if (locations == null || locations.length == 0) { //There is no place
            console.log("error was made");
        }
        else {
            var bodyText = "Please Select a Teaching Period<br><select id = 'time_period'>";
            for (var x = 0; x < locations.length; x++) {
                bodyText += "<option value='" + locations[x].campusId + "'>" + locations[x].campusText + "</option>";
            }
            bodyText += "</select>";
            $.confirm({
                title: 'Select an Option!',
                content: bodyText,
                confirm: function () {
                    var userSelect = $('#time_period').val();
                    console.log(userSelect)
                    unitSearch(userSelect, subject);
                },
                cancel: function () {
                }
            });
        }
    }
    else {
        console.log("Still waiting");
    }
}


    function unitSearch(campusId, courseCode){
        var baseURL = "https://qutvirtual3.qut.edu.au/qvpublic/ttab_unit_search_p.process_search?";
        var params = {
            p_time_period_id: campusId
        };
    
        // Determine if search is a unit code or unit description
        var searchText = courseCode
        var regex = /\b[a-zA-Z]{3}\d{3}\b/; // 3 letters, 3 digits
        if (regex.test(searchText)){
            params.p_unit_cd = searchText;
        } else {
            params.p_unit_description = searchText;
        }
        window.open(baseURL + $.param(params), "_blank");
    }

getClassesLocation()