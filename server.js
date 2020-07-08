const express = require('express')
const exphbs = require('express-handlebars');
const session = require('express-session');
const path = require('path');
var MongoClient = require('mongodb').MongoClient;
var bodyParser = require("body-parser");
var ObjectID = require('mongodb').ObjectID;

var url = "mongodb://localhost:27017/migrants";

const app = express();

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: true})); 
app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));
app.use(express.static(path.join(__dirname, '/public')));

const PORT = process.env.PORT || 5000;
var sess;
var wsess;

app.get('/', (req, res) => {
    res.sendFile('index.html', {
        root: path.join(__dirname, './')
    })
})


app.get('/center/login', (req, res) => {
    sess=req.session;
    if(sess.emp_id)
    {
        res.redirect('/center/home');
    }
    else
    {
        res.render('center_login');
    }
});
app.post('/center/login', (req, res) => {
    sess=req.session;
    var center_id = req.body.center_id;
    var center_pwd = req.body.center_pwd;
    MongoClient.connect(url, (err, db) => {
        if(err) throw err;
        var dbo = db.db("migrants");
        var query = {center_id: center_id};
        dbo.collection("center").find(query).toArray((err, result) => {
            if(result.length<1)
            {
                console.log("Wrong center_id!");
                res.render('center_login');
            }
            else if(result[0].center_pwd != center_pwd)
            {
                console.log("Wrong Pwd!");
                res.render('center_login');
            }
            else if(result[0].center_pwd == center_pwd)
            {
                sess.center_id=center_id;
                sess.center_name=result[0].center_name;
                res.redirect('/center/home');
            }
        });
    });
});

app.get('/center/forgotpwd', (req, res) => {
    sess=req.session;
    if(sess.center_id)
    {
        res.redirect('/center/home');
    }
    else
    {
        res.render('center_forgotpwd');
    }
});
app.post('/center/forgotpwd', (req, res) => {
    var center_id = req.body.center_id;
    var center_aadhaar = req.body.center_aadhaar;
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db("migrants");
        var query = {center_id: center_id};
        dbo.collection("center").find(query).toArray((err, result) => {
            if(result.length<1)
            {
                console.log("Wrong center_id!");
                res.render('center_forgotpwd');
            }
            else if(result[0].center_id!=center_id || result[0].center_aadhaar!=center_aadhaar)
            {
                console.log("Wrong Details!");
                res.render('center_forgotpwd');
            }
            else if(result[0].center_id==center_id && result[0].center_aadhaar == center_aadhaar)
            {
                res.send(result[0].center_pwd);
            }
        })
    })
})


app.get('/center/signup', (req, res) => {
    sess=req.session;
    if(sess.emp_id)
    {
        res.redirect('/center/home');
    }
    else
    {
        res.render('center_signup');
    }
});
app.post('/center/signup', (req, res, next) => {
    var temp = {
        center_id: req.body.center_id,
        center_name: req.body.center_name,
        center_phone: req.body.center_phone,
        center_address: req.body.center_address,
        center_aadhaar: req.body.center_aadhaar,
        center_pwd: req.body.center_pwd,
        center_email: req.body.center_email,
        center_gender: req.body.center_gender
    };
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db("migrants");
        var query = {center_id:req.body.center_id};
        dbo.collection("center").find(query).toArray( (err, result) => {
            if(err) throw err;
            if(result.length == 0)
            {
                dbo.collection("center").insertOne(temp, (err,result2) => {
                    if(err) throw err;
                    console.log("1 center inserted!");
                    res.redirect('/center/login');
                });
            }
            else {
                console.log("center already exists!");
                res.redirect('/center/signup');
            }
        })
    });
});

app.get('/center/home', (req, res) => {
    sess=req.session;
    if(sess.center_id)
    {
        res.render('center_home');
    }
    else
    {
        res.render('center_login');
    }
});

