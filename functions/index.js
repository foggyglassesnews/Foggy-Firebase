const functions = require('firebase-functions');
const admin = require('firebase-admin');
var FieldValue = require('firebase-admin').firestore.FieldValue;
admin.initializeApp();

const twilio = require('twilio');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
// const bodyParser = require('body-parser');

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
const accountSid = functions.config().twilio.sid;//firebaseConfig.twilio.sid;
const authToken  = functions.config().twilio.token;//firebaseConfig.twilio.token;
// functions.config().slack.url

const client = new twilio(accountSid, authToken);

const twilioNumber = '+15163094818' // your twilio phone number

const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('0f3b142e5ce646219307fec8dc57a601');

exports.scheduledRecommend = functions.pubsub.schedule('5 12 * * *').onRun((context) => {
    console.log("SCHEDULED");
    return;
    return newsapi.v2.topHeadlines({
        language: 'en',
        country: 'us',
        pageSize: 1,
    }).then(response => {
        try{
            if (response.articles.length > 0) {
                let article = parseToJSON(response.articles[0])
                let articleRef = admin.firestore().collection("articles").doc();
                return articleRef.set(article).then(function(ref){
                    return admin.database().ref("tks").once('value').then(function(users){
                        users.forEach(user => {
                            console.log("User", user.key, user.val());
                            var date = new Date();
                            let miliseconds = date.getTime() / 1000.0;
                            let newPost = {
                                senderId: "foggy-glasses",
                                timestamp: miliseconds,
                                groupId: "",
                                postUpdate: miliseconds,
                                articleId: articleRef.id,
                                curated: true
                            }
                            admin.database().ref('homeFeed/' + user.key).push().set(newPost).then(function(r){
                                console.log("Sent one to ", user.key)
                                return sendNotification(user.val(), "New Curated Article", "Foggy Glasses News curated a new Article for you!");
                            })
                        })
                    });
                }) 
            }
        }
        catch(err){
            console.log(err)
        }
    }).catch(error => { console.log(error)});
});

exports.testRecommend = functions.https.onCall((data, context) => {
    return;
    return newsapi.v2.topHeadlines({
        language: 'en',
        country: 'us',
        pageSize: 1,
    }).then(response => {
        try{
            if (response.articles.length > 0) {
                let article = parseToJSON(response.articles[0])
                let articleRef = admin.firestore().collection("articles").doc();

                return articleRef.set(article).then(function(ref){
                    return admin.firestore().collection("groups").get().then(function(allGroups){
                        var groups = [];
                        allGroups.forEach(g => {
                            groups.push(g.id);
                        });
                        
                        groups.forEach(group => {
                            return writeToGroupFeed(group, articleRef.id)
                        })
                        return admin.database().ref("tks").once('value').then(function(users){
                            users.forEach(user => {
                                admin.database().ref("userGroups").child(user.key).once('value').then(function(userGroups) {
                                    var groupData = {};
                                    userGroups.forEach(g => {
                                        groupData[g.key] = " ";
                                    });
                                    var date = new Date();
                                    let miliseconds = date.getTime() / 1000.0;
                                    var newPost = {
                                        articleId : articleRef.id,
                                        data : groupData,
                                        multiGroup: true,
                                        senderId : "zKTNvCYzLdT0zZKx5heS4zoYfsl2",
                                        timestamp : miliseconds,
                                        curated: true
                                    }
                                    admin.database().ref('homeFeed/' + user.key).push().set(newPost).then(function(r){
                                        console.log("Sent one to ", user.key)
                                        return sendNotification(user.val(), "New Curated Article", "Foggy Glasses News curated a new Article for you!");
                                    })
                                });
                                
                            })
                        });
                    });
                    
                });
            }
        }
        catch(err){
            console.log(err)
        }
    }).catch(error => { console.log(error)});
    return getTopArticle("hLHHYmw8gifpk7Z9kJKxrigpLvB3");
});

function writeToGroupFeed(feedId, articleId){
    var date = new Date();
    let miliseconds = date.getTime() / 1000.0;
    
    var data = {senderId: "zKTNvCYzLdT0zZKx5heS4zoYfsl2",
                timestamp: miliseconds,
                groupId: feedId,
                commentCount: 0,
                postUpdate: miliseconds,
                commentUpdate: miliseconds,
                articleId: articleId,
                curated: true}
    return admin.database().ref('feeds/' + feedId).push().set(data).then(function(r){
        
    });
}

