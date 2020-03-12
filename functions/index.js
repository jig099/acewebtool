//firebase init
const functions = require("firebase-functions");
const admin = require('firebase-admin');
require("firebase/firestore");
require("cookie-parser");
const firebase = require("firebase");
var firebaseConfig = {
  apiKey: "AIzaSyAENcKzxkYJQWdAqUGnL_Jz3kHngDzWX2M",
  authDomain: "acewebtool.firebaseapp.com",
  databaseURL: "https://acewebtool.firebaseio.com",
  projectId: "acewebtool",
  storageBucket: "acewebtool.appspot.com",
  messagingSenderId: "921093481060",
  appId: "1:921093481060:web:6121d3db60091cc5273571",
  measurementId: "G-F5ZP5735LL"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
var db = firebase.firestore();
const auth = firebase.auth();
//if the user turns the js off
exports.scriptless = functions.https.onRequest((req, res) => {
  res.set("Access-Control-Allow-Origin", "https://acewebtool.firebaseapp.com");
  res.set("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
  } else {
    // sanitize the code by matching referer
    let referer = req.headers.referer;
    if (!referer.match("https://acewebtool.firebaseapp.com")) {
      res.status(418).send("don't you try to hack me");
      return;
    }

    if (req.headers.cookie === undefined) {
      res.status(500).send("The cookie is not set yet");
    } else {
      let cookie = req.headers.cookie.split("=")[1];
      console.log(`the cookie after splitting is ${cookie}`);
      let cookieRef = db.collection("users").doc(cookie);
      let data = {};
      data[req.headers["referer"] + new Date()] = req.headers;
      cookieRef.set(data, { merge: true });
      res.status(200).send(req.body);
    }
  }
});

//used to collect all the data
exports.collector = functions.https.onRequest((req, res) => {
  res.set("Access-Control-Allow-Origin", "https://acewebtool.firebaseapp.com");
  res.set("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
  } else {
    // sanitize the code by matching referer
    let referer = req.headers.referer;
    if (!referer.match("https://acewebtool.firebaseapp.com")) {
      res.status(418).send("don't you try to hack me");
      return;
    }

    // set data base entry
    // let cookie = req.headers.cookie.split("=")[1];
    // console.log(`the cookie after splitting is ${cookie}`);
    let data = JSON.parse(req.body);
    // let cookieRef = db.collection("users").doc(cookie);
    // cookieRef.set(data, { merge: true });
    let speedRef = db.collection("analytics").doc("speed");

    speedRef.get().then(doc => {
        if (!doc.exists){
            speedRef.set({speed : [data.performance.loadTime]});
        }
        else{
          console.log((doc.data()));
          console.log((doc.data().speed));
         let oldArr = doc.data().speed;
         oldArr.push(data.performance.loadTime);
          speedRef.set({'speed':oldArr});
        }
        return null;
    }
    ).catch(e => console.error(e));

    //for engagement
    let engageRef = db.collection("analytics").doc("engagement");
    console.log(data.engagement);
    engageRef.get().then(doc => {
        if (!doc.exists){
            engageRef.set({engagement : [data.engagement]});
        }
        else{
          console.log((doc.data()));
         let oldArr = doc.data().engagement;
         oldArr.push(data.engagement);
         engageRef.set({'engagement':oldArr});
        }
        return null;
    }
    ).catch(e => console.error(e));

    // calculate the load time, and push it to database
    console.log(data.browser);
    let browserRef = db.collection("analytics").doc("browser");

    // setup browser ref as a counter
    browserRef
      .get()
      .then(doc => {
        if (!doc.exists) {
          browserRef.set({
            chrome: 0,
            ie: 0,
            firefox: 0,
            safari: 0,
            opera: 0,
            unknown: 0
          });
        }
        // increment browser by one
        let updateObj = {};
        updateObj[data.browser] = firebase.firestore.FieldValue.increment(1);
        browserRef.update(updateObj);
        return null;
      })
      .catch(e => console.error(e));

    res.status(200).send(req.body);
  }
});

//used to distribute new cookie/retrive old cookie
exports.sessionize = functions.https.onRequest((req, res) => {
  let method = req.method;
  res.set("Access-Control-Allow-Origin", "https://acewebtool.firebaseapp.com");
  res.set("Access-Control-Allow-Credentials", "true");
  let cookie = req.headers.cookie;
  console.log(cookie);

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
  } else {
    if (method === "GET") {
      if (cookie === undefined) {
        // create a UUID as the cookie
        var dt = new Date().getTime();
        var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          function(c) {
            var r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
          }
        );

        // create cookie
        res.cookie("__session", uuid, {
          expires: new Date(Date.now() + 900000 * 4),
          httpOnly: true
        });

        res.set("Content-Type", "application/JSON");
        console.log("first time creat:",JSON.stringify({ __session: uuid }));
        res.status(200).send(JSON.stringify({ __session: uuid }));
      } else {
        res.set("Content-Type", "text/plain");
        console.log("second time cookie:",cookie);
        res.status(200).send(cookie);
      }
    } else {
      // except for get, other method is not allowed
      res
        .status(405)
        .send(
          `${method} is not allowed. Only GET method is allowed for this endpoint`
        );
    }
  }
});