app.get('/center/employer/signup', (req, res) => {
    sess=req.session;
    if(sess.center_id)
    {
        res.render('center_employer_signup');
    }
    else
    {
        res.redirect('/center/login');
    }
});
app.post('/center/employer/signup', (req, res, next) => {
    var temp = {
        emp_id: req.body.emp_id,
        emp_name: req.body.emp_name,
        emp_phone: req.body.emp_phone,
        emp_address: req.body.emp_address,
        emp_aadhaar: req.body.emp_aadhaar,
        emp_pwd: req.body.emp_pwd,
        emp_email: req.body.emp_email,
        emp_gender: req.body.emp_gender
    };
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db("migrants");
        var query = {emp_id:req.body.emp_id};
        dbo.collection("employers").find(query).toArray( (err, result) => {
            if(err) throw err;
            if(result.length == 0)
            {
                dbo.collection("employers").insertOne(temp, (err,result2) => {
                    if(err) throw err;
                    console.log("1 employer inserted!");
                    res.redirect('/center/employer/signup');
                });
            }
            else {
                console.log("Emp_id already exists!");
                res.redirect('/center/employer/signup');
            }
        })
    });
});

app.get('/center/worker/signup', (req, res) => {
    wsess = req.session;
    if(wsess.center_id)
    {
        res.render('center_worker_signup');
    }
    else
    {
        res.redirect('/center/login');
    }
});
app.post('/center/worker/signup', (req, res, next) => {
    var temp = {
        worker_id: req.body.worker_id,
        worker_name: req.body.worker_name,
        worker_phone: req.body.worker_phone,
        worker_altphone: req.body.worker_altphone,
        worker_aadhaar: req.body.worker_aadhaar,
        worker_pwd: req.body.worker_pwd,
        worker_age: req.body.worker_age,
        worker_gender: req.body.worker_gender
    };
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db("migrants");
        var query = {worker_id:req.body.worker_id};
        dbo.collection("workers").find(query).toArray( (err, result) => {
            if(err) throw err;
            if(result.length == 0)
            {
                dbo.collection("workers").insertOne(temp, (err,result2) => {
                    if(err) throw err;
                    console.log("1 worker inserted!");
                    res.jsonp({success : true})
                    res.redirect('/center/worker/signup');
                });
            }
            else {
                console.log("Worker_id already exists!");
                res.redirect('/center/worker/signup');
            }
        })
    });
});

app.get('/center/jobs_posted', (req, res) => {
    sess=req.session;
    if(sess.center_id)
    {
        var jobsposted;
        MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("migrants");
            dbo.collection("applications").find().toArray((err, result) => {
                if(result.length == 0)
                {
                    res.render('center_jobs_posted_null');
                }
                else
                {
                    jobsposted = result;
                    res.render('center_total_jobs_posted',{jobsposted1: jobsposted});
                }
                
            })
        })
    }
    else{
        res.redirect('/center/login');
    }
});

app.get('/center/worker_applied', (req, res) => {
    wsess = req.session;
    if(wsess.center_id)
    {
        var final;
        MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("migrants");
            var query = {confirm: "no"};
            dbo.collection("jobs").find(query).toArray((err, result) => {
                if(result.length == 0)
                {
                    res.render('center_workers_applied_null');
                }
                else
                {
                    final = result;
                    var l = result.length;

                    res.render('center_total_worker_applied',{final: final});
                }
                
            })
        })
    }
    else{
        res.redirect('/center/login');
        res.end();
    }
});

app.get('/center/worker_confirmed', (req, res) => {
    wsess = req.session;
    if(wsess.center_id)
    {
        var final;
        MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("migrants");
            var query = {confirm: "yes"};
            dbo.collection("jobs").find(query).toArray((err, result) => {
                if(result.length == 0)
                {
                    res.render('center_workers_confirmed_null');
                }
                else
                {
                    final = result;
                    var l = result.length;

                    res.render('center_total_worker_confirmed',{final: final});
                }
                
            })
        })
    }
    else{
        res.redirect('/center/login');
        res.end();
    }
});

