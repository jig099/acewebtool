google.charts.load("current", { packages: ["corechart"] });

const email = document.getElementById("email");
const password = document.getElementById("password");
const login = document.getElementById("loginBtn");
const signUp = document.getElementById("signUpBtn");

function sendbody(method, body) {
  const requestOptions = {
    method: method,
    redirect: "follow",
    credentials: "include",
    body: JSON.stringify(body)
  };
  return requestOptions;
}

login.addEventListener("click", e => {
  const user = {};
  user.emailVal = email.value;
  user.pwdVal = password.value;

  fetch(
    "https://us-central1-acewebtool.cloudfunctions.net/login",
    sendbody("POST", user)
  )
    .then(function(response) {
      if (response.ok) {
        console.log("login success, redirecting...");
        window.user_info = JSON.parse(response.body);
        showAnalytic();
      } else {
        console.error("The username or password is incorrect");
      }
    })
    .catch(error => console.log("error", error));
});

signUp.addEventListener("click", e => {
  const user = {};
  user.emailVal = email.value;
  user.pwdVal = password.value;

  fetch(
    "https://us-central1-acewebtool.cloudfunctions.net/signup",
    sendbody("POST", user)
  )
    .then(response => {
      if (response.ok) {
        window.user_info = user;
        console.log("SignUp Successful");
        showAnalytic();
      } else {
        console.error("There is an error when creating account");
      }
    })
    .catch(error => console.log("error", error));
});

function showAnalytic() {
  let login_page_el = document.querySelector("#login_page");
  let analysis_page_el = document.querySelector("#analysis_page");
  login_page_el.hidden = true;
  analysis_page_el.hidden = false;
}

const logout = document.getElementById("logout_btn");
logout.addEventListener("click", e => {
  let login_page_el = document.querySelector("#login_page");
  let analysis_page_el = document.querySelector("#analysis_page");
  const user = window.user_info;
  fetch(
    "https://us-central1-acewebtool.cloudfunctions.net/signout",
    sendbody("POST", user)
  )
    .then(() => {
      //needs to clear data
      login_page_el.hidden = false;
      analysis_page_el.hidden = true;
    })
    .catch(error => console.log("error", error));
});

const browser = document.getElementById("browser_btn");
browser.addEventListener("click", e => {
  fetch(
    "https://us-central1-acewebtool.cloudfunctions.net/getdata?type=browser"
  )
    .then(response => {
      return response.json();
    })
    .then(data => {
      console.log(data.browser);
      drawChart(data.browser);
    })
    .catch(error => console.log("error", error));
});

google.charts.load("current", { packages: ["table"] });


// get engagement data and visualize them
const engagement_btn_el= document.querySelector("#engagement_btn");
engagement_btn_el.addEventListener("click", e => {
  fetch("https://us-central1-acewebtool.cloudfunctions.net/getdata?type=engagement")
    .then(response => {
      return response.json();
    })
    .then(data => {
      console.log(data);
      let array = data.engagement.engagement;
      console.log(array)
      var output = array.map(function(obj) {
        return Object.keys(obj).sort().map(function(key) { 
          return obj[key];
        });
      });
      console.log(output);

      // for the case where

      // reorder so that cookie comes first, clickCount comes second
      output = output.map(d => {
        temp = d[1];
        d[1] = d[0];
        d[0] = temp;
        return d  
      })
      
      // clean cookie format, strip away "__session="
      output = output.map(function(d){
          let text = d[0];
          if( text.search('=') != -1){
            d[0]= d[0].split("=")[1];

          } else if (text.search(':') != -1){
            d[0] = d[0].split(':')[1];
            d[0] = d[0].match(/\"([^\"]+)"/)[1];
          }
          return d 
      })

      drawTable(output);
    })
    .catch(error => console.log("error", error));
});


// get speed data and visualize them
const speed_btn_el = document.querySelector("#speed_btn");
speed_btn_el.addEventListener("click", e => {
  fetch("https://us-central1-acewebtool.cloudfunctions.net/getdata?type=speed")
    .then(response => {
      return response.json();
    })
    .then(data => {
      console.log(data.speed.speed);
      drawHist(data.speed.speed);
    })
    .catch(error => console.log("error", error));
});


/****************************
 * Drawing functions
 ***************************/

function drawChart(data) {
  var d = google.visualization.arrayToDataTable([
    ["Browser type", "Count"],
    ["Chrome", data.chrome],
    ["Firebase", data.firefox],
    ["IE", data.ie],
    ["Opera", data.opera],
    ["Safari", data.safari],
    ["Unknow", data.unknown]
  ]);

  var options = {
    title: "Browser"
  };

  var chart = new google.visualization.PieChart(
    document.getElementById("piechart")
  );
  chart.draw(d, options);
}


function drawHist(data) {
  let pre_d = data.map(d => [d]);
  pre_d.unshift(["speed"]);
  let d = google.visualization.arrayToDataTable(pre_d);
  var options = {
    title: "Speed histogram",
    legend: { position: "none" }
  };

  var chart = new google.visualization.Histogram(
    document.getElementById("histogram")
  );
  chart.draw(d, options);
}