// function sendMultiGroup() {
//     var data = {
//         articleId : "E3kdnnSCyrjXhdxgxCbf",
//         data = {
//           IPNcpF4DS1LRya0mI5r3 : "-LjBrCtyV3_rndLzSlWu",
//           UfWVKy6AZtStmFda5AuT : "-LjBrCu-O3BpIz8Oo2Y-",
//           rGyx2Mpo3WonlBrMXGaO : "-LjBrCu1L2JynFIwb-7y"
//         },
//         multiGroup:true,
//         senderId : "hLHHYmw8gifpk7Z9kJKxrigpLvB3",
//         timestamp : 1.562510155526249E9
//     }
// }

function getTopArticle(uid){
    return newsapi.v2.topHeadlines({
        language: 'en',
        country: 'us',
        pageSize: 1,
    }).then(response => {
        try{
            if (response.articles.length > 0) {
                let article = parseToJSON(response.articles[0])
                let articleRef = admin.firestore().collection("articles").doc();
                return articleRef.set(article).then(function(ref){
                    var date = new Date();
                    let miliseconds = date.getTime() / 1000.0;
                    // let newPost = {
                    //     senderId: "foggy-glasses",
                    //     timestamp: miliseconds,
                    //     groupId: "",
                    //     postUpdate: miliseconds,
                    //     articleId: articleRef.id,
                    //     curated: true
                    // }
                    var newPost = {
                        articleId : articleRef.id,
                        data : {
                          IPNcpF4DS1LRya0mI5r3 : "",
                          UfWVKy6AZtStmFda5AuT : "",
                          rGyx2Mpo3WonlBrMXGaO : ""
                        },
                        multiGroup: true,
                        senderId : "zKTNvCYzLdT0zZKx5heS4zoYfsl2",
                        timestamp : miliseconds,
                        curated: true
                    }
                    return admin.database().ref('homeFeed/' + uid).push().set(newPost).then(function(r){
                        return admin.database().ref("tks").child(uid).once("value").then(function(snapshot) {
                            const token = snapshot.val();
                            const title = "New Curated Article";
                            const body = "Foggy Glasses News recommended a new Article for you"
                            return sendNotification(token, title, body);
                        })
                    })
                })
            }
        }
        catch(err){
            console.log(err)
        }
    }).catch(error => { console.log(error)});
}

function sendNotification(token, title, body) {
    var message = {
        notification: {
            title: title,
            body: body,
          },
        token: token,
        "apns": {
            "payload": {
                "aps": {
                    "badge":1,
                    "sound": "default"
                }
            }
        },
    };
    
    return admin.messaging().send(message).then((response) => {
        console.log('Successfully sent message:', response);
    })
    .catch((error) => {
        console.log('Error sending message:', error, token);
    });
}

function parseToJSON (article){
    let parseArticle = article
    let newArticle = {
        title: parseArticle.title,
        description: parseArticle.description,
        url: parseArticle.url,
        canonicalUrl: getCanonUrl(parseArticle.url),
        imageUrlString: parseArticle.urlToImage,
        shareUserId: "foggy-glasses", //not sure what we want for userID         
    }
    return newArticle
}

function getCanonUrl (url){
    var parseUrl = url
    parseUrl = parseUrl.replace("http://", "");
    parseUrl = parseUrl.replace("https://","");
    parseUrl = parseUrl.replace("file://", "");
    parseUrl = parseUrl.replace("ftp://", "");
    let canonUrl = parseUrl.split("/");
    if (canonUrl.length > 0) {
       return canonUrl[0]
    }
    else{
        return ""
    }
}

exports.receievedText = functions.https.onRequest((req, res) => {
    // ...
    console.log("recieved text");
    
    const userNumber  = req.body.From;
    const messageText = req.body.Body;

    //Parses the UID out of body
    var regExp = /\(([^)]+)\)/;
    var matches = regExp.exec(messageText);
    const uid = matches[1];
    console.log(userNumber);
    console.log(uid);

    var db = admin.database();
    var userVerifyRef = db.ref("phoneVerified").child(uid);
    var phoneVerifyRef = db.ref("verifyPhone").child(userNumber);

    phoneVerifyRef.once("value",snapshot => {
        if (snapshot.exists()){
            console.log("User already exists");
            var takenNumberRef = db.ref("takenNumber").child(uid);
            takenNumberRef.set(userNumber);
            return res.end();
        } else {
            userVerifyRef.set(userNumber);
            phoneVerifyRef.set(uid);
            return res.end();
        }
    });
  });

exports.groupInvitationNotificationn = functions.database.ref('userPendingGroups/{userId}/{groupId}')
    .onCreate((snapshot, context) => {
    const topicId = "userPendingGroups-" + context.params.userId
    console.log(topicId);

    return admin.firestore().collection("groups").doc(context.params.groupId).get().then(function(doc) {
        var message = {
            notification: {
                title: 'New Group Invitation',
                body: 'You have been invited to join - ' + doc.data().name
              },
            topic: topicId,
            data: {
                groupId: context.params.groupId
            },
            "apns": {
                "payload": {
                    "aps": {
                        "badge":1,
                        "sound": "default"
                    }
                }
            },
          };
        
        return admin.messaging().send(message).then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
        })
        .catch((error) => {
          console.log('Error sending message:', error);
        });
    })
});

