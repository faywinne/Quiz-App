$.ready(function() {
	$.get('title').innerHTML = $.string.format("Quiz Game {0}", $.getVersion());

	$.get('controlButton').addEventListener("click",
		function() {
			console.log("controlButton clicked");
		}
		,false);

	var dragItem = document.getElementById("termWidget1");
	var dropArea = document.getElementById("definitionWidget1");

	function startDragItemFunc(e) {
		console.log("drag start:" + e.target.id);
		e.dataTransfer.setData("text", e.target.id);
	}

	function dropItemFunc(e) {
		e.preventDefault();
		var data = e.dataTransfer.getData("text");
		var dragEl = document.getElementById(data)
		e.target.innerHTML = dragEl.innerHTML;
		dragEl.innerHTML = "";
	}

	function dragOverItemFunc(e) {
		e.preventDefault();
	}

	dragItem.addEventListener("dragstart", startDragItemFunc, false);
	dropArea.addEventListener("drop", dropItemFunc, false);
	dropArea.addEventListener("dragover", dragOverItemFunc, false);
});
