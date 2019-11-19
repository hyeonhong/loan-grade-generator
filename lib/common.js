module.exports = {

  get: async function (url, qs = null, timeout = null) {
    const rp = require('request-promise');  // npm i request request-promise

    let responseBody;

    if (qs !== null) {
      let options = {
        uri: url,
        qs: qs,
        headers: {
          'User-Agent': 'Request-Promise'
        },
        json: true,  // JSON.parse(body);
        ...(timeout && { timeout: timeout })
      };

      await rp(options)
        .then(function (parsedBody) {
          responseBody = parsedBody;
        })
        .catch(function (err) {
          console.log(err);
          responseBody = null;
        });

    } else {
      await rp(url)
        .then(function (parsedBody) {
          responseBody = parsedBody;
        })
        .catch(function (err) {
          console.log(err);
          responseBody = null;
        });
    }

    return responseBody;
  },

  post: async function (url, payload, form = false) {
    const rp = require('request-promise');  // npm i request request-promise

    let options = {
      method: 'POST',
      uri: url
    };
    if (form) {  // URL Form
      options.form = payload;
    } else {  // JSON
      options.body = payload;
      options.json = true;  // JSON.parse(body);
    }

    let responseBody;
    await rp(options)
      .then(function (parsedBody) {
        responseBody = parsedBody;
      })
      .catch(function (err) {
        console.log(err);
      });

    return responseBody;
  },

  sleep: function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  getToday: function (delimiter = '') {
    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth() + 1;  // January is 0!
    let yyyy = today.getFullYear();

    if (dd < 10) {
      dd = '0' + dd;
    }

    if (mm < 10) {
      mm = '0' + mm;
    }

    today = yyyy + delimiter + mm + delimiter + dd;  // make sure it's string concatenation
    // today = yyyy + '-' + mm + '-' + dd;
    return today;
  },

  // parameter date -- Date object
  getDate: function (date) {
    let dd = date.getDate();
    let mm = date.getMonth() + 1;  // January is 0!
    let yyyy = date.getFullYear();

    if (dd < 10) {
      dd = '0' + dd;
    }

    if (mm < 10) {
      mm = '0' + mm;
    }

    date = yyyy.toString() + mm + dd;  // make sure it's string concatenation
    return date;
  },

  // check if number is numberic
  isNumeric: function (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  },

  // get weighted average
  // totalWeight does not include the current iteration's weight
  getWeightedAvg: function (value, weight, totalWeight, weightedAvg) {
    const dotProduct = weightedAvg * totalWeight + value * weight;  // get dot product
    return dotProduct / (totalWeight + weight);
  },

  addDashDate: function (date) {
    return date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8);
  }
}
