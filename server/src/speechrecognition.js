
let usevoice = ('yes' == (new URL(document.location)).searchParams.get('usevoice'));

// TODO: try this out!

if (usevoice && annyang) {
	var commands = {
		'call *fname': function(fname) {
			console.log("got the command " + fname);
		},
		'do things': function() {
			console.log('did things');
		}
	}

	annyang.addCommands(commands);
	annyang.start();
}