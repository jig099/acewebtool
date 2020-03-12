Jiaxin Ge
A13409166
URL: https://final-2f63b.firebaseapp.com/analytics.html
Login username: 135grader@ucsd.edu
password:135grader


- Brief overview of your authentication code
- Login endpoint: https://us-central1-final-2f63b.cloudfunctions.net/login
            This endpoint is used to login user. When this endpoint is called with username and password in req body, it will triger firestore's authentication process to login the user.
            
            POC: 
            1. call endpoint: 
                login.addEventListener("click", e => {
                const user = {};
                user.emailVal = email.value;
                user.pwdVal = password.value;

                fetch(
                    "https://us-central1-final-2f63b.cloudfunctions.net/login",
                    sendbody("POST", user)
                )
                    .then(function(response) {
                    if (response.ok) {
                        console.log("login success, redirecting...");
                        window.user_info = user;
                        showAnalytic();
                    } else {
                        console.error("The username or password is incorrect");
                    }
                    })
                    .catch(error => console.log("error", error));
                });

            2. endpoint triggers the firestore authtication
                exports.login = functions.https.onRequest((req, res) => {
                res.set("Access-Control-Allow-Origin", "https://final-2f63b.firebaseapp.com");
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
        - Logout endpoint: https://us-central1-final-2f63b.cloudfunctions.net/logout
            This endpoint is used to logout user. When this endpoint is called when user hits logout button, it will triger firestore's authentication process to logout the user. 

            POC:
            1. call endpoint
                const logout = document.getElementById("logout_btn");
                logout.addEventListener("click", e => {
                let login_page_el = document.querySelector("#login_page");
                let analysis_page_el = document.querySelector("#analysis_page");
                const user = window.user_info;
                fetch(
                    "https://us-central1-final-2f63b.cloudfunctions.net/signout",
                    sendbody("POST", user)
                )
                    .then(() => {
                    //needs to clear data
                    login_page_el.hidden = false;
                    analysis_page_el.hidden = true;
                    })
                    .catch(error => console.log("error", error));
                });
            2. endpoint triggers the firestore authtication
                exports.signout = functions.https.onRequest((req, res) => {
                res.set("Access-Control-Allow-Origin", "https://final-2f63b.firebaseapp.com");
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

- Diagram that shows how your PoC examples work together including their routes
    - The diagram is here https://ibb.co/YcK3RQQ.
    
    - POC for getting browser data and engagement data:

        exports.collector = functions.https.onRequest((req, res) => {
        res.set("Access-Control-Allow-Origin", "https://final-2f63b.firebaseapp.com");
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
            if (!referer.match("https://final-2f63b.firebaseapp.com")) {
            res.status(418).send("don't you try to hack me");
            return;
            }
            
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

- Discussion of the grid library
    - I used google charts to draw the grid. I used it because it is very convinient to use. It has very good documentation and provides a lot of different kinds of chart/plots. The followinbg poc shows how I used library to draw a grid. 
    
    - POC: 
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

- Discussion of the chart library 
   - I used google charts to draw the charts. I used it because it is very convinient to use. It has very good documentation and provides a lot of different kinds of chart/plots. The followinbg poc shows how I used library to draw two charts - piechart + histgram

   - POC: 
   1. for the piechart
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
        2. for the histgram
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
    

