/*
1) "inbox:1"
2) "mailalias:ankri.dk:ahk"
3) "inboxnextid"
*/

var redis = require("redis"),
client = redis.createClient();

var validator = require("validator");

var MailModule = function () {
};

MailModule.prototype.init = function(fw, onFinished) {
    this.fw = fw;
	onFinished.call(this);
}

MailModule.prototype.onMessage = function (req, callback) {
	if(typeof(req.body.type) !== "string"){
		callback({error: "Invalid request"});
		return;
	}

	if(!this.fw.modules["user"].loggedIn(req.body.sessionId)){
		callback({error: "You are not logged in"});
		return;
	}

	var session = fw.modules["user"].sessionId2Session(req.body.sessionId);

	switch(req.body.type){
		case "GetRecentMailList" :
			var inbox = "inbox:1:mails";
			if(req.body.isSpam == true)
				inbox = "inbox:spam";
			
			client.zrevrange(inbox, 0, -1, function(err, mailIds){
				var multi = client.multi();

				mailIds.forEach(function (id, i) {
		            multi.hgetall("mail:" + id);
		        });
				
				multi.exec(function(err, mails){
					callback(mails);
				});
			});
			
			break;
		case "GetAliases" :
			client.smembers("user:" + session.userId + ":mailaliases", function(err, res){
				if(err)
					callback({error: err});
				else {
					var aliases = [];
					for(i in res){
						aliases.push({
							alias: res[i]
						});
					}
					callback(aliases);
				}
			});
			break;
		case "AddAlias" :
			if(typeof(req.body.alias) !== "string" || !validator.isEmail(req.body.alias)){
				callback({error: "Invalid e-mail address"});
				break;
			}
			this.getUserInbox(session.userId, function(inboxId){
				if(inboxId > 0){
					client.setnx("mailalias:" + req.body.alias, inboxId, function(err, success){
						if(err)
							callback({error: err});
						else if(success != 1)
							callback({success: false, message: "Alias already exists"});
						else {
							//sadd user:1:mailaliases test@ankri.dk
							client.sadd("user:" + session.userId + ":mailaliases", req.body.alias, function(){
								callback({success: true});	
							});
						}
					});
				} else {
					callback({error: "You do not have an inbox"});
				}
			});
			break;
		case "RemoveAlias" :
			client.del("mailalias:" + req.body.alias, function(){});
			client.srem("user:" + session.userId + ":mailaliases", req.body.alias, function(){});
			callback({success: true});
			break;
	}
};		

MailModule.prototype.getUserInbox = function (userId, callback) {
	client.get("user:" + userId + ":inbox", function(err, inboxId){
		if(inboxId > 0){
			callback(inboxId);
		} else {
			client.incr("inboxnextid", function(err, id){
				client.set("user:" + userId + ":inbox", id, function(){
					callback(id);	
				})
			})
		}
	});
}
 
module.exports = MailModule;