app.get('/center/logout',(req,res) => {
    req.session.destroy((err) => {
        if(err) return console.log(err);
        res.redirect('/center/login');
    });
});


app.get('/employer/login', (req, res) => {
    sess=req.session;
    if(sess.emp_id)
    {
        res.redirect('/employer/jobs');
    }
    else
    {
        res.render('employer_login');
    }
});
app.post('/employer/login', (req, res) => {
    sess=req.session;
    var emp_id = req.body.emp_id;
    var emp_pwd = req.body.emp_pwd;
    MongoClient.connect(url, (err, db) => {
        if(err) throw err;
        var dbo = db.db("migrants");
        var query = {emp_id: emp_id};
        dbo.collection("employers").find(query).toArray((err, result) => {
            if(result.length<1)
            {
                console.log("Wrong emp_id!");
                res.render('employer_login');
            }
            else if(result[0].emp_pwd != emp_pwd)
            {
                console.log("Wrong Pwd!");
                res.render('employer_login');
            }
            else if(result[0].emp_pwd == emp_pwd)
            {
                sess.emp_id=emp_id;
                sess.emp_name=result[0].emp_name;
                res.redirect('/employer/jobs');
            }
        });
    });
});

app.get('/employer/forgotpwd', (req, res) => {
    sess=req.session;
    if(sess.emp_id)
    {
        res.redirect('/employer/jobs');
    }
    else
    {
        res.render('employer_forgotpwd');
    }
});
app.post('/employer/forgotpwd', (req, res) => {
    var emp_id = req.body.emp_id;
    var emp_aadhaar = req.body.emp_aadhaar;
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db("migrants");
        var query = {emp_id: emp_id};
        dbo.collection("employers").find(query).toArray((err, result) => {
            if(result.length<1)
            {
                console.log("Wrong emp_id!");
                res.render('employer_forgotpwd');
            }
            else if(result[0].emp_id!=emp_id || result[0].emp_aadhaar!=emp_aadhaar)
            {
                console.log("Wrong Details!");
                res.render('employer_forgotpwd');
            }
            else if(result[0].emp_id==emp_id && result[0].emp_aadhaar == emp_aadhaar)
            {
                res.send(result[0].emp_pwd);
            }
        })
    })
})


app.get('/employer/signup', (req, res) => {
    sess=req.session;
    if(sess.emp_id)
    {
        res.redirect('/employer/jobs');
    }
    else
    {
        res.render('employer_signup');
    }
});
app.post('/employer/signup', (req, res, next) => {
    var temp = {
        emp_id: req.body.emp_id,
        emp_name: req.body.emp_name,
        emp_phone: req.body.emp_phone,
        emp_address: req.body.emp_address,
        emp_aadhaar: req.body.emp_aadhaar,
        emp_pwd: req.body.emp_pwd,
        emp_email: req.body.emp_email,
        emp_gender: req.body.emp_gender
    };
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db("migrants");
        var query = {emp_id:req.body.emp_id};
        dbo.collection("employers").find(query).toArray( (err, result) => {
            if(err) throw err;
            if(result.length == 0)
            {
                dbo.collection("employers").insertOne(temp, (err,result2) => {
                    if(err) throw err;
                    console.log("1 employer inserted!");
                    res.redirect('/employer/login');
                });
            }
            else {
                console.log("Emp_id already exists!");
                res.redirect('/employer/signup');
            }
        })
    });
});

app.get('/employer/jobs', (req, res) => {
    sess=req.session;
    if(sess.emp_id)
    {
        var jobsposted;
        MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("migrants");
            var query = {emp_id: sess.emp_id};
            dbo.collection("applications").find(query).toArray((err, result) => {
                if(result.length == 0)
                {
                    res.render('employer_jobs_null', {emp_id: sess.emp_id});
                }
                else
                {
                    jobsposted = result;
                    res.render('employer_jobs',{emp_id: sess.emp_id, jobsposted1: jobsposted});
                }
            })
        })
    }
    else{
        res.redirect('/employer/login');
    }
});

