let cookie;
window.onload = function() {
  var requestOptions = {
    method: "GET",
    redirect: "follow",
    credentials: "include"
  };

  fetch(
    "https://us-central1-acewebtool.cloudfunctions.net/sessionize",
    requestOptions
  )
    .then(response => response.text())
    .then(result => {cookie = result;console.log(cookie);})
    .catch(error => console.log("error", error));
  let data = {};

  //static data
  let userAgent = navigator.userAgent;
  let userLang = navigator.language;
  let cookiesEn = navigator.cookieEnabled;
  let imageEn = true;
  let jsEn = true;
  let cssEn = true;
  let screenHeight = window.screen.height;
  let screenWidth = window.screen.width;
  let windowHeight = window.innerHeight;
  let windowWidth = window.innerWidth;

  let sUsrAg = this.navigator.userAgent;
  let a;
  //add browser data to the database
  if (sUsrAg.indexOf("Firefox") > -1) {
    a = "firefox";
    // "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:61.0) Gecko/20100101 Firefox/61.0"
  } else if(sUsrAg.indexOf("Opera") > -1 || sUsrAg.indexOf("OPR") > -1) {
    a = "opera";
  } else if((sUsrAg.indexOf("MSIE") > -1)||userAgent.indexOf("rv:") > -1){
    a = "ie";
  } else if((sUsrAg.indexOf("Chrome") > -1)){
    a = "chrome"
  } else if(sUsrAg.indexOf("Safari") > -1){
    a ="safari";
  }else {a = "unknown"};

  data.browser = a;

  //image enabled
  let image = document.createElement("img");
  image.src = "pictures/imageTest.png";
  let insertHere = document.getElementsByTagName("body")[0];
  insertHere.appendChild(image);
  if (image.complete == false) {
    imageEn = false;
  }

  //css enabled
  if (CSS.supports("color:red") === false) {
    cssEn = false;
  }

  //static obj
  let static = {
    userAgent: userAgent,
    userLang: userLang,
    cookiesEn: cookiesEn,
    imageEn: imageEn,
    jsOn: jsEn,
    cssOn: cssEn,
    screenHeight: screenHeight,
    screenWidth: screenWidth,
    windowHeight: windowHeight,
    windowWidth: windowWidth,
  };
  data.static = static;

  //performance data
  //let performance = window.performance.timing;
  // set data base entry
  let loadingInfo = window.performance.timing;
  let loadTime =
    (loadingInfo.domContentLoadedEventEnd - loadingInfo.navigationStart) / 1000;
  data.performance = { loadTime: loadTime };
  console.log(data);

  //dynamic data
  //start the timers
  let eventArray = [];
  let timer = new Date();
  let startTimeClick = timer.getTime();
  let startTimeMousemove = timer.getTime();
  let startTimeKeystroke = timer.getTime();
  let startTimeScroll = timer.getTime();
  let startTimeUnload = timer.getTime();
  let diff;

  //function for idle time
  function pushIdle(startTime) {
    let timer = new Date();
    let endTime = timer.getTime;
    diff = endTime - startTimeClick;
    if (diff > 2) {
      let idle = {};
      idle.entry = "idle";
      idle.type = "idle";
      idle.duration = diff;
      eventArray.push(idle);
      data.eventArray = eventArray;
      startTime = endTime;
    }
  }
  clickcount = 0;
  window.addEventListener("click", function(e) {
    /*pushIdle(startTimeClick);
    let click = selectKV(
      [
        "type",
        "screenX",
        "screenY",
        "clientX",
        "clientY",
        "offsetX",
        "offsetY",
        "offsetX",
        "offsetY",
        "pageX",
        "pageY",
        "timeStamp"
      ],
      e
    );
    eventArray.push(click);*/
    clickcount += 1;
  });

  window.addEventListener("mousemove", function(e) {
    pushIdle(startTimeMousemove);
    let move = selectKV(
      [
        "type",
        "screenX",
        "screenY",
        "clientX",
        "clientY",
        "offsetX",
        "offsetY",
        "offsetX",
        "offsetY",
        "pageX",
        "pageY",
        "timeStamp"
      ],
      e
    );
    eventArray.push(move);
    data.eventArray = eventArray;
  });

  window.addEventListener("keydown", function(e) {
    pushIdle(startTimeKeystroke);
    let key = selectKV(["type", "keyCode", "timeStamp"], e);
    eventArray.push(key);
    data.eventArray = eventArray;
  });

  window.addEventListener("scroll", function(e) {
    pushIdle(startTimeKeystroke);
    let scroll = selectKV(["type", "timeStamp"], e);
    eventArray.push(scroll);
    data.eventArray = eventArray;
  });

  window.addEventListener("beforeunload", function(e) {
    pushIdle(startTimeUnload);

    e.preventDefault();
    e.returnValue = "unload";
    let unload = selectKV(
      ["type", "eventPhase", "preventDefault", "timeStamp"],
      e
    );
    eventArray.push(unload);
    data.eventArray = eventArray;
    let entry = {};
    let x = document.URL + new Date();
    entry[x] = data;
    //get the time before unload
    let visitlength = (new Date()).getTime() - loadingInfo.domContentLoadedEventEnd;
    let engagement = {};
    engagement.cookie = cookie;
    engagement.clickcount = clickcount;
    engagement.visitlength = visitlength;
    data.engagement = engagement;
    this.console.log(data);
    navigator.sendBeacon(
      "https://us-central1-acewebtool.cloudfunctions.net/collector",
      JSON.stringify(data)
    );
  });

  /******************************
   *   Helper functions
   *****************************/

  /**
   * Select Key-value pairs from an event
   * @param key_list - an array of keys that specify what key value pair to choose from event obj
   * @param e - the event from which key_list are selected
   * @return a JSON object that contain all the information selected
   */
  function selectKV(key_list, e) {
    let output = {};
    for (let k of key_list) {
      output[k] = e[k];
    }
    return output;
  }
};