exports.sendArticleNotificationToGroupMembers = functions.database.ref('feeds/{feedId}/{postId}')
    .onCreate((snapshot, context) => {
    const feedId = context.params.feedId;
    const senderId = snapshot.val().senderId;
    const curated = snapshot.val().curated;
    if (curated) {
        console.log("Curated Article");
        return
    }
    console.log("Sender ID", senderId);
    return admin.firestore().collection("users").doc(senderId).get().then (function(doc) {
        return admin.firestore().collection("groups").doc(context.params.feedId).get().then (function(doc1) {
            return admin.database().ref("notifications").child("newArticle").child(feedId).once('value').then(notifications => {
                notifications.forEach(user =>{ 
                    if (user.key == senderId) {
                        console.log("Ignoring sender Id", user.key)
                        return;
                    } else {
                        var message = {
                            notification: {
                                title: 'New Article',
                                body: doc.data().firstName +' shared an Article to your group ' + doc1.data().name,
                              },
                            token: user.val(),
                            data: {
                                articleId: context.params.postId,
                                groupId: context.params.feedId
                            },
                            "apns": {
                                "payload": {
                                    "aps": {
                                        "badge":1,
                                        "sound": "default"
                                    }
                                }
                            },
                          };
                
                        return admin.messaging().send(message).then((response) => {
                            // Response is a message ID string.
                            console.log('Successfully sent message:', response);
                        })
                    }
                    
                });
                console.log(notifications.val());
                return;
            });
        });
    });
});

exports.newCommentNotification = functions.database.ref('Comments/{feedId}/{postId}/{commentId}')
    .onCreate((snapshot, context) => {
    const senderId = snapshot.val().uid
    console.log("SenderID", senderId);
    return admin.firestore().collection("users").doc(senderId).get().then (function(doc) {
        return admin.firestore().collection("groups").doc(context.params.feedId).get().then (function(doc1) {
            return admin.database().ref("notifications").child("newComment").child(context.params.feedId).once('value').then(notifications => {
                notifications.forEach(user =>{ 
                    if (user.key == senderId) {
                        console.log("Ignoring sender Id", user.key);
                        return;
                    } else {
                        var message = {
                            notification: {
                                title: 'New Comment',
                                body: doc.data().firstName +' posted a new comment on an Article in your group ' + doc1.data().name,
                              },
                            token: user.val(),
                            data: {
                                articleId: context.params.postId,
                                groupId: context.params.feedId
                            },
                            "apns": {
                                "payload": {
                                    "aps": {
                                        "badge":1,
                                        "sound": "default"
                                    }
                                }
                            },
                          };
                
                        return admin.messaging().send(message).then((response) => {
                            // Response is a message ID string.
                            console.log('Successfully sent message:', response);
                        })
                    }
                    
                });
                return;
            });
            // var message = {
            //     notification: {
            //         title: 'New Comment',
            //         body: doc.data().firstName +' posted a new comment on an Article in your group ' + doc1.data().name
            //       },
            //     topic: topicId,
            //     data: {
            //         articleId: context.params.postId,
            //         groupId: context.params.feedId
            //     }
            //   };
    
            // return admin.messaging().send(message).then((response) => {
            //     // Response is a message ID string.
            //     console.log('Successfully sent message:', response);
            // })
        })
        
        
    }).catch ((error) => {
        console.log('Error sending message:', error);
    });
});

