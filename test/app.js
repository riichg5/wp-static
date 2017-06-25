var co =require('co');

function* test() {
	yield 1;
	yield 2;
}

var gen = test();
console.log(gen.next());
console.log(gen.next());


co(function* a() {
	try {
	  	var res = yield [
	    	Promise.resolve(1),
	    	Promise.resolve(2),
	    	Promise.reject(3),
	  	];
	  	console.log(res); // => [1, 2, 3] 
	} catch (error) {
	  	console.log(`error: ${error}`);
	}
}).catch(error => {
	console.log(error);
});
