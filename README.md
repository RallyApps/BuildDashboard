Rally Build Dashboard
============

![Title](https://raw.github.com/RallyApps/BuildDashboard/master/screenshots/title-screenshot.png)

## Overview

The Build Dashboard app showcases Jenkins and Anthill Pro continuous builds in graph form. 

## How to Use

A complete overview on how the app functions is [here](http://www.rallydev.com/help/build-dashboard).

### Running the App

If you want to start using the app immediately, create an Custom HTML app on your Rally dashboard. Then copy App.html from the deploy folder into the HTML text area. That's it, it should be ready to use. See [this](http://www.rallydev.com/help/use_apps#create) help link if you don't know how to create a dashboard page for Custom HTML apps.

Or you can just click [here](https://raw.github.com/RallyApps/BuildDashboard/master/deploy/App.html) to find the file and copy it into the custom HTML app.

### Using the App

If you have Jenkins or Anthill Pro integrated into Rally, there is no need to do anything else. You can view various builds and their success rates on the left column. The right column contains the ratio of build sucess/failures in graph form along with individual builds and their respective details (build number, date, time to build, and build status).

Click [here](http://www.rallydev.com/help/jenkins-installation-user-guide) for more information for configuring Jenkins and [here](http://www.rallydev.com/help/urbancode-anthill-pro) for Anthill Pro. <b>NOTE:</b> Anthill Pro integration is in beta for Rally.

## Customize this App

You're free to customize this app to your liking (see the License section for details). If you need to add any new Javascript or CSS files, make sure to update config.json so it will be included the next time you build the app.

This app uses the Rally SDK 1.32. The documentation can be found [here](http://developer.rallydev.com/help/app-sdk). 

Available Rakefile tasks are:

    rake build                      # Build a deployable app which includes all JavaScript and CSS resources inline
    rake clean                      # Clean all generated output
    rake debug                      # Build a debug version of the app, useful for local development
    rake deploy                     # Deploy an app to a Rally server
    rake deploy:debug               # Deploy a debug app to a Rally server
    rake deploy:info                # Display deploy information
    rake jslint                     # Run jslint on all JavaScript files used by this app, can be enabled by setting ENABLE_JSLINT=true.

## License

Kanban is released under the MIT license.  See the file [LICENSE](https://raw.github.com/RallyApps/Kanban/master/LICENSE) for the full text.