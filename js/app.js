$.ready(function() {
	$.get('title').innerHTML = $.string.format("Quiz Game {0}", $.getVersion());

	var actionHistory = [], //stack for redo
	 answerMap = [], //correct answers, a[key]:value === a[term]:definition
	 answerScore = [], //key(index) for each term, 1 correct, 0 incorrect
	 termsContainer = $.get("termsContainer"), //reference to terms starting area
	 buttonUndo = $.get("undo"),
	 buttonControl = $.get("controlButton"),
	 scoreText = $.get("score"),
	 timeDisplay = $.get("elapsedTime"), //reference to timer display
	 timerInterval, //holds interval function for timer
	 timerStart; //holds time quiz is started

	const QUIZDURATION = 5*60*1000, //quiz time limit, in ms
	 DISPLAYTIMEDEFAULT = "--:--:--",
	 NUMPROBLEMS = 5;

	//load quiz for first playthrough
	setupQuiz();

	//attach undo function to undo button
	$.get('undo').addEventListener("click",
		function() {
			console.log("actionHistory("+ actionHistory.length +"):" + actionHistory);
			undo();
		}
		,false);

	//pop from stack of moves and reverses the action
	function undo() {
		if (actionHistory.length) {
			let lastAction = actionHistory.pop(),
			termId = lastAction[0], //indicates term moved
			sourceId = lastAction[1], //indicates where it was moved from
			destinationId = lastAction[2]; //indicates where it was moved to
			var term = $.get(termId);

			if (sourceId.includes("termsContainer")) { //A->B
				restoreTerm(term);
				$.get("new_"+termId).remove();
			}
			else if (destinationId.includes("termsContainer")) { //B->A
				$.get(sourceId).appendChild(copyTerm(term));
				hideTerm(term);
			}
			else //B -> B
			{
				$.get(sourceId).appendChild($.get("new_"+termId));
			}
		}
	}

	function startDragItemFunc(e) {
		//e.target is dragged item
		console.log("drag start:" + e.target.id);
		e.dataTransfer.setData("text", e.target.id);
	}

	function hideTerm(item) {
		item.style.visibility = "hidden";
		item.style.draggable = false;
	}

	function restoreTerm(item) {
		item.style.visibility = "visible";
		item.style.draggable = true;
	}

	function copyTerm(item) {
		var newDragEl = item.cloneNode(true);
		newDragEl.id = "new_"+item.id;
		newDragEl.style.draggable = "true";
		newDragEl.addEventListener("dragstart", startDragItemFunc, false);
		return newDragEl;
	}

	//called when moving a term widget to a container on the right
	function dropItemFunc(e) {
		e.preventDefault();
		if (!e.target.hasChildNodes()) {
			//e.target is receiving item
			console.log("drag end on:" + e.target.id);
			var data = e.dataTransfer.getData("text"); //id of dragged item
			var dragEl = $.get(data);
			//e.target.innerHTML = dragEl.innerHTML;
			//dragEl.innerHTML = "";
			if (dragEl.id.includes("new")) {
				var originalId = data.substring(4);
				actionHistory.push([originalId,dragEl.parentNode.id,e.target.id]);
				e.target.appendChild(dragEl);
			}
			else {
				e.target.appendChild(copyTerm(dragEl));
				hideTerm(dragEl);
				actionHistory.push([data,termsContainer.id,e.target.id]);
			}
		}
	}

	//called when a term widget is dragged back to source container
	function returnDropItemFunc(e) {
		e.preventDefault();
		var data = e.dataTransfer.getData("text"); //id of dragged item
		var dragEl = $.get(data);

		//if what you're dragging came from the right/definitions container
		if (data.includes("new")){
			//locate originating term widget
			var original = $.get(data.substring(4));
			actionHistory.push([original.id,dragEl.parentNode.id,termsContainer.id]);
			//restore term widget which was hidden this whole time
			restoreTerm(original);
			dragEl.remove();
		}
	}

	//prevent default triggers when dragging an item
	function dragOverItemFunc(e) {
		e.preventDefault();
	}

	//called to get quiz ready to play
	//once when page loads, and then each time player selects continue
	function setupQuiz() {
		//fix button state
		var button = buttonControl;
		button.value="Play";
		button.disabled=false;
		buttonUndo.disabled=true;

		//load quiz problems here
		//answers matched to definitions based on server side memory of number pairs
		//as opposed to having correct pairs having matching indeces which could be inspected by user
		answerMap = []; //clear answers
		for (var i=0; i<NUMPROBLEMS; i++) {
			answerMap.push(i);
		}
		//correct definition for term 1 is the number located in answerMap[1]
		console.log(answerMap);

		//clear any prior moves
		//lock and hide terms
		var terms = document.getElementsByClassName("termWidget");
		for (var i = 0; i < terms.length; i++) {
			let term = terms[i];
			if(term.id.includes("new") ) {
				term.remove();
			}
			else {
				hideTerm(term);
			}
		}
		//blank out timer display
		timeDisplay.innerText = DISPLAYTIMEDEFAULT;
	}

	//processes timer each interval
	function timer() {
		//get elapsed time, comes as milliseconds
		let timeElapsed = Date.now() - timerStart;

		if (timeElapsed >= QUIZDURATION) {
			endQuiz();
			return;
		}
		//convert to seconds
		let remaining = (QUIZDURATION - timeElapsed) / 1000;
		let h = parseInt(remaining / 3600); //divide to get hours
		let m = parseInt( (remaining % 3600) / 60); //divide remainder to get minutes
		let s = parseInt( (remaining % 3600) % 60); //divide that remainder to get seconds

		//put on page
		let textString = padTimer(h) + ":" + padTimer(m) + ":" + padTimer(s);
		timeDisplay.innerText = textString;
	}

	//called when play is pressed
	function startQuiz() {
		//fix button state
		var button = buttonControl;
		button.value="End";
		button.disabled=false;
		buttonUndo.disabled=false;

		//unlock and display all terms
		var terms = termsContainer.getElementsByClassName("termWidget");
		for (var i = 0; i < terms.length; i++) {
			restoreTerm(terms[i]);
		}

		//initialize start time
		timerStart = Date.now();
		timer();
		let refreshInterval = 1000/30; //update time at 30 fps
		timerInterval = setInterval(timer,refreshInterval);
	}

	//pad time display value with leading zero if needed
	// takes an int, outputs string
	//example: 5 -> 05
	function padTimer(num) {
		let numString = num.toString();
		while (numString.length < 2) {
			numString = "0" + numString;
		}
		return numString;
	}

	//called when either end is pressed, or timer expires
	function endQuiz() {
		//fix button state
		var button = buttonControl;
		button.value="Score";
		button.disabled=false;
		buttonUndo.disabled=true;
		//lock all term widgets
		var terms = document.getElementsByClassName("termWidget");
		for (var i = 0; i < terms.length; i++) {
			terms[i].draggable = false;
		}

		//end timer
		clearInterval(timerInterval);
	}

	//called when Score is pressed
	function scoreQuiz() {
		//fix button state
		var button = buttonControl;
		button.value="Start";
		button.disabled = true;

		answerScore = []; //clear scoring
		for (var i=0; i<NUMPROBLEMS; i++) {
			answerScore.push(0);
			//each key(=term) defaults to wrong until checked
		}
		var definitionsContainer = $.get("definitionsContainer");
		var assignedTerms = definitionsContainer.getElementsByClassName("termWidget");
		for (var i=0; i<assignedTerms.length; i++) {
			//calc scoring
			let term = assignedTerms[i]; //term being evaluated
			let termIndex = term.getAttribute("index"); //index of term
			let correctDefIndex = answerMap[termIndex]; //index of correct definition
			let userDefIndex = term.parentNode.getAttribute("index"); //index of user's definition
			if (userDefIndex==correctDefIndex) {
				answerScore[termIndex] = 1; //score as correct
			}

		}
		scoreText.innerText = scoreMessage(); //update score text area on page
	}

	function scoreMessage() {
		let sum = 0;
		for (var i=0; i<answerScore.length; i++) {
			sum += answerScore[i];
		}
		let message = "";
		if (sum >= NUMPROBLEMS) {
			message = "Perfect Score!";
		}
		else {
			message = "You have " + sum + " correct answer";
			if (sum > 1) {
				message = message + "s";
			}
			message = message + ".";
		}
		return message;
	}

	var changeButton = function(e) {
		var val = e.target.value;
		switch(val) {
			case "Play":
				startQuiz();
			break;
			case "End":
				endQuiz();
			break;
			case "Score":
				scoreQuiz();
			break;
		}
	}

	//bind button to the function to change state
	buttonControl.addEventListener("click", changeButton, false);

	//eventListeners for all the terms and definitions
	for (var i=1; i<=NUMPROBLEMS; i++) {
		var dragItem = $.get("termWidget"+i);
		dragItem.addEventListener("dragstart", startDragItemFunc, false);

		var dropArea = $.get("definitionWidget"+i);
		dropArea.addEventListener("drop", dropItemFunc, false);
		dropArea.addEventListener("dragover", dragOverItemFunc, false);
	}

	termsContainer.addEventListener("drop", returnDropItemFunc, false);
	termsContainer.addEventListener("dragover", dragOverItemFunc, false);
});
