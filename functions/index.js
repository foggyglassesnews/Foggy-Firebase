const functions = require('firebase-functions');
const admin = require('firebase-admin');
var FieldValue = require('firebase-admin').firestore.FieldValue;
admin.initializeApp();

const twilio = require('twilio');
const MessagingResponse = require('twilio').twiml.MessagingResponse;

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
const accountSid = functions.config().twilio.sid;//firebaseConfig.twilio.sid;
const authToken  = functions.config().twilio.token;//firebaseConfig.twilio.token;
// functions.config().slack.url

const client = new twilio(accountSid, authToken);

const twilioNumber = '+15163094818' // your twilio phone number

const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('0f3b142e5ce646219307fec8dc57a601');

exports.scheduledRecommend7AM = functions.pubsub.schedule('0 7 * * *')
.timeZone('America/New_York').onRun((context) => {
    console.log('7am')
    return sendArticlesAtTime('7:00').then(function(value){
        console.log('end:', value)
    });
});

exports.scheduledRecommend12PM = functions.pubsub.schedule('0 12 * * *').timeZone('America/New_York').onRun((context) => {
    console.log('12pm')
    return sendArticlesAtTime('12:00').then(function(value){
        console.log('end:', value)
    });
});

exports.scheduledRecommend6PM = functions.pubsub.schedule('0 18 * * *').timeZone('America/New_York').onRun((context) => {
    console.log('6pm')
    return sendArticlesAtTime('18:00').then(function(value){
        console.log('end:', value)
    });
});

exports.scheduledRecommend9PM = functions.pubsub.schedule('0 21 * * *').timeZone('America/New_York').onRun((context) => {
    console.log('9pm')
    return sendArticlesAtTime('21:00').then(function(value){
        console.log('end:', value)
    });
});

//Dictionary userArticles = [UserId: [GroupFeedPost]]
//For each group get all users store them checking for duplicates
//After we writeToGroupFeed() store GroupFeedPost with Users in that group
//Consolidate notificaitions based of userArticles if GroupFeedPosts is multi or not
//Send notification
// var groupData = {};
// userGroups.forEach(g => {
//     groupData[g.key] = " ";
// });
// var date = new Date();
// let miliseconds = date.getTime() / 1000.0;
// var newPost = {
//     articleId : articleRef.id,
//     data : groupData,
//     multiGroup: true,
//     senderId : "zKTNvCYzLdT0zZKx5heS4zoYfsl2",
//     timestamp : miliseconds,
//     curated: true
// }
// admin.database().ref('homeFeed/' + user.key).push().set(newPost).then(function(r){
//     console.log("Sent one to ", user.key)
//     sendCuratedNotification(user.val(), "New Curated Article", "Foggy Glasses News curated a new Article for you!");
// })



