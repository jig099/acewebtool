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
        var user = firebase.auth().currentUser; 
        res.status(200).send(JSON.stringify(user));
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

exports.getData = functions.https.onRequest((req,res) => {
  res.set("Access-Control-Allow-Origin", "https://acewebtool.firebaseapp.com");
  res.set("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
  } else {
    // check which graph should fetch according to graphAccess
    let currUID = req.query.currUID;
    admin.auth().getUser(currUID)
    .then(record => {
      let graphAccess = record.customClaims.graphAccess
      // if graphAccess is empty, that is, it is unset, initialize it to be all true
      if(!graphAccess){
        graphAccess = [true, true, true]
      }
      // get graphData according to what graphAccess one has
      let typeList = ['browser', 'engagement', 'speed']
      typeList = typeList.filter(graphAccess)
      let dataList = {}
      typeList.forEach( type => {
        console.log(type);
        let docRef = db.collection('analytics').doc(type);
        docRef.get().then(doc => {
          if(doc.exists){
            console.log(doc.data())
            dataList[type] = doc.data()
          }
          return null;
        }).catch( e => console.error(e.message));

      })
      res.set("Content-Type", "application/JSON");
      res.status(200).send(JSON.stringify(dataList));
    })
  }
});

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://acewebtool.firebaseio.com'
});

//setup owner: the data is the info you send. Context contains the infor about yourself
exports.setOwner = functions.https.onRequest((req,res)=>{
  res.set("Access-Control-Allow-Origin", "https://acewebtool.firebaseapp.com");
  res.set("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
  } else {
     let uid = JSON.parse(req.body).uid;
     admin.auth().setCustomUserClaims(uid, {owner: true})
     .then(()=>{admin.auth().getUser(uid)
      .then((userRecord)=>{console.log(userRecord);return null})
      .catch(e=>console.log(e));
      return null})
     .catch(e=>console.log(e))
  }
});

exports.modifyAdminAccess = functions.https.onRequest((req, res) => {
  res.set("Access-Control-Allow-Origin", "https://acewebtool.firebaseapp.com");
  res.set("Access-Control-Allow-Credentials", "true");
  let ownerUID = 'UEFMvCcQ9Wd0n3E2hxDuI0LYxqu1'

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
  } else {
    // parse data
    let reqBody = JSON.parse(req.body)
    let currUID= reqBody.currUID
    let adminUID = reqBody.adminUID
    let modifyFlag = reqBody.modifyFlag

    // check if the curr user has owner access
    if(currUID !== ownerUID){
      res.status(504).send("Only owner can modify admin access.");
    }

    // the flag obj passed in setCustomUserClaims to modify admin access
    let flagObj = {'admin':modifyFlag}

    // set the access, then pass back the userRecord
     admin.auth().setCustomUserClaims(adminUID, flagObj)
     .then(() => {
       admin.auth().getUser(adminUID)
       .then(userRecord => 
        {
          console.log(userRecord);
          res.status(200).send(JSON.stringify(userRecord));
          return null;
        })
      .catch(e=> {
        console.log(e)
        res.status(504).send(e.message);

      });
      return null;
    })
     .catch(e=>console.log(e));
  }
})



