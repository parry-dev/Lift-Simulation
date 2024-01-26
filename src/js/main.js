// Data store for application state
var liftState = {
  floors: [],
  lifts: [],
};

function createFloors(numFloors, numLifts) {
  var floorsContainer = document.getElementById("floors");
  floorsContainer.innerHTML = "";

  for (var i = numFloors - 1; i >= 0; i--) {
    (function (floorNumber) {
      // Immediately Invoked Function Expression to capture current floor number
      var floor = document.createElement("div");
      floor.className = "floor";
      floor.id = "floor-" + floorNumber;

      var buttonDiv = document.createElement("div");
      buttonDiv.className = "actionButtons";

      // Create up and down buttons for each floor
      // <div class="round-button"><div class="round-button-circle"><a href="http://example.com" class="round-button">Button!!</a></div></div>
      if (floorNumber < numFloors - 1) {
        var upOuterDiv = document.createElement("div");
        upOuterDiv.className = "round-button";
        var upInnerDiv = document.createElement("div");
        upInnerDiv.className = "round-button-circle";
        var upATag = document.createElement("a");
        upATag.className = "round-button";
        var upIcon = document.createElement("i");
        upIcon.className = "fa fa-arrow-circle-up";
        upIcon.style.fontSize = "24px";
        upInnerDiv.onclick = function () {
          callLift(floorNumber, "up");
        };
        upOuterDiv.appendChild(upInnerDiv);
        upInnerDiv.appendChild(upATag);
        upATag.appendChild(upIcon);
        buttonDiv.appendChild(upOuterDiv);
      }
      if (floorNumber > 0) {
        var downOuterDiv = document.createElement("div");
        downOuterDiv.className = "round-button";
        var downInnerDiv = document.createElement("div");
        downInnerDiv.className = "round-button-circle";
        var downATag = document.createElement("a");
        downATag.className = "round-button";
        var downIcon = document.createElement("i");
        downIcon.className = "fa fa-arrow-circle-down";
        downIcon.style.fontSize = "24px";
        downInnerDiv.onclick = function () {
          callLift(floorNumber, "down");
        };
        downOuterDiv.appendChild(downInnerDiv);
        downInnerDiv.appendChild(downATag);
        downATag.appendChild(downIcon);
        buttonDiv.appendChild(downOuterDiv);
      }
      floor.appendChild(buttonDiv);

      var floorText = document.createElement("p");
      floorText.innerText = `Floor ${floorNumber}`;
      floor.appendChild(floorText);

      floorsContainer.appendChild(floor);
    })(i); // Pass the current value of i into the IIFE
  }
}

function responsiveDivSizes(numLifts) {
  var liftsContainer = document.getElementById("lifts");
  var liftSimulation = document.getElementById("liftSimulation");
  if (window.innerWidth >= numLifts*70 + 110) {
    var mainContainerWidth = numLifts*70 + 110;
    console.log("mainContainerWidth 111==>>> ", mainContainerWidth);
    liftSimulation.style.width = `calc(${mainContainerWidth}px)`;
    var perLiftWidth = 60;
  } else {
    var perLiftWidth = (window.innerWidth - 110)/numLifts;
    if (perLiftWidth < 40){
      var mainContainerWidth = numLifts*40 + 110;
      console.log("mainContainerWidth 222==>>> ", mainContainerWidth);
      liftSimulation.style.minWidth = `calc(${mainContainerWidth}px)`;
    } else {
      var mainContainerWidth = (perLiftWidth) * numLifts + 90;
      console.log("mainContainerWidth 333==>>> ", perLiftWidth * numLifts);
      liftSimulation.style.width = `calc(${mainContainerWidth}px)`;
    }
  }
  // console.log("perLiftWidth ==>>> ", perLiftWidth);
  var x = document.getElementsByClassName("lift");
  for (var i = 0; i < x.length; i++) {
      x[i].style.width = `${perLiftWidth}px`;
  }
  var floorElement = document.getElementById("floor-0");
  liftsContainer.style.width = `calc(${mainContainerWidth}px - 85px)`;
  var actionButtons = floorElement.querySelector(".actionButtons");
  liftsContainer.style.left = `${actionButtons.offsetLeft + actionButtons.offsetWidth + 20}px`;
}

