const expect = require('chai').expect
const sinon = require('sinon')
const factory = require('./setup/factory')
const Domore = require('../index')
const miss = require('mississippi')

describe('datasets', async () => {
  let client = new Domore('foo', 'bar', ['N/A'])

  describe('with a simple return', async () => {

    let datasetFixtures = []

    // Mock the datasets retrieved
    beforeEach(async() => {
      datasetFixtures = [];
      for(let i = 0; i < 148; i++) {
        const ds = await factory.build('dataset', {id: `dataset-${i}`})
        datasetFixtures.push(ds)
      }

      let stubList = sinon.stub(client.dataset, 'list')
      stubList.withArgs().resolves(datasetFixtures)
      stubList.withArgs(50, 0).resolves(datasetFixtures.slice(0, 50))
      stubList.withArgs(50, 1).resolves(datasetFixtures.slice(50, 100))
      stubList.withArgs(50, 2).resolves(datasetFixtures.slice(100, 150))
    })

    afterEach(async() => {
      client.dataset.list.restore()
    })

    it('streams the datasets, paginating correctly', function(done) {
      // Grab them 50 at a time
      let stream = client.dataset.stream(50, 0)

      // Aggregate the entire stream
      let datasets = []
      new Promise(function(resolve, reject) {
        miss.each(stream, (ds, next) => {
          datasets.push(ds)
          next()
        }, (err) => {
          expect(err).to.be.undefined
          expect(datasets.length).to.equal(148)

          done(err)
        })
      })
    })

    it('gets all the datasets', async () => {
      let datasets = await client.dataset.getAll()
      expect(datasets.length).to.equal(148)
    })

    it('finds a specific dataset', async () => {
      let ds = await client.dataset.find((ds) => ds.id === 'dataset-67')
      expect(ds.id).to.equal('dataset-67')
    })
  })
})