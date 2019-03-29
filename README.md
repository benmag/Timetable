# QUT Timetable Planner
Plan your perfect timetable with this free open-source utility for QUT students.

## Screenshots
![QUT Timetable Planner - Screenshot 1](https://raw.githubusercontent.com/benmag/Timetable/master/screenshot.png "Timetable Screenshot")

![QUT Timetable Planner - Screenshot 2](https://raw.githubusercontent.com/benmag/Timetable/master/screenshot2.png "Timetable Screenshot")

## Installation
View the extension on the [Chrome Web Store](https://chrome.google.com/webstore/detail/iakogcgjbbfakakbpmlocfgabpdhboja) and click 'ADD TO CHROME'.

## Noteworthy Features
- Easy unit navigation
- Colour-coded class types 
- Browser integration for assisted unit imports
- Unit summary

## Development
If you're interested in contributing, download the project and install it's dependencies you need to be able to run the Chrome Extension locally with the following commands:
```
git clone https://github.com/benmag/Timetable.git
cd Timetable
npm install
npm run dev
```

To install your development extension in Chrome, go to `chrome://extensions/` and make sure `Developer mode` is enabled. Then click the `Load unpacked` button and select the `app/` folder. 


The simple PHP scripts to extract external data are stored in the `scripts/` folder and deployed via now. If you wish to change those scripts, make sure you modify the `REMOTE_URL` in `app/js/search.js`.

## Deployment

1. Install and prepare dependencies (`npm install`, `npm run prod`)
2. Update the version accordingly in `app/manifest.json`
2. Make sure the latest script changes are deployed (in the `scripts/` directory run `now`) 
4. Zip the `app/` folder and upload then publish it in the developer dashboard [Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard) 


## Contributors 
- Ben M 
- Dave A
- Andrew C
- Mitch H
- Nathan H


## License
This project uses the [ISC License](http://opensource.org/licenses/ISC).
