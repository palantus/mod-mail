


var isSpamFolder = getUrlVar("spam") == "true" ? true : false;
var nextContainerId = 0;

var page = 0;
var gotMorePages = false;
var MailPerpage = 10;

var enableAnimations = (localStorage.enableAnimations == "yes");

function reloadMails(){
	request({module:"mail", type: "GetRecentMailList", isSpam: isSpamFolder}, function(res){
		switchCardList(function(newId){
			refreshMails(newId, res);
		})

	}, function(err){
		$(function(){
			$("#errors").removeClass("hide");
			$("#errors").html(err.error);
		})
	});
}

function refreshMails(containerId, mails){
	var mailList = $("<div/>", {class:"cardlist", id: "cardlist" + containerId})
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

		var singleMailContainer = $("<div/>", {class: "card"});
		singleMailContainer.append(header);
		singleMailContainer.append(body);

		singleMailContainer.click(function(e){
			$(this).find(".mailbody").toggleClass("show");
		})

		mailList.append(singleMailContainer);

		showNewCard(i);

		foundAny = true;
	}

	if(!foundAny)
		mailList.append("<h4>Empty inbox...</h4>");
}

function showLogin(){
	switchCardList(function(newId){
		var loginContainer = $("<div/>", {class:"cardlist", id: "cardlist" + newId})

		var loginCard = $("<div/>", {class: "card"});

		loginCard.append(
						"<h2>Log in/out</h2>\
							<div id='logoutcontrols' style='display:none'>\
								<button>Log out</button>\
							</div>\
							<table id='logincontrols' style='display:none'>\
								<tr><td>Username:</td><td><input type='text' id='loginusername'></input></td></tr>\
								<tr><td>Password:</td><td><input type='password' id='loginpassword'></input></td></tr>\
								<tr><td></td><td><button>Login</button></td></tr>\
							</table>")


		var setLoggedIn = function(loggedIn){
				if(loggedIn){
					loginCard.find("#logincontrols").hide();
					loginCard.find("#logoutcontrols").show();
					$(document).trigger("LoggedIn");
				}
				else {
					loginCard.find("#logincontrols").show();
					loginCard.find("#logoutcontrols").hide();

				var storedUsername = localStorage.getItem("username");
					loginCard.find("#loginusername").val(storedUsername != null ? storedUsername : "");
					$(document).trigger("LoggedOut");
					loginCard.find("#loginusername").focus();	
				}
		}

		loginCard.find("#logoutcontrols button").click(function(){
			request({module:"user", type: "logout"}, function(res){
				if(res.success)
					setLoggedIn(false);
				else
					alert("Failed to log out.");
			});
		});

		loginCard.find("#logincontrols button").click(function(){
			var username = loginCard.find("#loginusername").val();
			var password = loginCard.find("#loginpassword").val();
			request({module:"user", type: "login", UserName: username, Password: password}, function(res){
				if(res.success){
					setLoggedIn(true);
					localStorage.setItem("username", username);
					if(getUrlVar("redirectTo"))
						window.location = getUrlVar("redirectTo");
				}
				else
					alert("Wrong username/password combination.");
			});
		});

		loginCard.find("#logincontrols input").keydown(function(e){
			if(e.keyCode == 13){
				loginCard.find("#logincontrols button").click();
			}
		});

			request({module:"user", type: "IsLoggedIn"}, function(res){
				setLoggedIn(res.loggedIn);
			});


		loginContainer.append(loginCard)

		$("body").append(loginContainer);

		showNewCard(0);
	})
}

function showSetup(){
	switchCardList(function(newId){
		var setupContainer = $("<div/>", {class:"cardlist", id: "cardlist" + newId})
		$("body").append(setupContainer);

		var setupCard = $("<div></div>", {class: "card", html: "<h2>Aliases</h2>"});
		
		setupCard.append($("<div></div>", {id: "tab" + newId}))
		setupContainer.append(setupCard)

		var tableCreator = new TableCreator();
		tableCreator.init({	
			elementId: "tab" + newId,
			clickable: false,
			//style: {"max-width": "500px", "background-color": "white", "box-shadow" : "3px 3px 10px black"},
			hideFooter: true,
			columns: [
						{title: "Alias", dataKey: "alias"}
					 ],
			
			createRecord: {
				overrideCreate: function(){
					showNewAlias();
				}
			},
			deleteRecord: {
				onDelete: function(record, callback){
					request({module: "mail", type: "RemoveAlias", alias: record.alias}, function(res){
						callback();
					});
				}
			},
			dataSource: function(onData){
				request({module: "mail", type: "GetAliases"}, onData);
			}
		});
		tableCreator.draw();

		showNewCard(0);

		var optionsCard = $("<div></div>", {class: "card", html: "<h2>Options</h2>"});
		var enableAnimationsCheckbox = $("<input type='checkbox' id='enableAnimations'/>")
		enableAnimationsCheckbox[0].checked = enableAnimations;
		optionsCard.append(enableAnimationsCheckbox)
		optionsCard.append("Enable animations")
		enableAnimationsCheckbox.change(function(){
			enableAnimations = this.checked
			localStorage.enableAnimations = "yes";
		})

		setupContainer.append(optionsCard)

		showNewCard(1);
	})
}

function showNewAlias(){
	switchCardList(function(newId){

		var setupContainer = $("<div/>", {class:"cardlist", id: "cardlist" + newId})
		var setupCard = $("<div></div>", {class: "card", html: "<h2>New Alias</h2>"});

		setupCard.append("<br/><label for='newalias'>Full alias (e.g. 'mail@domain.net'):</label><br/>")
		var newAlias = $("<input name='newalias'/>")
		setupCard.append(newAlias)

		setupCard.append("<br/><br/>")

		var createBtn = $("<button/>", {html: "Create", class: "tcbutton"});
		createBtn.click(function(){
			request({module: "mail", type: "AddAlias", alias: newAlias.val()}, function(res){
				showSetup();
			}, function(err){showError(err.error);})
		})
		setupCard.append(createBtn);
		
		newAlias.keydown(function(e){
			if(e.keyCode == 13){
				createBtn.click();
			}
		});

		setupContainer.append(setupCard)
		$("body").append(setupContainer);

		showNewCard(0, function(){
			newAlias.focus();
		});
	})
}

function switchCardList(callback){
	$("#errors").addClass("hide");

	var newContainerId = nextContainerId;
	nextContainerId++;

	var containerId = "#cardlist" + (nextContainerId - 2);

	if(enableAnimations){
		$(containerId + " .card").addClass("animate");

		var i = 0;
		$(containerId + " .card").each(function(){
			setTimeout(function(){
				$(containerId + " .card:not(.hide)").first().addClass("hide");
			}, (i * 70) + 1);
			i++;
		});

		setTimeout(function(){
			$(containerId).remove();
		}, Math.max(500, (i * 70) + 1))

		setTimeout(function(){
			callback(newContainerId);
		}, 70)
	} else {
		$(containerId).remove();
		callback(newContainerId);
	}
}

function showNewCard(cardNum, callback){
	var containerId = "#cardlist" + (nextContainerId - 1);

	if(enableAnimations) {
		$(containerId + " .card").addClass("animate");

		setTimeout(function(){
			$(containerId + " .card:not(.show)").first().addClass("show");
			if(typeof callback === "function")
				callback(cardNum);
		}, (cardNum * 70) + 50);
	} else {
		if(typeof callback === "function")
			callback(cardNum);
	}
}

function showError(error){
	$("#errors").removeClass("hide");
	$("#errors").html(error);
}

reloadMails();