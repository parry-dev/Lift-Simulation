// Data store for application state
var liftState = {
  floors: [],
  lifts: [],
  end: false,
  redistribute: false,
};

function createFloors(numFloors) {
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
        var upButton = document.createElement("button");
        upButton.className = "upButton";
        upButton.innerText = "Up";
        upButton.onclick = function () {
          handleRequest(floorNumber, "up");
        };
        buttonDiv.appendChild(upButton);
      }
      if (floorNumber > 0) {
        var downButton = document.createElement("button");
        downButton.className = "downButton";
        downButton.innerText = "Down";
        downButton.onclick = function () {
          handleRequest(floorNumber, "down");
        };
        buttonDiv.appendChild(downButton);
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
  if (window.innerWidth >= numLifts * 70 + 110) {
    var mainContainerWidth = numLifts * 70 + 110;
    liftSimulation.style.width = `calc(${mainContainerWidth}px)`;
    var perLiftWidth = 60;
  } else {
    var perLiftWidth = (window.innerWidth - 110) / numLifts;
    if (perLiftWidth < 40) {
      var mainContainerWidth = numLifts * 40 + 110;
      liftSimulation.style.minWidth = `calc(${mainContainerWidth}px)`;
    } else {
      var mainContainerWidth = perLiftWidth * numLifts + 90;
      liftSimulation.style.width = `calc(${mainContainerWidth}px)`;
    }
  }
  // console.log("perLiftWidth ==>>> ", perLiftWidth);
  var x = document.getElementsByClassName("lift");
  for (var i = 0; i < x.length; i++) {
    x[i].style.width = `${perLiftWidth}px`;
  }
  var floorElement = document.getElementById("floor-0");
  liftsContainer.style.width = `calc(${mainContainerWidth}px - 88px)`;
  var actionButtons = floorElement.querySelector(".actionButtons");
  liftsContainer.style.left = `${
    actionButtons.offsetLeft + actionButtons.offsetWidth + 10
  }px`;
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
  data.currentRequest = null;
  data.isDoorOpen = true;
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
}

function closeDoors(lift, data) {
  if (data.canClose) {
    data.isDoorOpen = true;
    var leftDoor = lift.querySelector(".lift-door.left");
    var rightDoor = lift.querySelector(".lift-door.right");
    leftDoor.style.width = "100%";
    rightDoor.style.width = "50%";
    let doorFlagTimeOut = setTimeout(function () {
      data.isDoorOpen = false;
    }, 2500);
    data.doorFlagTimeOuts.push(doorFlagTimeOut);
  }
}

function processLiftMovements() {
  liftState.lifts.forEach((lift) => {
    // Process the next request if the lift is not moving and the doors are not moving
    if (!lift.isMoving && !lift.isDoorOpen && lift.requestQueue.length > 0) {
      // Get the next request
      const nextRequest = lift.requestQueue.shift(); // Remove the request from the queue

      // Move the lift to the requested floor
      // lift.currentFloor = nextRequest.floor;
      // console.log(
      //   `Lift ${lift.id} moved to floor ${lift.currentFloor} for ${nextRequest.direction} request.`
      // );
      moveLift(lift, nextRequest.floor, nextRequest.direction);
    }
  });

  liftState.redistribute = !liftState.redistribute;

  if (liftState.redistribute) {
    setTimeout(redistributeRequests, 505);
  }

  if (!liftState.end) {
    setTimeout(processLiftMovements, 50);
  }
}

function redistributeRequests() {
  // Identify overloaded and underloaded lifts
  let overloadedLifts = liftState.lifts.filter(
    (lift) => lift.requestQueue.length > averageRequestsPerLift()
  );
  let underloadedLifts = liftState.lifts.filter(
    (lift) => lift.requestQueue.length < averageRequestsPerLift()
  );

  // Function to calculate the average number of requests per lift
  function averageRequestsPerLift() {
    let totalRequests = liftState.lifts.reduce(
      (acc, lift) => acc + lift.requestQueue.length,
      0
    );
    return totalRequests / liftState.lifts.length;
  }

  // Attempt to redistribute requests from overloaded to underloaded lifts
  overloadedLifts.forEach((overloadedLift) => {
    while (
      overloadedLift.requestQueue.length > averageRequestsPerLift() &&
      underloadedLifts.length > 0
    ) {
      // Find the most suitable underloaded lift for the next request in the overloaded lift
      let nextRequest = overloadedLift.requestQueue[0]; // Consider the first request in the queue
      let suitableUnderloadedLift = findMostSuitableLiftForRedistribution(
        nextRequest.floor,
        nextRequest.direction,
        underloadedLifts
      );

      if (suitableUnderloadedLift) {
        // Move the request from the overloaded lift to the suitable underloaded lift
        suitableUnderloadedLift.requestQueue.push(nextRequest);
        overloadedLift.requestQueue.shift(); // Remove the request from the overloaded lift

        // Update the underloaded lifts list in case the selected lift is now considered overloaded
        underloadedLifts = underloadedLifts.filter(
          (lift) => lift.requestQueue.length < averageRequestsPerLift()
        );
      } else {
        // If no suitable underloaded lift is found for the request, break the loop
        break;
      }
    }
  });
}