function createLifts(numLifts) {
  var liftsContainer = document.getElementById("lifts");
  var floorElement = document.getElementById("floor-0");
  liftsContainer.innerHTML = ""; // Clear existing lifts if any

  for (var i = 0; i < numLifts; i++) {
    var lift = document.createElement("div");
    lift.className = "lift";
    lift.id = "lift-" + i;

    var leftDoor = document.createElement("div");
    leftDoor.className = "lift-door left";
    var rightDoor = document.createElement("div");
    rightDoor.className = "lift-door right";

    lift.appendChild(leftDoor);
    lift.appendChild(rightDoor);

    liftsContainer.appendChild(lift);
    var distanceToMove = floorElement.offsetTop - lift.offsetTop + 10;

    lift.style.transition = "transform 0ms linear";
    lift.style.transform = "translateY(" + distanceToMove + "px)";
  }
}

function openDoors(lift, data) {
  console.log("openDoors ==>>> ", data)
  if (data.doorsState === "closed") {
    data.doorsState = "moving";
    var leftDoor = lift.querySelector(".lift-door.left");
    var rightDoor = lift.querySelector(".lift-door.right");
    if (!leftDoor || !rightDoor) {
      leftDoor = document.createElement("div");
      leftDoor.className = "lift-door left";
      rightDoor = document.createElement("div");
      rightDoor.className = "lift-door right";
      lift.appendChild(leftDoor);
      lift.appendChild(rightDoor);
    }
    leftDoor.style.width = "0%";
    rightDoor.style.width = "0%";
    data.doorsState = "open";
  }
}

function closeDoors(lift, data) {
  console.log("closeDoors ==>>> ", lift)
  if (data.doorsState === "open") {
    data.doorsState = "moving";
    var leftDoor = lift.querySelector(".lift-door.left");
    var rightDoor = lift.querySelector(".lift-door.right");
    leftDoor.style.width = "100%";
    rightDoor.style.width = "50%";
    setTimeout(function () {
      data.doorsState = "closed";
      console.log("closeddd")
    }, 2500);
  }
}

// Function to determine which lift to send
function chooseLift(floorNumber, direction) {
  let closestLift = null;
  let closestDistance = Number.MAX_SAFE_INTEGER;

  for (let i = 0; i < liftState.lifts.length; i++) {
    let lift = liftState.lifts[i];
    // If the lift is moving, skip it
    if (lift.isMoving) continue;

    let distance = Math.abs(lift.currentFloor - floorNumber);

    // Prioritize a lift that is on the same floor and stationary
    if (distance === 0) return lift;

    // Check if the lift is closer than the current closest
    if (distance < closestDistance) {
      closestDistance = distance;
      closestLift = lift;
    }
  }

  // If no stationary lifts, pick one in motion that will reach the fastest
  if (!closestLift) {
    for (let i = 0; i < liftState.lifts.length; i++) {
      let lift = liftState.lifts[i];
      let willPassFloor =
        (direction === "up" &&
          lift.currentFloor < floorNumber &&
          lift.direction === "up") ||
        (direction === "down" &&
          lift.currentFloor > floorNumber &&
          lift.direction === "down");
      if (willPassFloor) {
        let distance = Math.abs(lift.currentFloor - floorNumber);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestLift = lift;
        }
      }
    }
  }

  return closestLift;
}

// Function to call a lift to a floor
function callLift(floorNumber, direction) {
  let selectedLift = chooseLift(floorNumber, direction);

  if (!selectedLift) {
    console.error("No available lift to send");
    return;
  }

  if (selectedLift.isMoving || selectedLift.doorsState !== "closed") {
    console.log("Lift is currently moving or doors are not closed.");
    return; // Do not proceed if the lift is moving or the doors are not closed
  }

  // Set the lift's state as moving and set the direction
  selectedLift.isMoving = true;
  selectedLift.direction = direction;

  // Now, move the lift
  moveLift(selectedLift, floorNumber);
}

