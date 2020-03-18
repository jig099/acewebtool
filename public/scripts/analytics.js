google.charts.load("current", { packages: ["corechart", "table"] });

const email = document.getElementById("email");
const password = document.getElementById("password");
const login = document.getElementById("loginBtn");
const signUp = document.getElementById("signUpBtn");
const speedSection = document.getElementById("speed_section");
const browserSection = document.getElementById("browser_section");
const engagementSection = document.getElementById("engagement_section");
const histogramDiv = document.getElementById("histogram");
const piechartDiv = document.getElementById('piechart');
const tableDiv = document.getElementById('table_div');
const user_page_el = document.querySelector('#user_page');
const userManagementBtn = document.getElementById('userManagement');
const body_el = document.querySelector('body');
const main_title_el = document.getElementById('main_title')

//all the popup boxes
const userGraphAccessPopup = document.getElementById("user_graph_access_popup");
const adminAccessPopup = document.getElementById("admin_access_popup");
const editAccountPopup = document.getElementById("edit_account_popup");
const createAccountPopup = document.getElementById("create_account_popup");
const deletePopup = document.getElementById("delete_popup");
const browserAccess = document.getElementById("browserAccess");
const engagementAccess = document.getElementById("engagementAccess");
const speedAccess = document.getElementById("speedAccess");
const admin_access_popup_el = document.querySelector("#admin_access_popup");
const confirm_btn_el = document.querySelector("#aa_confirm_btn");
const cancel_btn_el = document.querySelector("#aa_cancel_btn");
const ea_password_el = document.getElementById('ea_password');
const ea_confirm_btn_el = document.getElementById("ea_confirm_btn");
const ea_cancel_btn_el = document.getElementById('ea_cancel_btn');
const ea_email_el = document.getElementById('ea_email')
const d_confirm_btn_el = document.getElementById('d_confirm_btn')
const d_cancel_btn_el = document.getElementById('d_cancel_btn')
const uga_cancel_btn =  document.getElementById('uga_cancel_btn')
const uga_confirm_btn = document.getElementById('uga_confirm_btn')
const blockDiv_el = document.getElementById('blockDiv')


let currUID;

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
    .then(function (response) {
      if (response.ok) {
        console.log("login success, redirecting...");
        console.log(response);
        response
          .json()
          .then(data => {
            currUID = data.user.uid;
            console.log(data);
          })
          .then(() => {
            showAnalytic();
            return null;
          })
          .catch(e => console.log(e));
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
        response.json().then(data => {
          currUID = data.user.uid;
        });
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
  console.log("iamhere");

  main_title_el.hidden = false;
  showAdminList();
  showUserList();
  getData(currUID)
    .then(data => {
      Object.entries(data).forEach(entry => {
        let key = entry[0];
        let value = entry[1];
        console.log("key", key);

        if (key === "browser") {
          browserSection.hidden = false;
          drawChart(value);
        } else if (key === "engagement") {
          engagementSection.hidden = false;
          let processedDate = processData(value);
          console.log(processedDate);
          drawTable(processedDate);
        } else {
          speedSection.hidden = false;
          drawHist(value.speed);
        }
      });
      return null;
    })
    .catch(error => console.log("error", error));
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
      user_page_el.hidden = true;
      
      histogramDiv.innerHTML = "";
      piechartDiv.innerHTML = "";
      tableDiv.innerHTML = "";

      document.getElementById("tbody").innerHTML="";
      document.getElementById("tbody2").innerHTML="";
      
      
    })
    .catch(error => console.log("error", error));
});