exports.signup = functions.https.onRequest((req, res) => {
  res.set("Access-Control-Allow-Origin", "https://acewebtool.firebaseapp.com");
  res.set("Access-Control-Allow-Credentials", "true");
  let cookie = req.headers.cookie;
  console.log(cookie);

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
  } else {
    user = JSON.parse(req.body);
    console.log(user);
    const promise = auth.createUserWithEmailAndPassword(
      user.emailVal,
      user.pwdVal
    );
    promise
      .then(res.status(200).send("signupok"))
      .catch(e => console.log(e.message));
  }
});

//login
exports.login = functions.https.onRequest((req, res) => {
  res.set("Access-Control-Allow-Origin", "https://acewebtool.firebaseapp.com");
  res.set("Access-Control-Allow-Credentials", "true");
  let cookie = req.headers.cookie;
  console.log(cookie);

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
  } else {
    user = JSON.parse(req.body);
    const promise = auth.signInWithEmailAndPassword(user.emailVal, user.pwdVal);
    promise
      .then(() => {
        res.status(200).send("The user has successfully logged in");
        return null;
      })
      .catch(e => {
        res.status(500).send(e.message);
      });
  }
});

exports.signout = functions.https.onRequest((req, res) => {
  res.set("Access-Control-Allow-Origin", "https://acewebtool.firebaseapp.com");
  res.set("Access-Control-Allow-Credentials", "true");
  let cookie = req.headers.cookie;
  console.log(cookie);

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
  } else {
    const promise = auth.signOut();
    promise.then(res.status(200).send("ok")).catch(e => console.log(e.message));
  }
});

exports.getdata = functions.https.onRequest((req,res) => {
  res.set("Access-Control-Allow-Origin", "https://acewebtool.firebaseapp.com");
  res.set("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
  } else {
    let type = req.query.type;
    console.log(type);
    let docRef = db.collection('analytics').doc(type);
    docRef.get().then(doc => {
      if(doc.exists){
        console.log(doc.data());
        res.set("Content-Type", "application/JSON");
        let temp = {};
        temp[type] = doc.data();
        res.status(200).send(JSON.stringify(temp));
      }
      console.log(doc.data());
      return null;
    }).catch( e => console.error(e.message));
  }
});

//getting all user info from the db
exports.getalluser = functions.https.onRequest((req,res) => {
  res.set("Access-Control-Allow-Origin", "https://acewebtool.firebaseapp.com");
  res.set("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
  } else {
    admin.auth().getUserByEmail(email)
    .then(function(userRecord) {
      // See the UserRecord reference doc for the contents of userRecord.
      console.log('Successfully fetched user data:', userRecord.toJSON());
      return null;
    })
    .catch(function(error) {
    console.log('Error fetching user data:', error);
    });
  } 
});

//update a specific user info in the db
//delete a user from db 
//add a user to the db

