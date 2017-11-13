var startPosition;

var currentPlayer = "playerOne";

var linesWithPieces; // number of lines with pieces at the beginning of the game for each player

var n = 8 // set board size (n * n)

var moveStack = [];

var playerIndicator;

window.onload = function(){

	var height = window.innerHeight
	|| document.documentElement.clientHeight
	|| document.body.clientHeight;
	
	var width = window.innerWidth
	|| document.documentElement.clientWidth
	|| document.body.clientWidth;
	
	if(n<3) n = 3;
	initBoard(n);
	
	squaresList = document.getElementsByClassName("square");
	var sizePercentage = 100 / n;
	
	var unit;
	
	if(height < width) unit = "vh";
	else unit = "vw";
	
	for(var i =0; i < squaresList.length;i++){
		squaresList[i].style.width = sizePercentage + unit;
		squaresList[i].style.height = sizePercentage + unit;
		squaresList[i].style.lineHeight = sizePercentage + unit;
		squaresList[i].style.fontSize = sizePercentage + unit;
	}
	board = document.getElementsByClassName("board");
	board[0].style.width = 100+unit;
	board[0].style.height = 100+unit;
	
	playerIndicator = document.getElementById("Current Player");
	playerIndicator.innerHTML = currentPlayer;
	playerIndicator.style.fontSize = 5+unit;
	
	var undoButton = document.getElementById("undoButton");
	undoButton.innerText = "Undo"
	undoButton.style.fontSize = 5+unit;
}

initBoard = function(n){
	initLines(n);
	initSquares(n);
	initPieces(n);
}

initLines = function(n){
	for(var i = 0; i<n;i++){
		var line = document.createElement("div");
		line.className = "boardLine";
		document.getElementsByClassName("board")[0].appendChild(line);
	}
}

initSquares = function(n){
	var lines = document.getElementsByClassName("boardLine");
	for(var i = 0; i <n; i++){
		line = lines[i];
		
		var isDarkSquare = i % 2 !== 0; //check if the first square of the line should be dark
		
		for(var squareCount = 0; squareCount < n; squareCount ++){
			var square = document.createElement("div");
			
			square.className = "square";
			square.id = i*n+squareCount;
			
			if(isDarkSquare){
				square.className += " darkSquare";
			}else{
				square.className += " lightSquare"
			}
			
			line.appendChild(square);
			isDarkSquare = !isDarkSquare;
		}
	}
}

initPieces = function(n){
	//if n is even, there's n / 2 - 1 lines with pieces for each player. 
	//if it's odd, there's (floor of n/2) lines, to guarantee simmetry
	
	n % 2 == 0 ? linesWithPieces = n / 2 -1: linesWithPieces = Math.floor(n / 2);
	
	var squares = document.getElementsByClassName("darkSquare");
	
	var piecesPerLine = Math.ceil(n/2);
	
	for(var i = 0; i < linesWithPieces*piecesPerLine; i++){
		var pieceText = document.createTextNode("\u25CE");
		squares[i].appendChild(pieceText);
		squares[i].className += " playerTwo";
	}
	
	for(var i = n*piecesPerLine -1; i > n*piecesPerLine-1-linesWithPieces*piecesPerLine; i--){
		var pieceText = document.createTextNode("\u25CE");
		squares[i].appendChild(pieceText);
		squares[i].className += " playerOne";
	}
}

moveFromTo = function(id1,id2){
	removeCaptureMark(id1);
	
	startSquare = document.getElementById(id1);
	endSquare = document.getElementById(id2);
	
	endSquare.innerText = startSquare.innerText;
	endSquare.className += (" "+currentPlayer);
	
	if(startSquare.className.indexOf("promoted") !== -1){
		endSquare.className += (" promoted");
		startSquare.className = startSquare.className.replace(" promoted","");
	}
	startSquare.className = startSquare.className.replace(" "+currentPlayer,"");
	startSquare.innerText = "";
}

