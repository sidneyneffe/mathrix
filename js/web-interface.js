
var app = {
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false)
    },
    onDeviceReady: function() {
        load()
    }
};

app.initialize();

var cordova, load
if (cordova == undefined) {
	/*window.onload = function () {
		setTimeout(load, 1500)
	}*/
	window.onload = load
}
