var redis = require("redis"),
client = redis.createClient();

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

	switch(req.body.type){
		case "GetRecentMailList" :
			client.zrevrange("mails:ankri.dk:ahk", 0, -1, function(err, mailIds){
				var multi = client.multi();

				mailIds.forEach(function (id, i) {
		            multi.hgetall("mail:" + id);
		        });
				
				multi.exec(function(err, mails){
					callback(mails);
				});
			});
			
			break;
	}
};		
 
module.exports = MailModule;