document.addEventListener('click', function(e) {
	if(e.target.className.indexOf("undoButton")!== -1){
			undoLastMove();
	}else	if(e.target.className.indexOf("showingCapture") !== -1){ //capture and move
			clearSelection();
			clearSelectables()
			
			//save move for undo later
			var lastMove = new Object();
			lastMove.player = currentPlayer;
			lastMove.oldPosition = startPosition;
			lastMove.newPosition = e.target.id;
			
			moveFromTo(startPosition,e.target.id);
			moveStack.push(lastMove);
			capturePiece(startPosition,e.target.id);
			
			hideCapturePositions();
			startPosition = parseInt(e.target.id);
			checkPossibleMoves();

			
			if(document.getElementsByClassName("showingCapture").length == 0){ //no more captures possible
				checkPromotion(e.target.id);
				changeCurrentPlayer();
				removePieces();
				if(document.getElementsByClassName("playerOne").length == 0){
					playerIndicator.innerText = "Winner: Player Two";
					alert("Winner: Player Two");
				}
				if(document.getElementsByClassName("playerTwo").length == 0){
					playerIndicator.innerText = "Winner: Player One";
					alert("Winner: Player One");
				}
				checkNewPositionCapturable(e.target.id);
				refreshCapturables();
			}
			}else{
				if(e.target.className.indexOf("selectable") !== -1){ //move
					moveFromTo(startPosition,e.target.id);
					checkPossibleMoves();
					checkPromotion(e.target.id);
					
					var lastMove = new Object();
					lastMove.player = currentPlayer;
					lastMove.oldPosition = startPosition;
					lastMove.newPosition = e.target.id;
					
					moveStack.push(lastMove);
					
					changeCurrentPlayer();
					checkNewPositionCapturable(e.target.id);
					refreshCapturables();
				}else{
					if(e.target.className.indexOf(currentPlayer) !== -1){ //select piece
						clearSelection();
						hideCapturePositions();
						startPosition = parseInt(e.target.id);
						markAsSelected(startPosition);
						hideCapturePositions();
						clearSelectables();
						checkPossibleMoves();
					}else{
						clearSelection(); //invalid click, deselect
						hideCapturePositions();
						clearSelectables();
					}
				}
			}
});


clearSelection = function(){
	elementList = document.getElementsByClassName("selected");
	while(elementList.length !== 0){
		unselected = elementList[0].className.replace(" selected" , '' );
		elementList[0].className = unselected;
	}
}

checkPossibleMoves = function(){
	if(document.getElementById(startPosition).className.indexOf("promoted") == -1){ //common piece
		//checks four adjacent squares
		checkPossiblePosition(startPosition+n+1)
		checkPossiblePosition(startPosition+n-1)
		checkPossiblePosition(startPosition-n+1)
		checkPossiblePosition(startPosition-n-1)
	}else{
		checkUpLeft(startPosition-n-1);
		checkUpRight(startPosition-n+1);
		checkDownLeft(startPosition+n-1);
		checkDownRight(startPosition+n+1);
	}
}

markAsSelectable = function(square){
	square.className += " selectable";
}

markAsSelected = function(id){
	var square = document.getElementById(id);
	if (square) square.className += " selected";
}

clearSelectables = function(){
	elementList = document.getElementsByClassName("selectable");
	while(elementList.length !== 0){
		dehighlighted = elementList[0].className.replace(" selectable" , '');
		elementList[0].className = dehighlighted;
	}
}

checkPossiblePosition = function(position){
	if(position <= n*n-1 && position >= 0){
		var square = document.getElementById(position);
		if(position <= n*n-1 && position >= 0 && currentPlayer == "playerTwo" && position > startPosition  ||
			position < n*n-1 && position >= 0 && currentPlayer == "playerOne" && position < startPosition
		){ //checks possible forward moves to empty squares
			if(square.className.indexOf("darkSquare") !== -1){
				if(square.innerText == ""){ //empty square
					if(!existsCapturable()){
						markAsSelectable(square);
					}
				}
			}
		}
		
		//checks possible captures, including backwards squares
		if(square.className.indexOf("darkSquare") !== -1){
			if(square.className.indexOf(" captured") == -1 &&square.innerText !== "" 
			&& square.className.indexOf("currentPlayer") == -1 ){
				checkCapturablePiece(square);
			}
		}
	}
}

