const factory = require('factory-girl').factory;

factory.define('dataset', Object, {
	id: factory.seq('dataset.id', (n) => `dataset-${n}`)
})


module.exports = factory
