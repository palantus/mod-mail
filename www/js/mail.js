


var isSpamFolder = getUrlVar("spam") == "true" ? true : false;
var nextContainerId = 0;

var page = 0;
var gotMorePages = false;
var MailPerpage = 10;

function reloadMails(){
	request({module:"mail", type: "GetRecentMailList", isSpam: isSpamFolder}, function(res){
		
		var i = 0;
		var containerId = "#mails" + (nextContainerId - 1);
		$(containerId + " .mailcontainer").each(function(){
			setTimeout(function(){
				$(containerId + " .mailcontainer:not(.hide)").first().addClass("hide");
			}, (i * 100) + 1);
			i++;
		});

		setTimeout(function(){
			$(containerId).remove();
		}, Math.max(500, (i * 100) + 1))

		setTimeout(function(){
			refreshMails(res);
		}, 100)
		

	}, function(err){
		$(function(){
			$("#errors").html(err.error);
		})
	});
}

function refreshMails(mails){
	var containerId = nextContainerId;
	nextContainerId++;

	var mailList = $("<div/>", {class:"mails", id: "mails" + containerId})
	$("body").append(mailList);

	var foundAny = false;
	for(i in mails){
		var isHTML = mails[i].bodyHTML != "" ? true : false;

		var headerTab = $("<table>");
		var row1 =  $("<tr/>");
		row1.append($("<td/>", {html: "From:"}));
		row1.append($("<td/>", {html: mails[i].from}));
		headerTab.append(row1);

		var row2 =  $("<tr/>");
		row2.append($("<td/>", {html: "To:"}));
		row2.append($("<td/>", {html: mails[i].to}));
		headerTab.append(row2);

		var row3 =  $("<tr/>");
		row3.append($("<td/>", {html: "Subject:"}));
		row3.append($("<td/>", {html: mails[i].title}));
		headerTab.append(row3);

		if(mails[i].numAttachments > 0){
			var att = $("<div/>");
			for(var a in mails[i].attachments){
				att.append($("<a/>", {html: mails[i].attachments[a].filename, href: "/request?module=mail&type=GetAttachment&file=" + mails[i].attachments[a].downloadHash}));
			}

			var row4 =  $("<tr/>");
			row4.append($("<td/>", {html: "Attachments:"}));
			row4.append($("<td/>", {html: att, class: "mailattachments"}));
			headerTab.append(row4);
		}

		var header = $("<div/>", {class: "mailheader"});
		header.append(headerTab);

		var body = $("<div/>", {class: "mailbody" + (isHTML?"":" plain"), html: (isHTML ? mails[i].bodyHTML : mails[i].bodyPlain)});

		var singleMailContainer = $("<div/>", {class: "mailcontainer"});
		singleMailContainer.append(header);
		singleMailContainer.append(body);

		singleMailContainer.click(function(e){
			$(this).find(".mailbody").toggleClass("show");
		})

		mailList.append(singleMailContainer);

		setTimeout(function(){
			mailList.find(".mailcontainer:not(.show)").first().addClass("show");
		}, (i * 100) + 50);

		foundAny = true;
	}

	if(!foundAny)
		mailList.append("<h4>Empty inbox...</h4>");
}

reloadMails();