changeCurrentPlayer = function(){
	if(currentPlayer == "playerOne") currentPlayer = "playerTwo"
	else currentPlayer = "playerOne";
	document.getElementById("Current Player").innerHTML = currentPlayer;
}

checkCapturablePiece = function(square){
	diff = startPosition - square.id;
	squareAfterCapture = document.getElementById(square.id - diff);
	if(squareAfterCapture && squareAfterCapture.className.indexOf("darkSquare") !== -1 
		&& squareAfterCapture.innerText == "" && square.className.indexOf(currentPlayer) == -1
		&& square.className.indexOf("showingCapture") == -1){
		squareAfterCapture.className += " showingCapture";
		markAsCapturable(square);
		clearSelectables();
	}
}

hideCapturePositions = function(){
	squareList = document.getElementsByClassName("showingCapture");
	while(squareList.length > 0){
		squareList[0].className = squareList[0].className.replace(" showingCapture","");
	}
}

markAsCapturable = function(square){
	if(square.className.indexOf(" capture") == -1){
		square.className += " capture";
	}
}

existsCapturable = function(){
	return document.getElementsByClassName("capture").length > 0;
}

capturePiece = function(id1,id2){
	squareAfterCapture = document.getElementById(id2);
	if(squareAfterCapture.className.indexOf("promoted") == -1){
		middleId = (parseInt(id1) + parseInt(id2)) /2;
		capturedPiece = document.getElementById(middleId);
		if(currentPlayer == "playerOne"){
			capturedPiece.className = capturedPiece.className.replace(" playerTwo","");
			capturedPiece.className += " captured captured2";
		}else{
			capturedPiece.className = capturedPiece.className.replace(" playerOne","");
			capturedPiece.className += " captured captured1";
		}
		moveStack[moveStack.length-1].capturedInnerText = capturedPiece.innerText;
		moveStack[moveStack.length-1].capturedPosition = capturedPiece.id;
	}else{
		captureFromTo(id1,id2);
	}
}

removePieces = function(){
	piecesToRemove = document.getElementsByClassName("captured");
	while(piecesToRemove.length > 0){
		piecesToRemove[0].innerText = "";
		piecesToRemove[0].className = piecesToRemove[0].className.replace(/ captured\d?/g,"");
	}
	
}

removeCaptureMark = function(id){
	var square = document.getElementById(id);
	if(square)square.className = square.className.replace(" capture","");
}

checkNewPositionCapturable = function(id){
	
	capturableSquare = document.getElementById(id);

	if(capturableSquare.innerText !== ""){
		
		var squareToCheck = document.getElementById(parseInt(id)+n+1);
		
		if(squareToCheck && squareToCheck.className.indexOf(currentPlayer) !== -1){
			startPosition = parseInt(id)+n+1;
			checkPossibleMoves();
		}
		
		squareToCheck = document.getElementById(parseInt(id)+n-1);
		
		if(squareToCheck && squareToCheck.className.indexOf(currentPlayer) !== -1){
			startPosition = parseInt(id)+n-1;
			checkPossibleMoves();
		}
		
		squareToCheck = document.getElementById(parseInt(id)-n+1);
		if(squareToCheck && squareToCheck.className.indexOf(currentPlayer) !== -1){
			startPosition = parseInt(id)-n+1;
			checkPossibleMoves();
		}
		
		squareToCheck = document.getElementById(parseInt(id)-n-1);
		if(squareToCheck && squareToCheck.className.indexOf(currentPlayer) !== -1){
			startPosition = parseInt(id)-n-1;
			checkPossibleMoves();
		}
		
	}
	else{
		removeCaptureMark(id);
	}
	
	clearSelection();
	clearSelectables();
	hideCapturePositions();
}

refreshCapturables = function(){
	capturablesTemp = copyToArray(document.getElementsByClassName("capture"));
	
	for(var i = 0 ; i < capturablesTemp.length; i++){
		var capturableSquare = capturablesTemp[i];
		
		squareRef = document.getElementById(capturablesTemp[i].id);
		
		removeCaptureMark(squareRef.id);
		
		if(squareRef.innerText == "") continue; //empty square
		
		var id = capturableSquare.id;
		
		checkNewPositionCapturable(id);
		
	}
	
	clearSelection();
	clearSelectables();
	hideCapturePositions();
}