exports.savedArticle = functions.database.ref('saved/{userId}/{savedPost}')
    .onCreate((snapshot, context) => {
    const topicId = "savedArticles-" + context.params.userId
    console.log(topicId);
    var message = {
        notification: {
            title: 'Successfully Saved Post'
          },
        topic: topicId,
        "apns": {
            "payload": {
                "aps": {
                    "badge":1,
                    "sound": "default"
                }
            }
        },
      };
    
    return admin.messaging().send(message).then((response) => {
    // Response is a message ID string.
    console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
});

exports.skipVerification = functions.https.onCall((data, context) => {
    const uid = context.auth.uid;
    var userNumber = "+1-skip-" + uid;

    var db = admin.database();
    var userVerifyRef = db.ref("phoneVerified").child(uid);
    var phoneVerifyRef = db.ref("verifyPhone").child(userNumber);
    return userVerifyRef.set(userNumber).then(function () {
        return phoneVerifyRef.set(uid)
    });
});

// Saves a message to the Firebase Realtime Database but sanitizes the text by removing swearwords.
exports.deleteUser = functions.https.onCall((data, context) => {
    const uid = context.auth.uid;
    const userGroups = data.userGroups;
    const userFriends = data.userFriends;
    const uname = data.uname;
    userGroups.forEach(group => {
        //Delete member from group
        return admin.firestore().collection("groups").doc(group).get()
            .then(function (userGroup) {
                //Remove Members
                return admin.firestore().collection("groups").doc(group).update({
                    members: admin.firestore.FieldValue.arrayRemove(uid)
                }).then(function(){
                    return admin.database().ref("notifications").child("newArticle").child(group).child(uid).remove().then(function(){
                        return admin.database().ref("notifications").child("newComment").child(group).child(uid).remove()
                    })
                })
            })
        // console.log(group);
        // //Remove Group from User Groups
        // return admin.database().ref("userGroups").child(uid).child(group).remove()
        // .then(function(removed){
        //     //Get Members
        //     return admin.firestore().collection("groups").doc(group).get()
        //     .then(function (userGroup) {
        //         //Remove Members
        //         return admin.firestore().collection("groups").doc(group).update({
        //             members: firebase.firestore.FieldValue.arrayRemove(uid)
        //         })
        //     })
        // })
    })
    //Remove friend connection
    userFriends.forEach(friend => {
        console.log(friend);
        return admin.database().ref("friends").child(uid).child(friend).remove().then(function(friendRef){
            return admin.database().ref("friends").child(friend).child(uid).remove()
        })
    })
    //Get Phone
    return admin.database().ref("phoneVerified").child(uid).once("value").then(function(phoneVerifiedRef) {
        //Remove Phone
        return admin.database().ref("verifyPhone").child(phoneVerifiedRef.val()).remove().then(function(removedVerify){
            //Remove Phone
            return admin.database().ref("phoneVerified").child(uid).remove().then(function(phoneRemoved){
                return admin.auth().deleteUser(uid)
                .then(function() {
                    return admin.database().ref("unames").child(uname).remove().then(function() {
                        console.log('Successfully deleted user');
                    })
                    
                })
            })
        })
    })
    
  });

exports.shareArticle = functions.https.onCall((data, context)=> {
    const uid = context.auth.uid;
    const groups = data.groups;
    const link = data.url;
    return true;
});

exports.saveArticle = functions.https.onCall((data, context)=> {
    const uid = context.auth.uid;
    const link = data.url;
    return true;
});

exports.notifyNewGroupUsers = functions.database
        .ref('newGroup/{groupId}/{userId}')
        .onCreate(snapshot => {
            const user = snapshot.val()
            console.log(user)
            const inviter      = user.invitedBy;
            const phoneNumber = user.phoneNumber
            const dynamicLinkId = user.dynamicLink

            return admin.firestore().collection("users").doc(inviter).get().then (function(doc) {
                const textMessage = {
                    body: doc.data().firstName + " " + doc.data().lastName + ` invited to join a Foggy Glasses Group! https://foggyglassesnews.page.link/` + dynamicLinkId,
                    to: phoneNumber,  // Text to this number
                    from: twilioNumber // From a valid Twilio number
                }
                return client.messages.create(textMessage)
            })
        })
        // .onWrite(snapshot => snapshot.val())
        // .then(user => {
        //     const inviter      = user.inviter
        //     const phoneNumber = '+19086357906'//user.phoneNumber

        //     // if ( ! validE164(phoneNumber) ) {
        //     //     throw new Error('number must be E164 format!')
        //     // }

        //     const textMessage = {
        //         body: `You've been invited to join Foggy Glasses News group!`,
        //         to: phoneNumber,  // Text to this number
        //         from: twilioNumber // From a valid Twilio number
        //     }

        //     return client.messages.create(textMessage)
        // })
        // .then(message => console.log(message.sid, 'success'))
        // .catch(err => console.log(err))


// exports.textStatus = functions.database
//        .ref('/orders/{orderKey}/status')
//        .onUpdate(event => {


//     const orderKey = event.params.orderKey

//     return admin.database()
//                 .ref(`/orders/${orderKey}`)
//                 .once('value')
//                 .then(snapshot => snapshot.val())
//                 .then(order => {
//                     const status      = order.status
//                     const phoneNumber = order.phoneNumber

//                     if ( ! validE164(phoneNumber) ) {
//                         throw new Error('number must be E164 format!')
//                     }

//                     const textMessage = {
//                         body: `Current order status: ${status}`,
//                         to: phoneNumber,  // Text to this number
//                         from: twilioNumber // From a valid Twilio number
//                     }

//                     return client.messages.create(textMessage)
//                 })
//                 .then(message => console.log(message.sid, 'success'))
//                 .catch(err => console.log(err))


// });


// /// Validate E164 format
// function validE164(num) {
//     return /^\+?[1-9]\d{1,14}$/.test(num)
// }