// Function to find the most suitable lift for redistribution among underloaded lifts
function findMostSuitableLiftForRedistribution(
  requestFloor,
  direction,
  underloadedLifts
) {
  return underloadedLifts
    .filter((lift) => !lift.isMoving && !lift.isDoorOpen)
    .reduce((prev, curr) => {
      return Math.abs(curr.targetFloor - requestFloor) <
        Math.abs(prev.targetFloor - requestFloor)
        ? curr
        : prev;
    }, underloadedLifts[0]); // Default to the first underloaded lift if none are idle
}

function findMostSuitableLift(requestFloor, direction) {
  // Start by filtering for idle lifts
  let idleLifts = liftState.lifts.filter(
    (lift) => !lift.isMoving && !lift.isDoorOpen
  );

  // If there are idle lifts, choose the closest one to the request floor
  if (idleLifts.length > 0) {
    return idleLifts.reduce((prev, curr) => {
      return Math.abs(curr.currentFloor - requestFloor) <
        Math.abs(prev.currentFloor - requestFloor)
        ? curr
        : prev;
    });
  }

  // If no idle lifts are available, sort all lifts by the number of requests in their queue
  let sortedLifts = [...liftState.lifts].sort(
    (a, b) => a.requestQueue.length - b.requestQueue.length
  );

  // Take the first half of the sorted lifts with fewer requests
  let halfLifts = sortedLifts.slice(0, Math.ceil(sortedLifts.length / 2));

  // Filter the first half lifts for those that can service the request
  let suitableLifts = halfLifts.filter((lift) => {
    return (
      lift.direction === direction &&
      ((direction === "up" && lift.targetFloor <= requestFloor) ||
        (direction === "down" && lift.targetFloor >= requestFloor))
    );
  });

  // Choose the closest suitable lift from the half with fewer requests
  if (suitableLifts.length > 0) {
    return suitableLifts.reduce((prev, curr) => {
      return Math.abs(curr.targetFloor - requestFloor) <
        Math.abs(prev.targetFloor - requestFloor)
        ? curr
        : prev;
    });
  }

  // As a fallback, assign the request to the nearest lift based on the target floor
  return liftState.lifts.reduce((prev, curr) => {
    return Math.abs(curr.targetFloor - requestFloor) <
      Math.abs(prev.targetFloor - requestFloor)
      ? curr
      : prev;
  });
}

function handleRequest(floorId, direction) {
  // const floor = liftState.floors.find((f) => f.id === floorId);

  let duplicateRequests = liftState.lifts.filter(
    (lift) => {
      let sameCurrent = lift.currentRequest && lift.currentRequest.floorNumber === floorId && lift.currentRequest.direction === direction;
      let sameRequestInQueue = lift.requestQueue.filter((request) => request.floor === floorId && request.direction === direction);
      return sameCurrent || sameRequestInQueue.length > 0;
    }
  );

  if (duplicateRequests.length > 0) {
    return;
  }

  // Find the most suitable lift and add the request
  const suitableLift = findMostSuitableLift(floorId, direction);
  if (suitableLift) {
    const requestExists = suitableLift.requestQueue.some(
      (req) => req.floor === floorId && req.direction === direction
    );
    if (!requestExists) {
      if (suitableLift.targetFloor === floorId && !suitableLift.isMoving) {
        // let sameFloorLifts = liftState.lifts.filter(
        //   (lift) => lift.currentFloor === floorId
        // );
        // sameFloorLifts.forEach((lift) => {
        var selectedLiftElement = document.getElementById("lift-" + suitableLift.id);
        suitableLift.canClose = false;
        openDoors(selectedLiftElement, suitableLift);
        suitableLift.doorFlagTimeOuts.forEach((timeOut) => {
          clearTimeout(timeOut);
        });
        suitableLift.closeDoorTimeouts.forEach((timeOut) => {
          clearTimeout(timeOut);
        });

        let closeDoorTimeOut = setTimeout(function () {
          suitableLift.canClose = true;
          closeDoors(selectedLiftElement, suitableLift);
        }, 2500);
        setTimeout(function () {
          suitableLift.closeDoorTimeouts = [closeDoorTimeOut];
        }, 50);
        // });
        return;
      } else if (
        suitableLift.targetFloor === floorId &&
        (suitableLift.isMoving || suitableLift.isDoorOpen)
      ) {
        return;
      } else {
        suitableLift.requestQueue.push({
          floor: floorId,
          direction: direction,
        });
      }
      // console.log(
      //   `Request added to Lift ${suitableLift.id} for Floor ${floorId} going ${direction}`
      // );
    }
  } else {
    console.log("No suitable lift available currently. Request is queued.");
  }
}

