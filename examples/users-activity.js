// dependencies

const superagent = require('superagent');


// globals

const API_ROUTE = "https://api.portal-agylia.com/GetUsersActivity";
const API_USERNAME = "<your username>";
const API_KEY = "<your API key>";
const FROM_DATE = "2017-01-01T00:00:00.000Z";
const TO_DATE = "2020-01-01T00:00:00.000Z";


// helpers

function fetch(from_date, to_date, cursor, done) {
  let params = {
    from_date,
    to_date
  };

  if (cursor) {
    params.cursor = cursor
  }

  superagent
    .post(API_ROUTE)
    .auth(API_USERNAME, API_KEY)
    .send({
      params
    })
    .set('Content-Type', 'application/json')
    .end((err, res) => {
      if (err) {
        console.log("ERR! " + err.status);
      } else {
        console.log(res.status + " [activity_count: " + res.body.activities.length + ", next_cursor: " + res.body.next_cursor + "]");

        done({
          next_cursor: res.body.next_cursor
        });
      }
    });
}

function getAllUsersActivity(from_date, to_date, cursor) {
  fetch(from_date, to_date, cursor, (data) => {
    if (data.next_cursor) {
      getAllUsersActivity(from_date, to_date, data.next_cursor);
    }
  });
}


// main

getAllUsersActivity(FROM_DATE, TO_DATE);
