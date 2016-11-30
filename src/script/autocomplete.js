///
// Autocomplete Demo
// Author: Josh Drumm <joshdrumm@gmail.com>
// Date: 29 November 2016
///

/*

This entire file is what activates Autocomplete on input elements
For this demo, we want to create an enclosed function that will
execute all of the code we need, but we don't want to expose variables
and functions to the global scope (we don't want other people or code
mucking with our stuff). Wrapping our code in a function will create
its own scope so that it will be protected from the outside. When a
variable is in a scope, it means that it's only defined for that space
(in JavaScript's case: a function). Outside of that function, it won't
be visible.

Scopes can always look up its call tree, all the way up to the global scope,
but can never look in. For Example:

var a = "hi";

var someFunc = function() {
  var b = "bee";
  console.log(a);   // <-- This is fine
  return b;
}

console.log(b); // <-- Error


The other interesting point about this wrapper function is the use of
"window", "document", and "undefined" as parameters passed into the
function. This is a safety feature to also guarantee that this function
uses the window, document, and undefined that we all know and love.

An unfortunate situation in JavaScript is that you can redefine these
(what should be immutable) objects: window and document. It's perfectly
valid to say:

document = "nope";

if this is defined outside this code base, that could have a disastrous
effect on our code. Therefore, passing them in as parameters will mean
that we use the window and document that exists at the time this code
executes.

"undefined" is an interesting case, because it isn't passed in, but is
defined in the parameter list. This is also a "guarantee this exists"
case, but relies on the fact that functions don't *need* all the parameters
defined when called.

var someFunc = function(a) {
  console.log(a);
}

someFunc(); // <--- Will print "undefined" and not error.

*/

