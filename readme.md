#Karma Example 

This is an example setup for the Karma test runner with AMD modules (requirejs).


## Getting started

Clone this repo and run `npm install` in the project. This will pull down all
the dependencies. 

## Using the project

All of the interaction with Karma is done using grunt. 

* `test`: runs the tests normally. 
* `coverage`: runs the tests with coverage reporting 
* `testPhantom`: spawns phantomjs and runs the tests

To view the coverage report run `grunt coverage` let the tests run and then
point your browser to http://localhost:9877