//uses News API to get dictionary arrays of articles for each category
//each array is accessed with a key corresponding to the name of the category
function fetchArticles (){
    return new Promise (function getCategoryArticles(resolve, reject) {
        let articlesPerCategory = 10
        var articlesDict = new Object()
        //ALL CATEGORIES
        // let allCategories = [ 
        //     "US News", "World News", "Technology", "Health", "Entertainment", "Sports", "Science", "Finance", "Crypto", "Gaming", "Trending",
        // ]
    
        //TRENDING
        let promise1 = newsapi.v2.topHeadlines({
            language: 'en',
            country: 'us',
            pages:1,
            pageSize: articlesPerCategory,
        }).then(response => {
            var articleArray = []
            for (i = 0; i < articlesPerCategory; i++){
                let article = parseToJSON(response.articles[i])
                articleArray.push(article)
            }
            articlesDict["Trending"] = articleArray
        });
        //US NEWS
        let promise2 = newsapi.v2.everything({
            q: 'US news',
            language: 'en',
            pages:1,
            pageSize: articlesPerCategory,
        }).then(response => {
            var articleArray = []
            for (i = 0; i < articlesPerCategory; i++){
                let article = parseToJSON(response.articles[i])
                articleArray.push(article)
            }
            articlesDict["US News"] = articleArray
        });
        //WORLD NEWS
        let promise3 = newsapi.v2.everything({
            q: 'world news',
            language: 'en',
            pages:1,
            pageSize: articlesPerCategory,
        }).then(response => {
            var articleArray = []
            for (i = 0; i < articlesPerCategory; i++){
                let article = parseToJSON(response.articles[i])
                articleArray.push(article)
            }
            articlesDict["World News"] = articleArray
        });
        //FINANCE
        let promise4 = newsapi.v2.topHeadlines({
            category: 'business',
            language: 'en',
            country: 'us',
            pages:1,
            pageSize: articlesPerCategory,
        }).then(response => {
            var articleArray = []
            for (i = 0; i < articlesPerCategory; i++){
                let article = parseToJSON(response.articles[i])
                articleArray.push(article)
            }
            articlesDict["Finance"] = articleArray
        });
        //ENTERTAINMENT
        let promise5 = newsapi.v2.topHeadlines({
            category: 'entertainment',
            language: 'en',
            country: 'us',
            pages:1,
            pageSize: articlesPerCategory,
        }).then(response => {
            var articleArray = []
            for (i = 0; i < articlesPerCategory; i++){
                let article = parseToJSON(response.articles[i])
                articleArray.push(article)
            }
            articlesDict["Entertainment"] = articleArray
        });
        //HEALTH
        let promise6 = newsapi.v2.topHeadlines({
            category: 'health',
            language: 'en',
            country: 'us',
            pages:1,
            pageSize: articlesPerCategory,
        }).then(response => {
            var articleArray = []
            for (i = 0; i < articlesPerCategory; i++){
                let article = parseToJSON(response.articles[i])
                articleArray.push(article)
            }
            articlesDict["Health"] = articleArray
        });
        //SCIENCE
        let promise7= newsapi.v2.topHeadlines({
            category: 'science',
            language: 'en',
            country: 'us',
            pages:1,
            pageSize: articlesPerCategory,
        }).then(response => {
            var articleArray = []
            for (i = 0; i < articlesPerCategory; i++){
                let article = parseToJSON(response.articles[i])
                articleArray.push(article)
            }
            articlesDict["Science"] = articleArray
        });
        //SPORTS
        let promise8 = newsapi.v2.topHeadlines({
            category: 'sports',
            language: 'en',
            country: 'us',
            pages:1,
            pageSize: articlesPerCategory,
        }).then(response => {
            var articleArray = []
            for (i = 0; i < articlesPerCategory; i++){
                let article = parseToJSON(response.articles[i])
                articleArray.push(article)
            }
            articlesDict["Sports"] = articleArray
        });
        //TECHNOLOGY
        let promise9 = newsapi.v2.topHeadlines({
            category: 'technology',
            language: 'en',
            country: 'us',
            pages:1,
            pageSize: articlesPerCategory,
        }).then(response => {
            var articleArray = []
            for (i = 0; i < articlesPerCategory; i++){
                let article = parseToJSON(response.articles[i])
                articleArray.push(article)
            }
            articlesDict["Technology"] = articleArray
        });
        //GAMING
        let promise10 = newsapi.v2.everything({
            q: 'video games',
            language: 'en',
            pages:1,
            pageSize: articlesPerCategory,
        }).then(response => {
            var articleArray = []
            for (i = 0; i < articlesPerCategory; i++){
                let article = parseToJSON(response.articles[i])
                articleArray.push(article)
            }
            articlesDict["Gaming"] = articleArray
        });
        //CRYPTO
        let promise11 = newsapi.v2.everything({
            q: 'crypto currency',
            language: 'en',
            pages:1,
            pageSize: articlesPerCategory,
        }).then(response => {
            var articleArray = []
            for (i = 0; i < articlesPerCategory; i++){
                let article = parseToJSON(response.articles[i])
                articleArray.push(article)
            }        
            articlesDict["Crypto"] = articleArray
        });
        Promise.all([promise1, promise2, promise3, promise4, promise5, promise6, promise7, promise8, promise9, promise10, promise11, ]).then(function()  {
            resolve(articlesDict)
          }); 
    });
}
//receives a time as a string in military time, sends appropriate articles to groups that have opted...
//...in to that time for curation
//(times: '7;00', '12:00', '18:00', '21:00' )
function sendArticlesAtTime(time){
    return new Promise(function fetchAndSend (resolve){
        fetchArticles().then(function(value){
            // dictionary of all fetched articles
            let allFetchedArticles = value
            admin.database().ref('/times/' + time).once('value').then(function(snapshot) {
                //get all groups for the chosen time
                var timeGroups = (snapshot.val()) || '';
                var groupIds = []
                // make sure the group has not opted out of the time 
                for (i in timeGroups){
                    if (timeGroups[i] != 0){
                        groupIds.push(i)
                    }
                }
                console.log(groupIds)
                //send articles to all valid groups
                for (i in groupIds) {
                    let gId = groupIds[i]
                    let groupRef = admin.firestore().collection('groups').doc(gId);
                    groupRef.get().then(doc => {
                        if (!doc.exists) {
                        console.log('No document!');
                        } else {

                            //get the groups curation prefrences
                            var curationCategories =  []
                            var recentlyCuratedUrls = []
                            curationCategories =  doc.data()["curationCategories"]
                            recentlyCuratedUrls = doc.data()["recentlyCuratedUrls"] || []

                            //curates an article for each category the group has selected
                            for (var keyIndex in curationCategories){
                                
                                let key = curationCategories[keyIndex]
                                let articlesOfCategory = allFetchedArticles[key]
                                for (var articleIndex in articlesOfCategory){
                                    let checkArticle = articlesOfCategory[articleIndex]
                                    let checkURL = checkArticle.url
                                    //check if the url of the chosen article is already in the array of recently curated articles
                                    //uses a basic string comparison, we might want a more robust way to compare the urls but really..
                                    //...the api should always send the urls in the same format so it shouldnt be an issue
                                    if (recentlyCuratedUrls.find(function(element) { return element == checkURL; })){
                                        //article has already been curated, move on to next artilcle
                                    }
                                    else{
                                        //article has not been sent recently and can be sent to the group
            
                                        let articleRef = admin.firestore().collection("articles").doc(); 
                                        articleRef.set(checkArticle).then(function(ref){

                                            // add the article to recent urls
                                            recentlyCuratedUrls = addToEnd(recentlyCuratedUrls, checkURL)
                                            admin.firestore().collection('groups').doc(gId).update({"recentlyCuratedUrls" : recentlyCuratedUrls})
            
                                            console.log("SENDING ARTICLE ----- Group: ", gId, "Key: ", key, "Article URL: ", checkArticle.url)
                                            writeToGroupFeed(gId, articleRef.id)
                                
                                        });
                                        break
                                    }
                                }
                            }
                            resolve("complete");
                        }
                    })
                    .catch(err => {
                        console.log('Error getting document', err);
                    });
                }     
            });
        });    
    });   
}
//makes an array to act like a queue
//used to store recently curated urls but remove older values
function addToEnd(array, valueToAdd){
    //hard coded max size of the bootleg queue
    const maxLength = 15
    var processArray = array
    if (processArray.length < maxLength){
        processArray.push(valueToAdd)
    }
    else {
        for (var i = 0; i < processArray.length; i++){
            if (i < (processArray.length - 1)){
                let index = (i+1)
                processArray[i] = processArray[index]
            }
            else{
                processArray[i] = valueToAdd
            }
        }
    }
    return processArray
}
//populates the realtime database with group data
//takes every existing group and assigns them default curation times (they can opt out from within the app later)
//this function should be called only once before we launch the curation functions so the database has groups to send to
//this function could also be used in the future if we want to add additonal curation times
function assignGroupTimes (){
    let groupRef = admin.firestore().collection('groups')
    let allGroups = groupRef.get()
    .then(snapshot => {
        snapshot.forEach(doc => {
            let gId = doc.id
            let group = admin.firestore().collection('groups').doc(doc.id)
            group.update({'curationTimes' : ["7:00, 12:00, 18:00, 21:00"]})
            var groupTime = {};
            groupTime[gId] = 1
            admin.database().ref().child('/times/7:00').update(groupTime);
            admin.database().ref().child('/times/12:00').update(groupTime);
            admin.database().ref().child('/times/18:00').update(groupTime);
            admin.database().ref().child('/times/21:00').update(groupTime);
        });
    })
    .catch(err => {
        console.log('Error getting documents', err);
    });
}

function writeToGroupFeed(feedId, articleId){
    var date = new Date();
    let miliseconds = date.getTime() / 1000.000;
    
    var data = {senderId: "zKTNvCYzLdT0zZKx5heS4zoYfsl2",
                timestamp: miliseconds,
                groupId: feedId,
                commentCount: 0,
                postUpdate: miliseconds,
                commentUpdate: 0,
                articleId: articleId,
                curated: true}
    return admin.database().ref('feeds/' + feedId).push().set(data).then(function(r){
        
    });
}

function sendNotification(token, title, body, articleId, groupId) {
    var message = {
        notification: {
            title: title,
            body: body,
          },
        token: token,
        data: {
            articleId: articleId,
            groupId: groupId
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