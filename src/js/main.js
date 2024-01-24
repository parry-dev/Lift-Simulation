function stimulate() {
    var form = document.getElementById('liftsForm');
    var numFloors = form.numFloors.value;
    var numLifts = form.numLifts.value;
    
    console.log("Number of Floors: " + numFloors + ", Number of Lifts: " + numLifts);

    form.reset();
}