exports.addAccount = functions.https.onRequest((req, res) => {
  res.set("Access-Control-Allow-Origin", "https://acewebtool.firebaseapp.com");
  res.set("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
  } else {
    let body = JSON.parse(req.body);

    // parse data
    let userProp = body.accountInfo;
    let currUID = body.currUID;
    console.log("userProp is", userProp);

    admin.auth().getUser(currUID).then(userRecord => {
      let ownerId = userRecord.customClaims.owner
      let adminId = userRecord.customClaims.admin

      // if the current user is not a owner nor a admin, block request
      if (!ownerId && !adminId){
          res.status(504).send("Only owner/admin can add users");

      } else {

        admin.auth().createUser(userProp)
        .then( r => {
          console.log("user record is ", r);
          let createdAccount = {};
          createdAccount.uid = r.uid;
          createdAccount.email = r.email;
          return createdAccount;
        })
        .then(newAcc => {res.status(200).send(JSON.stringify(newAcc));return null})
        .catch(e => console.error(e))

      }
      return null;
    })
    .catch(e => console.log(e))



    // check if user is owner or admin
    // admin.auth().verifyIdToken(currUID)
    // .then((claims) => {
    //   if (claims.admin === false && claims.owner === false) {
    //       res.status(504).send("Only owner/admin can add users");
    //   }
    //   else{
    //     //create account 
    //     admin.auth().createUser(userProp)
    //     .then( r => {
    //       let createdAccount;
    //       createdAccount.uid = r.uid;
    //       createdAccount.email = r.email;
    //       return createdAccount;
    //     })
    //     .then(newAcc => {res.status(200).send(JSON.stringify(newAcc));return null})
    //     .catch(e => console.error(e))
    //   }
    //   return null;
    // })
    // .catch(e => console.error(e))
  }
});

//edit account
exports.editAccount = functions.https.onRequest((req,res)=>{
  res.set("Access-Control-Allow-Origin", "https://acewebtool.firebaseapp.com");
  res.set("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
  } else {

    let body = JSON.parse(req.body);
     
    // parse data
    let modifiedAccount = body.modifiedAccount;
    let currUID = body.currUID;
    let otherUID = body.otherUID;

    // owner - admin pair, currUID is owner, otherUID is admin
    let ownerUID = 'UEFMvCcQ9Wd0n3E2hxDuI0LYxqu1'
    if(ownerUID === currUID){
      // if currUID is a owner, check if other is a admin
      admin.auth().getUser(otherUID)
      .then(userRecord => {
        let otherAccess = userRecord.customClaims.admin? 'admin':'nonadmin'
        if(otherAccess === 'admin'){
          admin.auth().updateUser(otherUID, modifiedAccount)
          .then(r => {
            res.status(200).send(JSON.stringify(r))
            return null
          })
          .catch(e => console.error(e));
        } else {
          res.status(500).send("You do not have access to edit this account!")
        }
        return null
      })
      .catch(e => console.error(e))
    } else {
      // if currUID is not a owner, check if it is admin
      admin.auth().getUser(currUID)
      .then(r => {
        let currAccess = r.customClaims.admin ? 'admin' : 'nonadmin';
        admin.auth().getUser(otherUID)
        .then(r => {
          let otherAccess = r.customClaims.admin ? 'admin' : 'nonadmin';
          // if curr is admin, other is user, then we are good
          if(currAccess === 'admin' && otherAccess === 'nonadmin'){
            admin.auth().updateUser(otherUID, modifiedAccount)
            .then(r => {
              res.status(200).send(JSON.stringify(r))
              return null;
            })
            .catch(e => console.error(e))
          } else {
            res.status(500).send("You do not have access to edit this account!")
          }
          return null
        })
        .catch(e => console.error(e))
        
        return null
      })
      .catch(e => console.error(e))
    }
  }
}); 

exports.deleteAccount = functions.https.onRequest((req,res)=>{
  res.set("Access-Control-Allow-Origin", "https://acewebtool.firebaseapp.com");
  res.set("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
  } else {

    let body = JSON.parse(req.body)
     
    // parse data
    let otherUID = body.otherUID;
    let currUID = body.currUID;

    // check if user is owner
    let ownerUID = 'UEFMvCcQ9Wd0n3E2hxDuI0LYxqu1'

    //if the user is owner
    if(currUID === ownerUID){
      admin.auth().deleteUser(otherUID)
      .then(function() {
        res.status(200).send('Successfully deleted user');
        console.log('Successfully deleted user');
        return null;
      })
      .catch(function(error) {
        console.log('Error deleting user:', error);
      });
    }
    else{
      // check if the user is admin
      admin.auth().getUser(currUID)
      .then(userRecord => {
        let userId = userRecord.customClaims.admin;
        if(!userId){
          res.status(504).send("you have no rights to delete");

        } else {
            admin.auth().deleteUser(otherUID)
            .then(function() {
              console.log('Successfully deleted user');
              res.status(200).send('Successfully deleted user');
              return null;
            })
            .catch(function(error) {
              console.error('Error deleting user:', error);
              res.status(504).send(JSON.stringify(error.message))
            });
          }
        return null;
      })
      .catch(e => {
        res.status(504).send(error.message)
      })
    }
  }
});