function drawTable(d) {
  // set up the data table
  var data = new google.visualization.DataTable();

  data.addColumn("string", "Cookie");
  data.addColumn("number", "Click Count");
  data.addColumn("number", "Visit Duration(s)");
  console.log(typeof(d));
  data.addRows(d);

  var table = new google.visualization.Table(
    document.getElementById("table_div")
  );

  table.draw(data, { showRowNumber: true, width: "100%", height: "100%" });
}


let adminEmail = 'yu123456@ucsd.edu'
let ownerUID = 'UEFMvCcQ9Wd0n3E2hxDuI0LYxqu1'
let adminPassword = '1234567'




/**
 * This is a versatile function that takes care of creation of a user account
 * @param {String} currUID owner of the request
 * @param {String} newEmail email of the new account
 * @param {*} newPwd password of the new account
 */
function addAccount(currUID, newEmail, newPwd){

  return new Promise((resolve, reject) => {

  let data = {'currUID':currUID, "accountInfo":{'email':newEmail, 'password':newPwd}};
  let endPointUrl = "https://us-central1-acewebtool.cloudfunctions.net/addAccount";

   fetch(
    endPointUrl, 
    sendbody('POST', data)
  )
  .then(r => r.json())
  .then(data => 
    {
      console.log(data)
      resolve(data);
    })
  .catch(e => console.error(e));
  })
}

// modify account
/**
 * Generic function that send request to editAccount
 * @param {string} currUID UID of the owner or admin
 * @param {string} otherUID UID of the account to be modified
 * @param {object} modifiedAccount a JSON that stores all the account info to be modified. 
 */
function editAccount(currUID, otherUID, modifiedAccount){
  let data = {'currUID':currUID, 'otherUID':otherUID, 'modifiedAccount':modifiedAccount}
  let endURL = "https://us-central1-acewebtool.cloudfunctions.net/modifyAdminAccess"

  fetch(
    endURL, 
    sendbody('POST', data)
  )
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(e => console.log(e))
}



/**
 * 
 * @param {string} ownerUID UID of the owner 
 * @param {string} adminUID UID of the admin account whose access are to be modified
 * @param {boolean} modifyFlag This is a flag that specify whether grant or retract access. true means grant this account admin access, false means retract this account admin access
 */
function modifyAdminAccess(ownerUID, adminUID , modifyFlag){
  let data = {'currUID':ownerUID, 'adminUID':adminUID, 'modifyFlag':modifyFlag};
  let endURL = "https://us-central1-acewebtool.cloudfunctions.net/modifyAdminAccess"

  fetch(
    endURL, 
    sendbody('POST', data)
  )
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(e => console.log(e))
}

function deleteAccount(currUID,otherUID){
  return new Promise((resolve, reject) => {

    let data = {'currUID':currUID, 'otherUID':otherUID};
    let endPointUrl = "https://us-central1-acewebtool.cloudfunctions.net/deleteAccount";
  
     fetch(
      endPointUrl, 
      sendbody('POST', data)
    )
    .then(r => r.text())
    .then(text => console.log(text))
    .catch(e => console.error(e))
    })
}


/**
 * Get all the admin information 
 * @param {string} currUID Get all the admin info
 * @returns {array} list of admin user info
 */
function getAllAdmin(currUID){
  return new Promise((resolve, reject) => {
    let data = {'currUID':currUID}
    let endPointUrl = "https://us-central1-acewebtool.cloudfunctions.net/getAllAdmin";

    fetch(
      endPointUrl, 
      sendbody('POST', data)
    )
    .then(r => {
      return r.json()
    })
      .then(data => {
        console.log(data)
        return null;
      })
    .catch(e => reject(e.message))
  })
}



getAllUser("xJSewH7W5dOJqrHDQUn2Qefvsa12")
/**
 * Get all the user information 
 * @param {string} currUID Get all the admin info
 * @returns {array} list of normal user info
 */
function getAllUser(currUID){
  return new Promise((resolve, reject) => {
    let data = {'currUID':currUID}
    let endPointUrl = "https://us-central1-acewebtool.cloudfunctions.net/getAllUser";

    fetch(
      endPointUrl, 
      sendbody('POST', data)
    )
    .then(r => {
      return r.json()
    })
      .then(data => {
        console.log(data)
        return null;
      })
    .catch(e => reject(e.message))
  })
}

/**
 * This function get graph data that is allowed to be accessed by currUID.
 * @param {string} currUID the current user's uid
 */
function getData(currUID){

  return new Promise((resolve, reject) => {

    // fetch the data from getData endpoint
    let endPointUrl = "https://us-central1-acewebtool.cloudfunctions.net/getData?currUID=" + currUID
    fetch(endPointUrl)
    .then(response => {
      return response.json();
    })
    .then(data => {
      console.log(data)
      resolve(data)
    })
    .catch(e => reject(e))
  })
}


// fetch("https://us-central1-acewebtool.cloudfunctions.net/getdata?type=engagement")
//     .then(response => {
//       return response.json();
//     })
//     .then(data => {
//       console.log(data);
//       let array = data.engagement.engagement;
//       console.log(array)
//       var output = array.map(function(obj) {
//         return Object.keys(obj).sort().map(function(key) { 
//           return obj[key];
//         });
//       });
//       console.log(output);







// getAllAdmin(ownerUID);

/*function editAccount(currUID,otherUID,updatedInfo){
  return new Promise ((resolve.reject)=>{
    
    
  });
}*/
