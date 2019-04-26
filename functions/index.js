const functions = require('firebase-functions');
const admin = require('firebase-admin');
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
            }
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
    return admin.firestore().collection("users").doc(senderId).get().then (function(doc) {
        return admin.firestore().collection("groups").doc(context.params.feedId).get().then (function(doc1) {
            return admin.database().ref("notifications").child("newArticle").child(feedId).once('value').then(notifications => {
                notifications.forEach(user =>{ 
                    if (user.key == senderId) {
                        console.log("Ignoring sender Id")
                        return;
                    } else {
                        var message = {
                            notification: {
                                title: 'New Article',
                                body: doc.data().firstName +' shared an Article to your group ' + doc1.data().name
                              },
                            token: user.val(),
                            data: {
                                articleId: context.params.postId,
                                groupId: context.params.feedId
                            }
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
    const topicId = "comment-" + context.params.feedId
    console.log(topicId);

    const senderId = snapshot.val().uid
    return admin.firestore().collection("users").doc(senderId).get().then (function(doc) {
        return admin.firestore().collection("groups").doc(context.params.feedId).get().then (function(doc1) {
            return admin.database().ref("notifications").child("newComment").child(context.params.feedId).once('value').then(notifications => {
                notifications.forEach(user =>{ 
                    if (user.key == senderId) {
                        console.log("Ignoring sender Id")
                        return;
                    } else {
                        var message = {
                            notification: {
                                title: 'New Comment',
                                body: doc.data().firstName +' posted a new comment on an Article in your group ' + doc1.data().name
                              },
                            token: user.val(),
                            data: {
                                articleId: context.params.postId,
                                groupId: context.params.feedId
                            }
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

exports.notifyNewGroupUsers = functions.database
        .ref('newGroup/{groupId}/{userId}')
        .onCreate(snapshot => {
            const user = snapshot.val()
            console.log(user)
            const inviter      = user.inviter
            const phoneNumber = user.phoneNumber
            const dynamicLinkId = user.dynamicLink

            // if ( ! validE164(phoneNumber) ) {
            //     throw new Error('number must be E164 format!')
            // }

            const textMessage = {
                body: `You've been invited to join a Foggy Glasses Group! https://foggyglassesnews.page.link/` + dynamicLinkId,
                to: phoneNumber,  // Text to this number
                from: twilioNumber // From a valid Twilio number
            }

            return client.messages.create(textMessage)
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