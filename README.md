# QUT Timetable Planner

A Chrome web extension to help plan your QUT timetable.

![alt text](https://raw.githubusercontent.com/benmag/Timetable/master/screenshot.png "Timetable Screenshot")

![alt text](https://raw.githubusercontent.com/benmag/Timetable/master/screenshot2.png "Timetable Screenshot")

## Installation

Click [here](https://chrome.google.com/webstore/detail/iakogcgjbbfakakbpmlocfgabpdhboja) to open the Chrome extension and 'ADD TO CHROME' to install it.

### TODO

- Colour-code by subject in the calendar view, not by class type
- Export as QUT-formatted timetable HTML or PNG (and/or on print)
- Find a way to increase hour (row) height when an event has overflow on the y-axis
- Add highlight when user hovers over a class in the sidebar that is already added to the calendar
- Combine notifications when importing units
- Make the subject overview interactive, allowing the user to see more info (e.g. teaching staff)
- Fix Firefox extension opening multiple instances of timetabler.html
- Fix search bar formatting in Firefox; 'input' extends past container width and 'select' becomes lost
- Handle colouring of numbered class types (i.e. "LC1, LC2, PR1, PR2", etc.)
- Show how many class categories have at least one class selected (to prevent missing classes)

### Order of subject colour

|    |  Colour | Hex Code |
|----|:-------:|:--------:|
| 1  |  Yellow |  #F9F48C |
| 2  |   Blue  |  #B2DFEE |
| 3  |   Pink  |  #FFC1C1 |
| 4  |  Green  |  #CAE081 |
| 5  |  Purple |  #9999CC |
| 6+ | Default |  #CCCCCC |
