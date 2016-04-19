# QUT Timetable planner

A Chrome web extension to help plan your QUT timetable.

![alt text](https://raw.githubusercontent.com/benmag/Timetable/master/screenshot.png "Timetable Screenshot")

## Installation

Click [here](https://chrome.google.com/webstore/detail/iakogcgjbbfakakbpmlocfgabpdhboja) to open the Chrome extension and 'ADD TO CHROME' to install it.

### TODO

- Colour-code by subject in the calendar view, not by class type
- Export as QUT-formatted timetable HTML or PNG (and/or on print)
- Aim to improve preview performace (e.g. lag is produced when previewing a specific class type)
- Optimise the 'remove unit' button. The event removal code is quite laggy.
- Complete code cleanup. COMMENT ALL THE THINGS!
- Continue refining the design (e.g. Replace 'x' delete buttons with glyph icons)
- Find a way to increase hour (row) height when an event has overflow on the y-axis
- Add highlight when user hovers over a class in the sidebar that is already added to the calendar
- Implement rotating 'helpful hints' under the calendar

### Order of subject colour

|    |  Colour | Hex Code |
|----|:-------:|:--------:|
| 1  |  Yellow |  #F9F48C |
| 2  |   Blue  |  #B2DFEE |
| 3  |   Pink  |  #FFC1C1 |
| 4  |  Green  |  #CAE081 |
| 5  |  Purple |  #9999CC |
| 6+ | Default |  #CCCCCC |