//getting all admin info from the db
exports.getAllAdmin = functions.https.onRequest((req,res) => {
  res.set("Access-Control-Allow-Origin", "https://acewebtool.firebaseapp.com");
  res.set("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
  } else {

    let body = JSON.parse(req.body)

    let ownerUID = 'UEFMvCcQ9Wd0n3E2hxDuI0LYxqu1'
    let currUID = body.currUID

    console.log(currUID)
    if(ownerUID !== currUID){
      res.status(500).send("Only owner can get all admin account")
      return null
    }

    admin.auth().listUsers()
    .then(function(userRecord) {
      // See the UserRecord reference doc for the contents of userRecord.
      console.log('Successfully fetched user data:', userRecord.users);
      let userInfo = userRecord.users
      let adminInfo = userInfo.filter(user => {
        if(!user.customClaims){
          return false
        } else{
          return user.customClaims.admin
        }
      })
      res.status(200).send(JSON.stringify(adminInfo));
      return null;
    })
    .catch(function(error) {
      console.log('Error fetching user data:', error);
    });
  } 
});


//getting all admin info from the db
exports.getAllUser= functions.https.onRequest((req,res) => {
  res.set("Access-Control-Allow-Origin", "https://acewebtool.firebaseapp.com");
  res.set("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
  } else {

    let body = JSON.parse(req.body)
    let currUID = body.currUID

    admin.auth().getUser(currUID)
    .then( userRecord => {
      let currAccess = userRecord.customClaims.admin
      if(!admin){
        res.status(500).send("Only owner can get all admin account")
        return null
      } else {

    admin.auth().listUsers()
    .then(function(userRecord) {
      // See the UserRecord reference doc for the contents of userRecord.
      console.log('Successfully fetched user data:', userRecord.users);
      let userInfo = userRecord.users
      let adminInfo = userInfo.filter(user => {

        //if custom claims is not set at all, it must be a user
        if(!user.customClaims){
          return true 
        } else{

          // if custom claims is set, but admin and owner is both false, then it is a user 
          return !user.customClaims.admin && !user.customClaims.owner
        }
      })
      res.status(200).send(JSON.stringify(adminInfo));
      return null;
    })
    .catch(function(error) {
      console.log('Error fetching user data:', error);
    });
      }
      return null;
    })
    .catch(e => console.error(e))
  } 
});

exports.modifyGraphAccess = functions.https.onRequest((req,res) => {
  res.set("Access-Control-Allow-Origin", "https://acewebtool.firebaseapp.com");
  res.set("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
  } else {
    
    let body = JSON.parse(req.body)
    let currUID = body.currUID;
    let otherUID = body.otherUID;
    let graphAccess = body.graphAccess;
    //first we want to check if current user is a admin or not
    admin.auth().getUser(currUID)
    .then(r => {
      let currAccess = r.customClaims.admin ? true : false;
      admin.auth().getUser(otherUID)
      .then(r => {
        let otherAccess = (r.customClaims.admin ? false : true) && (r.customClaims.owner? false : true); 
        //if both accesses are ok
        if(currAccess && otherAccess){
          admin.auth().setCustomUserClaims(otherUID,graphAccess)
          .then(() => {
            admin.auth().getUser(otherUID)
            .then(userRecord => 
             {
               console.log(userRecord);
               res.status(200).send(JSON.stringify(userRecord));
               return null;
             })
           .catch(e=> {
             console.log(e)
             res.status(504).send(e.message);
           });
           return null;
          });
        }
        else{
          res.status(500).send("Only admin can modify user account")
        }
        return null;
      })
      .catch(e => console.error(e))
      return null;
    })
    .catch(e => console.error(e))
  }
});