copyToArray = function(oldHtmlCollection) {
    for(var i = 0, array = []; i < oldHtmlCollection.length; i++){
		var objCopy = new Object();
		objCopy.id = oldHtmlCollection[i].id;
		objCopy.className = oldHtmlCollection[i].className;
        array.push(objCopy);
	}
    return array;
}

checkPromotion = function(position){
	if(currentPlayer == "playerOne"){
		if(position >=0 && position <= n-1){
			promote(position);
			moveStack[moveStack.length - 1].promoted = true;
		}
	}
	
	if(currentPlayer == "playerTwo"){
		if(position <= n*n -1 && position >= n*(n-1)){
			promote(position);
			moveStack[moveStack.length - 1].promoted = true;
		}
	}
}

promote = function(position){
	squareToPromote = document.getElementById(position);
	if(squareToPromote.className.indexOf("promoted") == -1){
		squareToPromote.innerText = "\u25C9";
		squareToPromote.className += " promoted";
	}
}

checkUpLeft = function(positionToCheck){
	squareToCheck = document.getElementById(positionToCheck);
	if(positionToCheck >= 0 && positionToCheck <= n*n -1 && squareToCheck.className.indexOf("darkSquare") !== -1){
		 if(squareToCheck.innerText == ""){
			markAsSelectable(squareToCheck);
			checkUpLeft(positionToCheck - n - 1);
		 }else if(squareToCheck.className.indexOf(currentPlayer) == -1
				&& squareToCheck.className.indexOf("captured") == -1){
					 nextSquare = document.getElementById(positionToCheck-n-1);
					 if(nextSquare && nextSquare.innerText == "" && nextSquare.className.indexOf("darkSquare") !== -1){
						markAsCapturable(squareToCheck);
						nextSquare.className += " showingCapture";
						showCapturableUntilNotEmpty(positionToCheck-n-1,-n-1);
					 }
		 }
	}
	
}
checkUpRight  = function(positionToCheck){
	squareToCheck = document.getElementById(positionToCheck);
	if(positionToCheck >= 0 && positionToCheck <= n*n -1 && squareToCheck.className.indexOf("darkSquare") !== -1){
		 if(squareToCheck.innerText == ""){
			markAsSelectable(squareToCheck);
			checkUpRight(positionToCheck - n + 1);
		 }else if(squareToCheck.className.indexOf(currentPlayer) == -1
				&& squareToCheck.className.indexOf("captured") == -1){
					 nextSquare = document.getElementById(positionToCheck-n+1);
					 if(nextSquare && nextSquare.innerText == "" && nextSquare.className.indexOf("darkSquare") !== -1){
						markAsCapturable(squareToCheck);
						nextSquare.className += " showingCapture";
						showCapturableUntilNotEmpty(positionToCheck-n+1,-n+1);
					 }
		 }
	}
};
checkDownLeft  = function(positionToCheck){
	squareToCheck = document.getElementById(positionToCheck);
	if(positionToCheck >= 0 && positionToCheck <= n*n -1 && squareToCheck.className.indexOf("darkSquare") !== -1){
		 if(squareToCheck.innerText == ""){
			markAsSelectable(squareToCheck);
			checkDownLeft(positionToCheck + n - 1);
		 }else if(squareToCheck.className.indexOf(currentPlayer) == -1
				&& squareToCheck.className.indexOf("captured") == -1){
					 nextSquare = document.getElementById(positionToCheck+n-1);
					 if(nextSquare && nextSquare.innerText == "" && nextSquare.className.indexOf("darkSquare") !== -1){
						markAsCapturable(squareToCheck);
						nextSquare.className += " showingCapture";
						showCapturableUntilNotEmpty(positionToCheck+n-1,n-1);
					 }
		 }
	}
}
checkDownRight  = function(positionToCheck){
	squareToCheck = document.getElementById(positionToCheck);
	if(positionToCheck >= 0 && positionToCheck <= n*n -1 && squareToCheck.className.indexOf("darkSquare") !== -1){
		 if(squareToCheck.innerText == ""){
			markAsSelectable(squareToCheck);
			checkDownRight(positionToCheck + n + 1);
		 }else if(squareToCheck.className.indexOf(currentPlayer) == -1
				&& squareToCheck.className.indexOf("captured") == -1){
					 nextSquare = document.getElementById(positionToCheck+n+1);
					 if(nextSquare && nextSquare.innerText == "" && nextSquare.className.indexOf("darkSquare") !== -1){
						markAsCapturable(squareToCheck);
						nextSquare.className += " showingCapture";
						showCapturableUntilNotEmpty(positionToCheck+n+1,n+1);
					 }
		 }
	}
}
captureFromTo = function(id1,id2){
	var increment = checkIncrement(id1,id2);
	
	for(var positionToCheck = id1 + increment; positionToCheck !== id2; positionToCheck += increment){
		
		var squareToCheck = document.getElementById(positionToCheck);
		
		if(squareToCheck.innerText !== "" && squareToCheck.className.indexOf("captured") == -1
		&& squareToCheck.className.indexOf(currentPlayer) == -1){
			capturedPiece = document.getElementById(middleId);
			if(currentPlayer == "playerOne"){
				squareToCheck.className = squareToCheck.className.replace(" playerTwo","");
				squareToCheck.className += " captured captured2";
			}else{
				squareToCheck.className = squareToCheck.className.replace(" playerOne","");
				squareToCheck.className += " captured captured1";
			}
			moveStack[moveStack.length-1].capturedInnerText = capturedPiece.innerText;
			moveStack[moveStack.length-1].capturedPosition = capturedPiece.id;
			break;
		}
	}
	
}

