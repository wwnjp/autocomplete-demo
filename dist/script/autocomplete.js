
(function(window, document, undefined) {
	// Get our container
	var container = document.getElementsByClassName('autocomplete')[0];

	// Our input element, where all the action is
	var element = container.querySelector('.autocomplete-field');

	// Let's create a dropdown
	var dropdown = document.createElement('ol');
			dropdown.classList.add('autocomplete-list');
			dropdown.classList.add('hide');
			container.appendChild(dropdown);

	// Some default values
	  var NO_ENTRIES_TEXT = "No suggestions",
      ENTER_MORE_TEXT = "Type and we'll make suggestions...",
      INPUT_LENGTH_THRESHOLD = 3,
      AUTOCOMPLETE_URL = "http://localhost:8080/suggestion.php",
      AUTOCOMPLETE_OPTIONS = {
        q: '',
      };

   var callTimer, cur = -1;

	// Add an item to the autocomplete list
	var addItem = function(text, url) {
		var item, itemlink;
		item = document.createElement('li');

		if (url) {
			itemlink = document.createElement('a');
			itemlink.setAttribute('href', url);
		}
		else {
			itemlink = document.createElement('span');
		}

		itemlink.innerHTML = text;
		item.appendChild(itemlink);
		dropdown.appendChild(item);

	};

	// Remove all items from the list and replace with intro text
	var resetDropdown = function() {
		dropdown.innerHTML = '';
    addItem(ENTER_MORE_TEXT);
	};

	// Remove the dropdown from view
	var hideDropdown = function() {
		dropdown.classList.add('hide');
	}

	// Make a request to get the data and populate the results
	var getData = function() {
		// Pull the value from the input element
		var val = element.value;

		// make an AJAX request to the autocomplete server with the value
		// populate the results
		dropdown.innerHTML = '';

		AUTOCOMPLETE_OPTIONS.q = val;
		if (val.length > INPUT_LENGTH_THRESHOLD) {
			$.ajax({url: AUTOCOMPLETE_URL, data: AUTOCOMPLETE_OPTIONS, method: 'get'})
				.done(function(response) {
		          dropdown.innerHTML = '';

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
		// Did we make the right keypresses?
		if (ev.keyCode < 48) {
			return;
		}
		else {
			clearTimeout(callTimer);
			callTimer = setTimeout(getData, 200);
		}
	};

	// When the user arrows around the results, we should highlight the selected one
	var doOnKeyDown = function(ev) {
		var isCursorMoved = false;

		console.log(ev.keyCode);
    switch(ev.keyCode) {
      case 40: // DOWN ARROW
        isCursorMoved = true;
        cur++;

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
    	element.value = dropdown.querySelector('.selected').innerHTML;
    }
	};


	// Binding events to the element
	element.addEventListener('focus', doOnFocus);
	element.addEventListener('blur', doOnBlur);
	element.addEventListener('keyup', doOnKeyup);
	element.addEventListener('keydown', doOnKeyDown);

})(window, document);