app.get('/employer/addjob', (req, res)=> {
    sess=req.session;
    if(sess.emp_id)
    {
        res.render('employer_addjob.handlebars');   
    }
    else{
        res.redirect('/employer/login');
        res.end();
    }
})
app.post('/employer/addjob', (req, res) => {
    var temp = {
        emp_id: sess.emp_id,
        emp_name: req.body.emp_name,
        duration: {
            days: req.body.days,
            months: req.body.months
        },
        wage: req.body.wage,
        location: req.body.location,
        type_work: req.body.type_work
    };
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db("migrants");
        dbo.collection("applications").insertOne(temp, (err,result) => {
            if(err) throw err;
            console.log("1 job posted !");
            db.close();
            res.redirect('/employer/jobs');
        });
    });
})

app.get('/employer/requests', (req, res) => {
    sess=req.session;
    if(sess.emp_id)
    {
        var requests;
        MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("migrants");
            var query = {emp_id: sess.emp_id, confirm: "no"};
            dbo.collection("jobs").find(query).toArray((err, result) => {
                if(result.length == 0)
                {
                    res.render('employer_requests_null',{emp_id: sess.emp_id});
                }
                else
                {
                    requests = result;
                    res.render('employer_requests',{emp_id: sess.emp_id, requests: requests});
                }
            })
        })
    }
    else{
        res.redirect('/employer/login');
        res.end();
    }
    
})

app.post('/employer/confirm_request', (req, res) => {
    var jobs_id1 = req.body.jobs_id;
    MongoClient.connect(url, (err, db) => {
        if(err) throw err;
        var dbo = db.db("migrants");
        var query = {_id: new ObjectID(jobs_id1)};
        console.log(jobs_id1);
        var addvalues = { $set: {confirm:"yes"} };
        dbo.collection("jobs").updateOne(query, addvalues, (err, result) => {
            if(err) throw err;
            db.close();
            res.redirect('/employer/confirmed');
        })
    })
});

app.get('/employer/confirmed', (req, res) => {
    sess=req.session;
    if(sess.emp_id)
    {
        var final;
        MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("migrants");
            var query = {emp_id: sess.emp_id, confirm:"yes"};
            dbo.collection("jobs").find(query).toArray((err, result) => {
                if(result.length == 0)
                {
                    res.render('employer_final_null',{emp_id: sess.emp_id});
                }
                else
                {
                    final = result;
                    res.render('employer_final',{emp_id: sess.emp_id, final: final});
                }
            })
        })
    }
    else{
        res.redirect('/employer/login');
        res.end();
    }
})



app.get('/employer/logout',(req,res) => {
    req.session.destroy((err) => {
        if(err) return console.log(err);
        res.redirect('/employer/login');
    });
});

//////////////////////////////Worker-Routes///////////////////////////////////////////////////

app.get('/worker/login', (req, res) => {
    wsess = req.session;
    if(wsess.worker_id)
    {
        res.redirect('/worker/jobs');
    }
    else
    {
        res.render('worker_login');
    }
});
app.post('/worker/login', (req, res) => {
    wsess = req.session;
    var worker_id = req.body.worker_id;
    var worker_pwd = req.body.worker_pwd;
    MongoClient.connect(url, (err, db) => {
        if(err) throw err;
        var dbo = db.db("migrants");
        var query = {worker_id: worker_id};
        dbo.collection("workers").find(query).toArray((err, result) => {
            if(result.length<1)
            {
                console.log("Wrong workerid!");
                res.render('worker_login');
            }
            else if(result[0].worker_pwd != worker_pwd)
            {
                console.log("Wrong Pwd!");
                res.render('worker_login');
            }
            else if(result[0].worker_pwd == worker_pwd)
            {
                wsess.worker_id = worker_id;
                wsess.worker_name = result[0].worker_name;
                res.redirect('/worker/jobs');
            }
        });
    });
});