showCapturableUntilNotEmpty = function(id1,increment){
	for(var positionToCheck = id1 + increment, squareToCheck = document.getElementById(positionToCheck); 
	squareToCheck && squareToCheck.innerText == "" && squareToCheck.className.indexOf("darkSquare") !== -1; 
	positionToCheck += increment, squareToCheck = document.getElementById(positionToCheck) ){	
		if(squareToCheck.className.indexOf("showingCapture") == -1){
			squareToCheck.className += " showingCapture";
			clearSelectables();
		}
	}
	
}

checkIncrement = function(n1,n2){
	var increment;
	var tempPosition = n1;
	if(n1 < n2){
		while(tempPosition < n2){
			tempPosition = tempPosition + n + 1;
		}
		if(tempPosition == n2) return (n+1);
		tempPosition = n1;
		while(tempPosition < n2){
			tempPosition = tempPosition + n - 1;
		}
		if(tempPosition == n2) return (n-1);
	}else{
		while(tempPosition > n2){
			tempPosition = tempPosition - n + 1;
		}
		if(tempPosition == n2) return (-n+1);
		tempPosition = n1;
		while(tempPosition > n2){
			tempPosition = tempPosition - n - 1;
		}
		if(tempPosition == n2) return (-n-1);
	}
}

undoLastMove = function(){
	var move = moveStack.pop();
	if(move){
		var player = move.player;
		var newPosition = move.newPosition;
		var oldPosition = move.oldPosition;
		var capturedPosition = move.capturedPosition;
		var capturedInnerText = move.capturedInnerText;
		var promoted = move.promoted;
		currentPlayer = player;
		playerIndicator.innerText = currentPlayer;
		moveFromTo(newPosition,oldPosition);
		if(promoted){
			oldSquare = document.getElementById(oldPosition);
			oldSquare.innerText = "\u25CE";
			oldSquare.className = oldSquare.className.replace(" promoted","");
		}
		if(capturedPosition){
			capturedSquare = document.getElementById(capturedPosition);
			capturedSquare.innerText = capturedInnerText;
			if(player == "playerOne"){
				capturedSquare.className += " playerTwo";
			}else{
				capturedSquare.className += " playerOne";
			}
			markAsCapturable(capturedSquare);
			if(capturedInnerText.indexOf("\u25C9") !== -1){
				capturedSquare.className += " promoted";
			}
			capturedSquare.className = capturedSquare.className.replace(/ captured\d?/g,"");
		}
		refreshCapturables();
	}
}