(function(window, document, undefined) {
  /* First thing we want to do is define some variables that we'll use
  for our autocomplete. We're going to need the DOMNode object for
  the <input> element, and we'll need the <div> that contains it.

  We'll also take the time to create an <ol> element that will act as our
  Autocomplete List. We'll add a class of "autocomplete-list" and "hide" to
  it so we don't see it initially, and we then append it to the container
  */

  // Get our container element
  var container = document.getElementsByClassName('autocomplete')[0];

  // Our input element, where all the action is
  var element = container.querySelector('.autocomplete-field');

  // Let's create a dropdown and add it to our container
  var dropdown = document.createElement('ol');
      dropdown.classList.add('autocomplete-list');
      dropdown.classList.add('hide');
      container.appendChild(dropdown);

  /*
  Some other default values we'll need. I use CAPITALS for vars that
  I don't want to change (consts), as per convention. Also note, that
  you can define multiple variables in one var statement or use multiple
  vars. Either are valid.
  */
  var NO_ENTRIES_TEXT = "No suggestions",                         // What to display when no entries exist
      ENTER_MORE_TEXT = "Type and we'll make suggestions...",     // What to prompt the user before they start typing
      INPUT_LENGTH_THRESHOLD = 3,                                 // How many characters do we wait until to start showing results
      AUTOCOMPLETE_URL = "http://localhost:8080/suggestion.php",  // This is a non-functioning endpoint to get the results from.
                                                                  // Making this endpoint work can be an exercise for the user.
      AUTOCOMPLETE_OPTIONS = {
        q: '',
      };

  var callTimer,                                                  // timeout object used in doOnKeyup
      cur = -1;                                                   // cursor to keep track of which element we have selected

  // Add an item to the autocomplete list
  var addItem = function(text, url) {
    var item, itemlink;
    // no matter what happens here, we want to create an <li> (since
    // we'll be putting it in the dropdown var above, which is an <ol>)
    item = document.createElement('li');

    // if we have a URL defined in our parameters, let's create it as a link
    if (url) {
      itemlink = document.createElement('a');
      itemlink.setAttribute('href', url);
    }
    // Otherwise, let's treat it as some default text that isn't selectable.
    else {
      itemlink = document.createElement('span');
    }

    itemlink.innerHTML = text;            // Set the HTML of the element
    item.appendChild(itemlink);           // Append the <a>|<span> to the <li>
    dropdown.appendChild(item);           // Append the <li> to the dropdown
  };

  // Remove all items from the list and replace with intro text
  var resetDropdown = function() {
    dropdown.innerHTML = '';              // Empty out everything that's in the dropdown
    addItem(ENTER_MORE_TEXT);             // Add that default item in.
  };

  // Remove the dropdown from view
  var hideDropdown = function() {
    dropdown.classList.add('hide');
  }

  // Make a request to get the data and populate the results
  var downloadAndPopulateResults = function() {
    // Pull the value from the input element
    var val = element.value;

    // make an AJAX request to the autocomplete server with the value
    // populate the results
    dropdown.innerHTML = '';

    // If you want to test this locally without any AJAX calls, you can
    // manually create elements to add.
    // addItem('Some Text', 'someurl');
    // addItem('Some Text', 'someurl');
    // addItem('Some Text', 'someurl');
    // return; // This will short circuit the rest of the function


    AUTOCOMPLETE_OPTIONS.q = val;
    if (val.length > INPUT_LENGTH_THRESHOLD) {
      $.ajax({url: AUTOCOMPLETE_URL, data: AUTOCOMPLETE_OPTIONS, method: 'get'})
        .done(function(response) {
              dropdown.innerHTML = '';

              // If we were successful in getting a response from the server via AJAX,
              // parse the response and call addItem on each element in the response.
              if (response) {
                var resp = JSON.parse(response);
                for (var i = 0; i < resp.length; i++) {
                  addItem(resp[i].value, 'http://wayfair.com/filters/redir=' + resp[i].value);
                }
              }
              else {
                addItem(NO_ENTRIES_TEXT);
             }
           });
    }
  };

  // When the input is focused, we should show the dropdown
  var doOnFocus = function(ev) {
    dropdown.classList.remove('hide');
    resetDropdown();
  };

  // When we blur away from it, we should hide it
  var doOnBlur = function(ev) {
    hideDropdown();
  };

  // When the user has started typing enough info, we should display results
  var doOnKeyup = function(ev) {

    /*
    Events that are passed in here have a lot of data inside of them. In
    the case of keyboard events, information about which key was pressed is passed in.
    While there is an ev.key field that will tell you the letter or number of the key
    pressed, a more supported way to look at this is keyCode, which is the ASCII number associated
    with the press. List of what these numbers are can be found here: http://www.asciitable.com/

    From that list, you'll see that numbers less than 32 are "control values", characters from
    the "Old Days" that included old keyboards that are largely not in use in today's modern keyboards.
    Since these characters ARE used by code, and ARE potentially dangerous, let's prevent any
    actions from happening if they type one.
    */
    if (ev.keyCode < 32) {
      return;
    }

    /*
    Otherwise, let's call downloadAndPopulateResults. You'll notice here that there is a wrapper
    around this function called setTimout. setTimeout is a built-in function in JavaScript that
    will defer execution of a time in milliseconds.  What this accomplishes is: on keyup, reset
    the timer, and then reset the timeout to execute. This means, downloadAndPopulateResults
    will run exactly 200ms after the user has stopped typing.
    */
    else {
      clearTimeout(callTimer);
      callTimer = setTimeout(downloadAndPopulateResults, 200);
    }
  };

  // When the user arrows around the results, we should highlight the selected one
  var doOnKeyDown = function(ev) {
    var isCursorMoved = false;

    /*
    This section will look at which key was pressed, and act accordingly.
    Specifically, we want to look at the arrow keys, since that is what we'll act
    on. When those are fired, we want to update which element is the selected one.
    We could, in theory, do all of the manipulations in the case statement. But
    since the actions that we're doing is the same (resetting which one is selected,
    and setting the new one), we can avoid duplicating code by moving it after this block.
    */
    switch(ev.keyCode) {
      case 40: // DOWN ARROW
        isCursorMoved = true;
        cur++;

        /*
        Blindly incrementing the code will eventually lead to a time where
        we've gone past the elements in the list. If we've "overflowed", let's
        wrap around to the beginning. (this same logic happens below too, but reverse)
        */
        if (cur > dropdown.childNodes.length - 1) {
          cur = 0;
        }

        ev.preventDefault();
        break;

      case 38: // UP ARROW
        isCursorMoved = true;
        cur--;

        if (cur < 0) {
          cur = dropdown.childNodes.length - 1;
        }

        ev.preventDefault();
        break;

      case 13: // Enter
        ev.preventDefault();
        break;

      default:
        break;
    }

    if (isCursorMoved) {
      // Find any existing selected elements and remove that class
      if (dropdown.getElementsByClassName('selected').length > 0) {
        dropdown.getElementsByClassName('selected')[0].classList.remove('selected');
      }

      // Add "selected" the the cursor
      dropdown.childNodes[cur].childNodes[0].classList.add('selected');

      // Set the value of the <input> element to what's selected.
      element.value = dropdown.querySelector('.selected').innerHTML;
    }
  };


  // Binding events to the <input> element. This the core JS way to bind Events.
  // (Caveat: in IE, this the function is called attachEvent()). Binding an
  // event means, "when X happens on this event, call this function"
  element.addEventListener('focus', doOnFocus);
  element.addEventListener('blur', doOnBlur);
  element.addEventListener('keyup', doOnKeyup);
  element.addEventListener('keydown', doOnKeyDown);

})(window, document);