app.get('/worker/forgotpwd', (req, res) => {
    wsess = req.session;
    if(wsess.worker_id)
    {
        res.redirect('/worker/jobs');
    }
    else
    {
        res.render('worker_forgotpwd');
    }
});
app.post('/worker/forgotpwd', (req, res) => {
    var worker_id = req.body.worker_id;
    var worker_aadhaar = req.body.worker_aadhaar;
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db("migrants");
        var query = {worker_id: worker_id};
        dbo.collection("workers").find(query).toArray((err, result) => {
            if(result.length<1)
            {
                console.log("Wrong workerid!");
                res.render('worker_forgotpwd');
            }
            else if(result[0].worker_id!=worker_id || result[0].worker_aadhaar!=worker_aadhaar)
            {
                console.log("Wrong Details!");
                res.render('worker_forgotpwd');
            }
            else if(result[0].worker_id==worker_id && result[0].worker_aadhaar == worker_aadhaar)
            {
                res.send(result[0].worker_pwd);
            }
        })
    })
})


app.get('/worker/signup', (req, res) => {
    wsess = req.session;
    if(wsess.worker_id)
    {
        res.redirect('/worker/jobs');
    }
    else
    {
        res.render('worker_signup');
    }
});
app.post('/worker/signup', (req, res, next) => {
    var temp = {
        worker_id: req.body.worker_id,
        worker_name: req.body.worker_name,
        worker_phone: req.body.worker_phone,
        worker_altphone: req.body.worker_altphone,
        worker_aadhaar: req.body.worker_aadhaar,
        worker_pwd: req.body.worker_pwd,
        worker_age: req.body.worker_age,
        worker_gender: req.body.worker_gender
    };
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db("migrants");
        var query = {worker_id:req.body.worker_id};
        dbo.collection("workers").find(query).toArray( (err, result) => {
            if(err) throw err;
            if(result.length == 0)
            {
                dbo.collection("workers").insertOne(temp, (err,result2) => {
                    if(err) throw err;
                    console.log("1 worker inserted!");
                    res.redirect('/worker/login');
                });
            }
            else {
                console.log("Worker_id already exists!");
                res.redirect('/worker/signup');
            }
        })
    });
});

app.get('/worker/jobs', (req, res) => {
    wsess = req.session;
    if(wsess.worker_id)
    {
        var jobsposted;
        MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("migrants");
            //var query = {workerid: wsess.workerid};
            var query = {};
            dbo.collection("applications").find(query).toArray((err, result) => {
                jobsposted = result;
                var l = result.length;
                if(l>=1)
                {
                    dbo.collection("jobs").find({worker_id: wsess.worker_id}).toArray((err, result1) =>{
                        var l1 = result1.length;
                        var arr = [];
                        if(l1==0)
                        {
                            console.log("herel1==0");
                            res.render('worker_jobs', {worker: wsess.worker_id, workername: wsess.worker_name, jobsposted: jobsposted});
                        }
                        else
                        {
                            console.log("herel1!=0");
                            for(i=0; i<l; i++)
                            {
                                var k=0;
                                for(j=0; j<l1; j++)
                                {
                                    if(result[i]._id==result1[j].job_id)
                                    {
                                        k = 1;
                                        break;
                                    }
                                }
                                if(k==0)
                                {
                                    //jobsposted.splice(i, 1);
                                    arr.push(jobsposted[i]);
                                }
                            }
                        }
                        if(arr.length>0 && l1!=0)
                        {
                            console.log("here job>0");
                            console.log(arr);
                            res.render('worker_jobs', {worker: wsess.worker_id, workername: wsess.worker_name, jobsposted: arr});
                        }
                        else if(arr.length==0 && l1!=0)
                        {
                            console.log("here job==0");
                            res.render('worker_no_jobs', {worker: wsess.worker_id, workername: wsess.worker_name});
                        }
                    })
                }
                else
                {
                    res.render('worker_no_jobs', {worker: wsess.worker_id, workername: wsess.worker_name});
                }
            })
        })
    }
    else{
        res.redirect('/worker/login');
    }
});