function moveLift(lift, floorNumber) {
  if (lift.doorsState !== "closed") {
    console.log("Doors are not closed. Lift cannot move.");
    return; // Exit the function if doors are not closed
  }

  var selectedLiftElement = document.getElementById("lift-" + lift.id);
  var floorElement = document.getElementById("floor-" + floorNumber);
  if (!selectedLiftElement || !floorElement) {
    console.error("Selected lift or floor element does not exist in the DOM.");
    return; // Exit the function if elements are not found
  }

  var distanceToMove = floorElement.offsetTop - selectedLiftElement.offsetTop + 10;

  // Calculate the number of floors to move
  var numberOfFloorsToMove = Math.abs(lift.currentFloor - floorNumber);

  // Calculate the total time to move the lift based on 2 seconds per floor
  var totalTimeToMove = numberOfFloorsToMove * 2000; // 2000 ms (2 seconds) per floor

  // Move the lift
  selectedLiftElement.style.transition = "transform " + totalTimeToMove + "ms linear"; // Set the transition duration
  selectedLiftElement.style.transform = "translateY(" + distanceToMove + "px)";

  // Open and close doors after reaching the floor
  setTimeout(function () {
    openDoors(selectedLiftElement, lift);
  }, totalTimeToMove);

  setTimeout(function () {
    closeDoors(selectedLiftElement, lift);
  }, totalTimeToMove + 2500); // Wait for the time to move plus 2.5s for the doors

  // Update the lift's current floor once it has reached the target
  setTimeout(function () {
    lift.currentFloor = floorNumber;
    lift.isMoving = false;
    lift.direction = null; // Reset the lift's direction when it's stationary
  }, totalTimeToMove);
}

// Initialization function to create lift objects in the liftState
function initLiftSimulation(numFloors, numLifts) {
  createFloors(numFloors, numLifts);
  createLifts(numLifts);

  // Initialize the lifts in the liftState
  liftState.lifts = [];
  for (let i = 0; i < numLifts; i++) {
    liftState.lifts.push({
      id: i,
      currentFloor: 0, // Assuming all lifts start at floor 0
      isMoving: false,
      doorsState: "closed", // The initial state of doors is closed
      direction: null, // 'up', 'down', or null when stationary
    });
  }
}

function stimulate() {
  var form = document.getElementById("liftsForm");
  var numFloors = form.numFloors;
  var numLifts = form.numLifts;
  var errorNumFloors = document.getElementById("errorNumFloors");
  var errorNumLifts = document.getElementById("errorNumLifts");
  var isValid = true;

  // Clear previous errors
  errorNumFloors.style.display = "none";
  errorNumLifts.style.display = "none";

  // Validate numFloors
  if (!numFloors.value || numFloors.value <= 0) {
    errorNumFloors.style.display = "block";
    errorNumFloors.textContent = "Please enter the positive number of floors.";
    isValid = false;
  }

  // Validate numLifts
  if (!numLifts.value || numLifts.value <= 0) {
    errorNumLifts.style.display = "block";
    errorNumLifts.textContent = "Please enter the positive number of lifts.";
    isValid = false;
  }

  if (isValid) {
    console.log(
      "Number of Floors: " +
        numFloors.value +
        ", Number of Lifts: " +
        numLifts.value
    );
    formContainer.style.display = "none";
    backButton.style.display = "block";
    // createFloors(parseInt(numFloors.value));
    // createLifts(parseInt(numLifts.value));
    document.getElementById("liftSimulation").style.display = "block";
    initLiftSimulation(numFloors.value, numLifts.value);
    responsiveDivSizes(numLifts.value)
    
  }
}

function goBack() {
  var formContainer = document.getElementById("formContainer");
  var backButton = document.getElementById("backButton");
  var form = document.getElementById("liftsForm");

  // Reset the form and update display properties
  form.reset();
  document.getElementById("liftSimulation").style.display = "none";
  formContainer.style.display = "block";
  backButton.style.display = "none";
}
initLiftSimulation(10, 6);
responsiveDivSizes(6);

window.addEventListener("resize", function(event) {
  var form = document.getElementById("liftsForm");
  responsiveDivSizes(form.numLifts.value);
})