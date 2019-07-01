$.ready(function() {
	$.get('title').innerHTML = $.string.format("Quiz Game {0}", $.getVersion());

	var actionHistory = [], //stack for redo
	 termsContainer = $.get("termsContainer"), //reference to terms starting area
	 timeDisplay = $.get("elapsedTime"), //reference to timer display
	 timerInterval, //holds interval function for timer
	 timerStart; //holds time quiz is started
	const quizDuration = 5*60*1000; //quiz time limit, in ms

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

	function returnDropItemFunc(e) {
		e.preventDefault();
		var data = e.dataTransfer.getData("text"); //id of dragged item
		var dragEl = $.get(data);
		if (data.includes("new")){
			var original = $.get(data.substring(4));
			actionHistory.push([original.id,dragEl.parentNode.id,termsContainer.id]);
			restoreTerm(original);
			dragEl.remove();
		}
	}

	function dragOverItemFunc(e) {
		e.preventDefault();
	}

	function setupQuiz() {
		var button = $.get('controlButton');
		button.value="Play";
		button.disabled=false;
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
	}

	//processes timer each interval
	function timer() {
		//get elapsed time, comes as milliseconds
		let timeElapsed = Date.now() - timerStart;

		if (timeElapsed >= quizDuration) {
			endQuiz();
			return;
		}
		//convert to seconds
		let remaining = (quizDuration - timeElapsed) / 1000;
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
		var button = $.get('controlButton');
		button.value="End";
		button.disabled=false;

		//unlock and display all terms
		var terms = termsContainer.getElementsByClassName("termWidget");
		for (var i = 0; i < terms.length; i++) {
			restoreTerm(terms[i]);
		}

		//initialize start time
		timerStart = Date.now();
		timer();
		timerInterval = setInterval(timer,1000);
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
		var button = $.get('controlButton');
		button.value="Score";
		button.disabled=false;
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
		var button = $.get('controlButton');
		button.value="Start";
		button.disabled = true;
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
	$.get('controlButton').addEventListener("click", changeButton, false);
	for (var i=1; i<=5; i++) {
		var dragItem = $.get("termWidget"+i);
		dragItem.addEventListener("dragstart", startDragItemFunc, false);

		var dropArea = $.get("definitionWidget"+i);
		dropArea.addEventListener("drop", dropItemFunc, false);
		dropArea.addEventListener("dragover", dragOverItemFunc, false);
	}

	termsContainer.addEventListener("drop", returnDropItemFunc, false);
	termsContainer.addEventListener("dragover", dragOverItemFunc, false);
});