app.post('/worker/send_request', (req, res) => {
    var worker_id = wsess.worker_id;
    var jobs_id = req.body.jobs_id;
    var emp_id = req.body.emp_id;
    var entry = {
        job_id: jobs_id,
        emp_id: emp_id,
        emp_name: "--",
        worker_id: wsess.worker_id,
        worker_name: "--",
        duration: {days:0,months:0},
        wage: 0,
        location: "--",
        status: "project",
        worker_gender: "other",
        worker_phone: 111,
        worker_altphone: 111,
        type_work: "--",
        confirm: "no"
    };
    //inserting worker details
    MongoClient.connect(url, (err, db) => {
        if(err) throw err;
        var dbo = db.db("migrants");
        dbo.collection("workers").find({worker_id: worker_id}).toArray((err, result) => {
            if(err) throw err;
            var w = result[0];
            entry.worker_name = w.worker_name;
            entry.worker_gender = w.worker_gender;
            entry.worker_phone = w.worker_phone;
            entry.worker_altphone = w.worker_altphone;
            entry.worker_age = w.worker_age;
            var db1 = db.db("migrants");
            var query = {emp_id: emp_id, _id: new ObjectID(jobs_id)};
            db1.collection("applications").find(query).toArray((err, result1) => {
                if(err) throw err;
                var e = result1[0];
                entry.emp_name = e.emp_name;
                entry.duration = e.duration;
                entry.wage = e.wage;
                entry.location = e.location;
                entry.type_work = e.type_work;
                var db2 = db.db("migrants");
                db2.collection("jobs").insertOne(entry, (err,result) => {
                    if(err) throw err;
                    console.log("1 job posted in job table!");
                    console.log(entry);
                    res.redirect('/worker/applied');
                });
            })
        })
    })
});

app.get('/worker/applied', (req, res) => {
    wsess = req.session;
    if(wsess.worker_id)
    {
        var final;
        MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("migrants");
            var query = {worker_id: wsess.worker_id, confirm: "no"};
            dbo.collection("jobs").find(query).toArray((err, result) => {
                final = result;
                var l = result.length;
                if(l>=1)
                {
                    res.render('worker_applied',{worker: wsess.worker_id, workername: wsess.worker_name, final: final});
                }
                else
                {
                    res.render('worker_no_applied',{worker: wsess.worker_id, workername: wsess.worker_name});
                }
            })
        })
    }
    else{
        res.redirect('/worker/login');
        res.end();
    }
});

app.get('/worker/confirmed', (req, res) => {
    wsess = req.session;
    if(wsess.worker_id)
    {
        var final;
        MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("migrants");
            var query = {worker_id: wsess.worker_id, confirm: "yes"};
            dbo.collection("jobs").find(query).toArray((err, result) => {
                final = result;
                var l = result.length;
                if(l>=1)
                {
                    res.render('worker_confirmed',{worker: wsess.worker_id, workername: wsess.worker_name, final: final});
                }
                else
                {
                    res.render('worker_no_confirmed',{worker: wsess.worker_id, workername: wsess.worker_name});
                }
            })
        })
    }
    else{
        res.redirect('/worker/login');
        res.end();
    }
});

app.get('/worker/logout',(req,res) => {
    req.session.destroy((err) => {
        if(err) return console.log(err);
        res.redirect('/worker/login');
    });
});

///////server at port 5000
app.listen(PORT, () => console.log(`Server started on port: ${PORT}`));