function processData(data) {
  let array = data.engagement;
  console.log(array);
  var output = array.map(function (obj) {
    return Object.keys(obj)
      .sort()
      .map(function (key) {
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
    return d;
  });

  // clean cookie format, strip away "__session="
  output = output.map(function (d) {
    let text = d[0];
    if (text.search("=") != -1) {
      d[0] = d[0].split("=")[1];
    } else if (text.search(":") != -1) {
      d[0] = d[0].split(":")[1];
      d[0] = d[0].match(/\"([^\"]+)"/)[1];
    }
    return d;
  });
  return output;
}


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
    title: "Browser",
    width:'700',
    height:'500'
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
    legend: { position: "none" }, 
    width:'700',
    height:'500'
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
  data.addColumn("number", "Visit Duration(ms)");
  data.addRows(d);
  console.log(typeof d);
  var table = new google.visualization.Table(
    document.getElementById("table_div")
  );

  table.draw(data, { showRowNumber: true, width: "100%", height: "100%" });
}

let adminEmail = "yu123456@ucsd.edu";
let ownerUID = "UEFMvCcQ9Wd0n3E2hxDuI0LYxqu1";
let adminPassword = "1234567";

//header for admin table 
let table_string = 
`
<h2> User Management </h2>
<table id="admin_table" class="pure-table" hidden>
        <thead>
          <tr>
            <th>
              UID
            </th>
            <th>
              Email
            </th>
            <th>
              Creation time
            </th>
            <th>
              Admin access
            </th>
            <th>
              Edit
            </th>
            <th>
              Delete
            </th>
          </tr>
        </thead>
        <tbody id="tbody">
        </tbody>
      </table>
      `;

let table_string2 = `<table id="user_table" class="pure-table" hidden>
      <thead>
        <tr>
          <th>
            UID
          </th>
          <th>
            Email
          </th>
          <th>
            Creation Time
          </th>
          <th>
            User Access Control
          </th>
          <th>
            Edit User Info
          </th>
          <th>
            Delete User
          </th>
        </tr>
      </thead>
      <tbody id="tbody2">
      </tbody>
      </table>
      <hr></hr>
`
user_page_el.innerHTML = table_string;
user_page_el.insertAdjacentHTML('beforeend',table_string2);

let add_btn = document.createElement('button');
add_btn.innerText = "Add User"
add_btn.id="addUser"
add_btn.addEventListener('click',e=>{
  createAccountPopup.open=true;
  blockDiv_el.hidden = false 
})
document.getElementById('tbody').insertAdjacentElement('afterend',add_btn);

let add_btn2 = document.createElement('button');
add_btn2.innerText = "Add User"
add_btn2.id="addUser"
add_btn2.addEventListener('click',e=>{
  createAccountPopup.open=true;
  blockDiv_el.hidden = false 


})
document.getElementById('tbody2').insertAdjacentElement('afterend',add_btn2);
/*************************************************
 * User management page functions
 *************************************************/

function showAdminList() {
  getAllAdmin(currUID).then(adminList => {
    let tr_string = "";
    adminList.forEach(admin => {
      let admin_li = `
      <tr>
        <td>
          ${admin.uid}
        </td>
        <td>
          ${admin.email}
        </td>
        <td>
          ${admin.metadata.creationTime}
        </td>
        <td>
          <input type="checkbox" checked>
        </td>
        <td>
          <button type="button" class="admin_edit_btn pure-button"> <i class="fas fa-feather"></i>Edit</button>
        </td>
        <td>
          <button type="button" class="admin_delete_btn pure-button"> <i class="fas fa-user-minus"></i>Delete</button>
        </td> 
      </tr>
      `;
      tr_string += admin_li;
    });

    document.getElementById('tbody').insertAdjacentHTML('afterbegin',tr_string);
   
    document.getElementById('admin_table').hidden=false;
    user_page_el.hidden = false;
  });
}

//eventlistenr for the admin table
document.querySelector("#admin_table").addEventListener("click", e => {
  let target = e.target;
  target.checked = !target.checked;

  // deal with toggle checkbox
  if (target.tagName === "INPUT") {
    admin_access_popup_el.open = true;
    blockDiv_el.hidden = false 
    let currCheckbox = target.checked;

    confirm_btn_el.addEventListener("click", e => {
      // if confirmed, 1) toggle checkbox
      // 2) get UID of the toggled user
      // 3) call endpoint
      // 4) make dialog disappear

      //1)
      target.checked = !currCheckbox;

      //2)
      let otherUID = target.parentElement.parentElement.firstElementChild.textContent.trim();
      //3)
      modifyAdminAccess(currUID, otherUID, target.checked);

      //4)
      admin_access_popup_el.open = false;
      blockDiv_el.hidden = true; 
    });

    cancel_btn_el.addEventListener("click", e => {
      // if cancel button is clicked, make dialog disappear
      admin_access_popup_el.open = false;
      blockDiv_el.hidden = true; 
    });

    // if edit button is clicked, open popup
  } else if (target.className.split(" ")[0] === 'admin_edit_btn') {

    // copy email value from the table
    ea_email_el.value = target.parentElement.parentElement.firstElementChild.nextElementSibling.textContent.trim()
    editAccountPopup.open = true
    blockDiv_el.hidden = false

    ea_confirm_btn_el.addEventListener('click', e => {
      //1) get account info
      //2) get other uid
      //3) send to endpoint
      //4) update table
      //5) make dialog disappear 

      //1)
      let userEmail = ea_email_el.value
      let userPassword = ea_password_el.value
      //2)
      let otherUID = target.parentElement.parentElement.firstElementChild.textContent.trim();
      //3)
      editAccount(currUID, otherUID, { 'email': userEmail, 'password': userPassword })
      //4)
      target.parentElement.parentElement
        .firstElementChild.nextElementSibling.innerText = userEmail
      //5)
      editAccountPopup.open = false
      blockDiv_el.hidden = true
    })
    ea_cancel_btn_el.addEventListener('click', e => {
      editAccountPopup.open = false
      blockDiv_el.hidden = true
    })

  } else if (target.className.split(" ")[0] === 'admin_delete_btn') {
    deletePopup.open = true
    blockDiv_el.hidden = false
  
    d_confirm_btn_el.addEventListener('click', e => {
      // remove the list 
      let otherUID = target.parentElement.parentElement.firstElementChild.textContent.trim();
      target.parentElement.parentElement.remove()
      deleteAccount(currUID, otherUID)
      deletePopup.open = false
      blockDiv_el.hidden = true
    })

    d_cancel_btn_el.addEventListener('click', e => {
      deletePopup.open = false
      blockDiv_el.hidden = true
    })

  }
  
});

//confirm button for create account
document.getElementById('ca_confirm_btn').addEventListener('click',e=>{
  let email = document.getElementById('ca_email').value;
  let password = document.getElementById('ca_password').value;
  addAccount(currUID,email,password)
  .then((user)=>{

    let new_user_li = `
      <tr>
        <td>
          ${user.uid}
        </td>
        <td>
          ${user.email}
        </td>
        <td>
          ${user.creationTime}
        </td>
        <td>
          <input type="checkbox" unchecked>
        </td>
        <td>
          <button type="button" class="admin_edit_btn pure-button">  <i class="fas fa-feather"></i>Edit</button>
        </td>
        <td>
          <button type="button" class="admin_delete_btn pure-button"> <i class="fas fa-user-minus"></i>Delete</button>
        </td> 
      </tr>
      `;

      let new_user_li2 =  `
      <tr>
        <td>
          ${user.uid}
        </td>
        <td>
          ${user.email}
        </td>
        <td>
          ${user.creationTime}
        </td>
        <td>
          <button type="button" class="userAccessControl" data-otherUid="${user.uid}" data-graphAccess="[true,true,true]">Access Control</button>
        </td>
        <td>
          <button type="button" class="editUser">Edit User Info</button>
        </td>
        <td>
          <button type="button" class="deleteUser">Delete User</button>
        </td> 
      </tr>
      `;
      let adminTable = document.getElementById('admin_table');
      let userTable = document.getElementById('user_table');
      if(adminTable.hidden === false){
        document.getElementById('tbody').insertAdjacentHTML('beforeend',new_user_li);
      }
      else{
        document.getElementById('tbody2').insertAdjacentHTML('beforeend',new_user_li2);
      }
      createAccountPopup.open=false;
      blockDiv_el.hidden = true
    })
})

//cancel button for createaccount
document.getElementById('ca_cancel_btn').addEventListener('click',e=>{
  createAccountPopup.open=false;
  blockDiv_el.hidden = true
})

function showUserList() {
  getAllUser(currUID)
    .then(userList => {
      let tr_string2 = "";
      userList.forEach(user => {
        let accessArray;
        if (user.customClaims) {
          accessArray = user.customClaims.graphAccess;
        }
        else {
          accessArray = [true, true, true];
        }
        let user_li = `
      <tr>
        <td>
          ${user.uid}
        </td>
        <td>
          ${user.email}
        </td>
        <td>
          ${user.metadata.creationTime}
        </td>
        <td>
          <button type="button" class="userAccessControl" data-otherUid="${user.uid}" data-graphAccess="${JSON.stringify(accessArray)}">Access Control</button>
        </td>
        <td>
          <button type="button" class="editUser">Edit User Info</button>
        </td>
        <td>
          <button type="button" class="deleteUser">Delete User</button>
        </td> 
      </tr>
      `;
        tr_string2 += user_li;
      });
      document.getElementById('tbody2').insertAdjacentHTML('afterbegin',tr_string2);
      document.getElementById('user_table').hidden=false;
      user_page_el.hidden = false;
    })
    .catch(e => console.log(e));
};

//eventlistener for the user table
document.getElementById("user_table").addEventListener("click", (e) => {
if (e.target) {
  let target = e.target
  let otherUID = e.target.getAttribute('data-otherUid');
  let dataGraphAccess = e.target.getAttribute('data-graphAccess');
  if (e.target.className === "userAccessControl") {
    browserAccess.checked = (dataGraphAccess[0] === 'true');
    engagementAccess.checked = (dataGraphAccess[1] === 'true');
    speedAccess.checked = (dataGraphAccess[2] === 'true');
    userGraphAccessPopup.open = true;
    blockDiv_el.hidden = false; 

    uga_confirm_btn.addEventListener('click', e => {
      let data = [];
      data[0] = browserAccess.checked
      data[1] = engagementAccess.checked
      data[2] = speedAccess.checked
      console.log('Data is ', data)
      modifyGraphAccess(currUID, otherUID, data);
      userGraphAccessPopup.open = false;
      blockDiv_el.hidden = true; 

    })
    uga_cancel_btn.addEventListener('click', e => {
      userGraphAccessPopup.open = false;
      blockDiv_el.hidden = true; 
    })
  }
  else if (e.target.className.split(" ")[0] === "editUser") {
    // copy email value from the table
    ea_email_el.value = target.parentElement.parentElement.firstElementChild.nextElementSibling.textContent.trim()
    editAccountPopup.open = true
    blockDiv_el.hidden = false; 

    ea_confirm_btn_el.addEventListener('click', e => {
      //1) get account info
      //2) get other uid
      //3) send to endpoint
      //4) update table
      //5) make dialog disappear 

      //1)
      let userEmail = ea_email_el.value
      let userPassword = ea_password_el.value
      //2)
      let otherUID = target.parentElement.parentElement.firstElementChild.textContent.trim();
      //3)
      editAccount(currUID, otherUID, { 'email': userEmail, 'password': userPassword })
      //4)
      target.parentElement.parentElement
        .firstElementChild.nextElementSibling.innerText = userEmail
      //5)
      editAccountPopup.open = false
      blockDiv_el.hidden = true; 
    })

    ea_cancel_btn_el.addEventListener('click', e => {
      editAccountPopup.open = false
      blockDiv_el.hidden = true; 
    })

  } else if (e.target.className.split(" ")[0] === "deleteUser") {
    deletePopup.open = true
    blockDiv_el.hidden = false; 


    d_confirm_btn_el.addEventListener('click', e => {
      // remove the list 

      let otherUID = target.parentElement.parentElement.firstElementChild.textContent.trim();
      target.parentElement.parentElement.remove()
      deleteAccount(currUID, otherUID)
      deletePopup.open = false
      blockDiv_el.hidden = true; 
    })

    d_cancel_btn_el.addEventListener('click', e => {
      deletePopup.open = false
      blockDiv_el.hidden = true; 
    })
  }
}
});




/************************************************
 *            Endpoint interaction function
 ***********************************************/
/***
 * This is a versatile function that takes care of creation of a user account
 * @param {String} currUID owner of the request
 * @param {String} newEmail email of the new account
 * @param {*} newPwd password of the new account
 */
function addAccount(currUID, newEmail, newPwd) {
  return new Promise((resolve, reject) => {
    let data = {
      currUID: currUID,
      accountInfo: { email: newEmail, password: newPwd }
    };
    let endPointUrl =
      "https://us-central1-acewebtool.cloudfunctions.net/addAccount";

    fetch(endPointUrl, sendbody("POST", data))
      .then(r => r.json())
      .then(data => {
        console.log(data);
        resolve(data);
      })
      .catch(e => console.error(e));
  });
}

// modify account
/**
 * Generic function that send request to editAccount
 * @param {string} currUID UID of the owner or admin
 * @param {string} otherUID UID of the account to be modified
 * @param {object} modifiedAccount a JSON that stores all the account info to be modified.
 */
function editAccount(currUID, otherUID, modifiedAccount) {
  let data = {
    currUID: currUID,
    otherUID: otherUID,
    modifiedAccount: modifiedAccount
  };
  let endURL =
    "https://us-central1-acewebtool.cloudfunctions.net/editAccount";

  fetch(endURL, sendbody("POST", data))
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(e => console.log(e));
}

/**
 *
 * @param {string} ownerUID UID of the owner
 * @param {string} adminUID UID of the admin account whose access are to be modified
 * @param {boolean} modifyFlag This is a flag that specify whether grant or retract access. true means grant this account admin access, false means retract this account admin access
 */
function modifyAdminAccess(ownerUID, adminUID, modifyFlag) {
  let data = { currUID: ownerUID, adminUID: adminUID, modifyFlag: modifyFlag };
  let endURL =
    "https://us-central1-acewebtool.cloudfunctions.net/modifyAdminAccess";

  fetch(endURL, sendbody("POST", data))
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(e => console.log(e));
}

function deleteAccount(currUID, otherUID) {
  return new Promise((resolve, reject) => {
    let data = { currUID: currUID, otherUID: otherUID };
    let endPointUrl =
      "https://us-central1-acewebtool.cloudfunctions.net/deleteAccount";

    fetch(endPointUrl, sendbody("POST", data))
      .then(r => r.text())
      .then(text => console.log(text))
      .catch(e => console.error(e));
  });
}

/**
 * Get all the admin information
 * @param {string} currUID Get all the admin info
 * @returns {array} list of admin user info
 */
function getAllAdmin(currUID) {
  return new Promise((resolve, reject) => {
    let data = { currUID: currUID };
    let endPointUrl =
      "https://us-central1-acewebtool.cloudfunctions.net/getAllAdmin";

    fetch(endPointUrl, sendbody("POST", data))
      .then(r => {
        return r.json();
      })
      .then(data => {
        console.log(data);
        resolve(data);
        return null;
      })
      .catch(e => reject(e.message));
  });
}

/**
 * Get all the user information
 * @param {string} currUID Get all the admin info
 * @returns {array} list of normal user info
 */
function getAllUser(currUID) {
  return new Promise((resolve, reject) => {
    let data = { currUID: currUID };
    let endPointUrl =
      "https://us-central1-acewebtool.cloudfunctions.net/getAllUser";

    fetch(endPointUrl, sendbody("POST", data))
      .then(r => {
        return r.json();
      })
      .then(data => {
        console.log(data);
        resolve(data);
        return null;
      })
      .catch(e => reject(e.message));
  });
}

function modifyGraphAccess(currUID, otherUID, graphAccess) {
  let data = { currUID: currUID, otherUID: otherUID, graphAccess: graphAccess };
  let endURL =
    "https://us-central1-acewebtool.cloudfunctions.net/modifyGraphAccess";

  fetch(endURL, sendbody("POST", data))
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(e => console.log(e));
}
/**
 * This function get graph data that is allowed to be accessed by currUID.
 * @param {string} currUID the current user's uid
 */
function getData(currUID) {
  return new Promise((resolve, reject) => {
    // fetch the data from getData endpoint
    let endPointUrl =
      "https://us-central1-acewebtool.cloudfunctions.net/getData?currUID=" +
      currUID;
    fetch(endPointUrl)
      .then(response => {
        return response.json();
      })
      .then(data => {
        console.log(data);
        resolve(data);
      })
      .catch(e => reject(e));
  });
}

function setOwner(currUID) {
  return new Promise((resolve, reject) => {
    let data = { uid: currUID };
    let endPointUrl =
      "https://us-central1-acewebtool.cloudfunctions.net/setOwner";

    fetch(endPointUrl, sendbody("POST", data))
      .then(r => {
        return r.json();
      })
      .then(data => {
        console.log(data);
        resolve(data);
        return null;
      })
      .catch(e => reject(e.message));
  });
}