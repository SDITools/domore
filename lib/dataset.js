const csv = require('fast-csv')
const miss = require('mississippi')

class Dataset {
  constructor(domoClient) {
    this.domoClient = domoClient;
  }

  /* ====== Wrappers for existing Domo SDK functions ======= */
  async get(datasetId) {
    return this.domoClient.datasets.get(datasetId);
  }

  async list(limit, offset, sort) {
    return this.domoClient.datasets.list(limit, offset, sort);
  }

  async create(dataset) {
    return this.domoClient.datasets.create(dataset);
  }

  async update(datasetId, dataset) {
    return this.domoClient.datasets.update(datasetId, dataset);
  }

  async delete(datasetId) {
    return this.domoClient.datasets.delete(datasetId);
  }

  async importData(datasetId, csvData) {
    return this.domoClient.datasets.importData(datasetId, csvData)
  }

  async exportData(datasetId) {
    return this.domoClient.datasets.exportData(datasetId)
  }

  /* ====== The new stuff! ========== */

  /**
   * Returns all the datasets.
   *
   * @param {int} limit - Optional limit for pagination
   * @param {int} offset - Optional offset for pagination
   * @return Array of datasets
   */
  async getAll(limit = 50, offset = 0) {
    let datasetStream = this.stream(limit, offset)
    let datasets = []

    return new Promise(function(resolve, reject) {
      miss.each(datasetStream, (dataset, next) => {
        datasets.push(dataset)
        next()
      }, (err) => {
        if(err) {
          reject(err)
        } else {
          resolve(datasets)
        }
      })
    })
  }

  /**
   * Returns the first dataset to satisfy the callback function, similar to Array#find.
   * If no dataset is found, returns undefined
   *
   * The callback receives (element, index)
   * @return Promise (resolves to a dataset or undefined)
   */
  async find(callback) {
    let datasetStream = this.stream()
    let i = 0
    return new Promise(function(resolve, reject) {
      miss.each(datasetStream, (dataset, next) => {
        if(callback(dataset, i)) {
          // Short-circuits the stream reading. As soon as the dataset is found, it will stop reading the stream
          // and jump to the done() function below.
          resolve(dataset)
          next(true)
        } else {
          i += 1
          next()
        }
      }, (trueOrErr) => {
        if(trueOrErr === true) {
          // Dataset was found and returned, do nothing
        } else if(trueOrErr) {
          // An error occurred
          reject(trueOrErr)
        } else {
          // Nothing found
          resolve(undefined)
        }
      })
    })
  }

  /**
   * Returns a dataset's data parsed. The first row will be the column headers.
   *
   * @return Promise (resolves to a Array[Array])
   */
  async exportDataArray(datasetId) {
    const datasetMeta = await this.get(datasetId)
    const columns = datasetMeta.schema.columns.map(({name}) => name)
    const rawCSV = await this.exportData(datasetId)
    return new Promise(function (resolve, reject) {
      let data = [columns]
      csv.fromString(rawCSV).on("data", d => data = [...data, d])
      .on("end", () => { resolve(data) })
      .on("data-invalid", function(data){
        reject(`Cannot parse invalid CSV data: ${data}`)
      })
    })
  }

  /**
   * Imports JavaScript object data into a dataset. The input is an Array of JS objects.
   *
   * It will automatically extract the object values corresponding to the column names in the dataset schema. The object
   * keys must match the column names exactly (case, whitespace, etc.). Any object fields not corresponding to dataset
   * columns will be discarded. Any missing values will be replaced with null.
   *
   * TODO - This could benefit from a more stream-oriented approach to avoid the multi-buffering that could cause problems
   * with larger datasets.
   *
   * @param {Array} javascriptObjectArray An array of JS Objects whose key names match the column names in the dataset.
   * @return Promise (resolves to undefined)
   */
  async importDataJson(datasetId, javascriptObjectArray) {
    // Transform the objects to match the dataset schema
    const dataset = await this.get(datasetId)
    const columns = dataset.schema.columns.map(col => col.name)

    const transformed = javascriptObjectArray.map(obj => {
      return columns.map(col => obj[col] || null)
    })

    const csvString = await new Promise((resolve, reject) => {
      csv.writeToString(transformed, {headers: false}, (err, data) => {
        err ? reject(err) : resolve(data)
      })
    })

    return this.importData(datasetId, csvString)
  }

  /**
   * Returns a dataset's data parsed into an array of objects,
   *
   * @return Promise (resolves to Array[Object])
   */
  async exportDataJson(datasetId) {
    const data = await this.exportDataArray(datasetId)
    return data.slice(1).reduce((acc, row, i) => {
      const newRow = data[0].reduce((rowAcc, column, i) => ({...rowAcc, [column]: row[i]}), {})
      return [...acc, newRow]
    }, [])
  }

  /**
   * Creates the dataset and imports the CSV data.
   *
   * @return Promise (resolves to the dataset)
   */
  async createAndImport(dataset, csvData) {
    const createdDataset = await this.create(dataset)
    await this.importData(createdDataset.id, csvData)
    return createdDataset
  }

  /**
   * Creates the dataset and imports the JavaScript object data.
   *
   * @return Promise (resolves to the dataset)
   */
  async createAndImportJson(dataset, javascriptObjectArray) {
    const createdDataset = await this.create(dataset)
    await this.importDataJson(createdDataset.id, javascriptObjectArray)
    return createdDataset
  }


  /**
   * Get all the datasets (ie. metadata, not actual dataset data) as a stream.
   *
   * Under the hood, it's just sending paginated requests to the DOMO API,
   * but this makes it a little easier to compose. It's also easier to short-circuit
   * and not page through all results to find a specific item.
   */
  stream(pageSize = 50, startPage = 0) {
    const that = this
    let currentPage = startPage
    let recordBuffer = []

    return miss.from.obj(function(_size, next) {
      if(recordBuffer.length > 0) {
        next(null, recordBuffer.shift())
        return
      }

      const offset = currentPage * pageSize

      this.emit('requestPage', currentPage)
      that.list(pageSize, offset)
      .then((datasetList) => {
        currentPage += 1
        recordBuffer.push(...datasetList)

        const endOfRecords = datasetList.length < pageSize
        if(endOfRecords) {
          recordBuffer.push(null)
        }

        next(null, recordBuffer.shift())
      })
      .catch((err) => {
        next(err, null)
      })
    })
  }
}

module.exports = Dataset;