function moveLift(lift, floorNumber, direction) {
  var selectedLiftElement = document.getElementById("lift-" + lift.id);
  var floorElement = document.getElementById("floor-" + floorNumber);
  if (!selectedLiftElement || !floorElement) {
    console.error("Selected lift or floor element does not exist in the DOM.");
    return;
  }
  if (lift.isDoorOpen) {
    console.log("Doors are not closed. Lift cannot move.");
    return;
  }
  if (lift.currentFloor === floorNumber) {
    return;
  }
  lift.currentRequest = {floorNumber: floorNumber, direction: direction}

  lift.isMoving = true;
  lift.direction = direction;
  lift.targetFloor = floorNumber;

  var distanceToMove =
    floorElement.offsetTop - selectedLiftElement.offsetTop + 10;

  // Calculate the number of floors to move
  var numberOfFloorsToMove = Math.abs(lift.currentFloor - floorNumber);

  // Calculate the total time to move the lift based on 2 seconds per floor
  var totalTimeToMove = numberOfFloorsToMove * 2000; // 2000 ms (2 seconds) per floor

  // Move the lift
  selectedLiftElement.style.transition =
    "transform " + totalTimeToMove + "ms linear"; // Set the transition duration
  selectedLiftElement.style.transform = "translateY(" + distanceToMove + "px)";

  // Open and close doors after reaching the floor
  setTimeout(function () {
    lift.canClose = false;
    openDoors(selectedLiftElement, lift);
    lift.doorFlagTimeOuts.forEach((timeOut) => {
      clearTimeout(timeOut);
    });
    lift.closeDoorTimeouts.forEach((timeOut) => {
      clearTimeout(timeOut);
    });
  }, totalTimeToMove);

  let closeDoorTimeOut = setTimeout(function () {
    lift.canClose = true;
    closeDoors(selectedLiftElement, lift);
  }, totalTimeToMove + 2500); // Wait for the time to move plus 2.5s for the doors
  setTimeout(function () {
    lift.closeDoorTimeouts = [closeDoorTimeOut];
  }, totalTimeToMove + 50);

  // Update the lift's current floor once it has reached the target
  setTimeout(function () {
    lift.currentFloor = floorNumber;
    lift.isMoving = false;
    lift.direction = null; // Reset the lift's direction when it's stationary
  }, totalTimeToMove);
}

// Initialization function to create lift objects in the liftState
function initLiftSimulation(numFloors, numLifts) {
  createFloors(numFloors);
  if(numFloors > 1) {
  createLifts(numLifts);
  }

  liftState.floors = [];
  for (let i = 0; i < numFloors; i++) {
    liftState.floors.push({
      id: i,
      upRequestActive: false,
      downRequestActive: false,
      liftsPresent: [],
    });
  }

  liftState.lifts = [];

  if(numFloors > 1) {
    for (let i = 0; i < numLifts; i++) {
      liftState.lifts.push({
        id: i,
        currentFloor: 0,
        targetFloor: 0,
        isMoving: false,
        isDoorOpen: false,
        direction: null,
        currentRequest: null,
        canClose: false,
        doorFlagTimeOuts: [],
        closeDoorTimeouts: [],
        doorsState: "",
        requestQueue: [],
      });
    }
  }

  processLiftMovements();
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
    liftState.end = false;
    document.getElementById("liftSimulation").style.display = "block";
    initLiftSimulation(numFloors.value, numLifts.value);
    responsiveDivSizes(numLifts.value);
  }
}

function goBack() {
  var formContainer = document.getElementById("formContainer");
  var backButton = document.getElementById("backButton");
  var form = document.getElementById("liftsForm");

  // Reset the form and update display properties
  liftState.end = true;
  form.reset();
  document.getElementById("liftSimulation").style.display = "none";
  formContainer.style.display = "block";
  backButton.style.display = "none";
}
// initLiftSimulation(10, 6);
// responsiveDivSizes(6);

window.addEventListener("resize", function (event) {
  var form = document.getElementById("liftsForm");
  responsiveDivSizes(form.numLifts.value);
});
