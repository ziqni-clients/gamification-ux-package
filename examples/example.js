(function(window, document, undefined) {
	'use strict';

	var _demoWidget = function(options){

		this.settings = {
			container: null,
			queue: [],
			productList: null,
			notificationResponse: "",
			apiKey: {"X-API-KEY": "df2392fdd8d9460ea50fbf1071484e23"},
			activeGameId: null,
			competitionList: [],
			activeCompetition: null,
			domain: "https://app.competitionlabs.com",
			gateway: "https://gateway.competitionlabs.com",
			activeContest: null,
			memberRefId: null,
			showLeaderboardFor: 10, // minutes
			accountId: null,
			spaceName: null
		};

		if (typeof options !== "undefined" && conmisio.sizeof(options) > 0) {
			this.settings = conmisio.mergeObjects(this.settings, options);
		}

		this.loadGames = function(){
			var _this = this,
				gamestAjax = new conmisio.Ajax();

			gamestAjax.getData({
				type: "GET",
				url: _this.settings.domain + "/" + _this.settings.spaceName + "/demo-games/list",
				headers: _this.settings.apiKey,
				success: function(response, dataObj, xhr){

					gamestAjax.getData({
						type: "GET",
						url: _this.settings.domain + "/is-logged-in",
						success: function (logInResponse, logInDataObj, logInXhr) {
							if (logInXhr.status === 200) {
								var li = document.createElement("li"),
									div = document.createElement("div"),
									a = document.createElement("a"),
									label = document.createElement("span"),
									playButton = document.createElement("span"),
									img = document.createElement("img");

								li.dataset.id = "fruits";
								li.dataset.studio = "CL";
								li.setAttribute("class", "game");
								div.setAttribute("class", "game-wrapper studio-CL");
								a.setAttribute("class", "fruits");
								a.href = "javascript:void(0);";
								a.title = "Fruits";

								label.setAttribute("class", "game-label");
								label.innerHTML = "Fruits";

								playButton.setAttribute("class", "play-button");
								playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="play-btn"><path stroke="white" fill="transparent" stroke-width="2px" d="M2.5,3.94L2.5 62.87 64.89 33.4 2.5 3.94z"></path></svg>';


								var imgSrc = _this.settings.domain + "/assets/demo/images/cl-the-fruits-333-180.png";

								var img = new Image();
								img.onload = function (event) {
									conmisio.addClass(conmisio.closest(event.target, "a"), "loaded");
								};
								img.onerror = function (event) {
									conmisio.remove(event.target);
								};
								img.src = imgSrc;

								a.appendChild(img);
								a.appendChild(playButton);
								a.appendChild(label);
								div.appendChild(a);
								li.appendChild(div);

								_this.settings.productList.appendChild(li);
							}


							if( xhr.status === 200 ){
								var json = JSON.parse(response);

								if( typeof json.data !== "undefined" ) {
									var gamesData = json.data.games;

									// var pushGamingGameList = [{
									//  gameid: "icebreaker",
									//  name: "Ice Breaker",
									//  studio: "PushGaming",
									//  channels: [
									//      "web"
									//  ]
									// }, {
									//  gameid: "humptydumpty",
									//  name: "Humpty Dumpty",
									//  studio: "PushGaming",
									//  channels: [
									//      "web"
									//  ]
									// }, {
									//  gameid: "dragonsisters",
									//  name: "Dragon Sisters",
									//  studio: "PushGaming",
									//  channels: [
									//      "web"
									//  ]
									// }, {
									//  gameid: "meerkats",
									//  name: "Meet the Meerkats",
									//  studio: "PushGaming",
									//  channels: [
									//      "web"
									//  ]
									// }, {
									//  gameid: "wildneon",
									//  name: "Wild Neon",
									//  studio: "PushGaming",
									//  channels: [
									//      "web"
									//  ]
									// }, {
									//  gameid: "hockeyhero",
									//  name: "Hockey Hero",
									//  studio: "PushGaming",
									//  channels: [
									//      "web"
									//  ]
									// }, {
									//  gameid: "dreamteam",
									//  name: "Ultimate Dream Team",
									//  studio: "PushGaming",
									//  channels: [
									//      "web"
									//  ]
									// }, {
									//  gameid: "starfall",
									//  name: "Star Fall",
									//  studio: "PushGaming",
									//  channels: [
									//      "web"
									//  ]
									// }, {
									//  gameid: "goldenfarm",
									//  name: "Golden Farm",
									//  studio: "PushGaming",
									//  channels: [
									//      "web"
									//  ]
									// }, {
									//  gameid: "peterpan",
									//  name: "Peter and the Lost Boys",
									//  studio: "PushGaming",
									//  channels: [
									//      "web"
									//  ]
									// }, {
									//  gameid: "gemsofgods",
									//  name: "Gems of the Gods",
									//  studio: "PushGaming",
									//  channels: [
									//      "web"
									//  ]
									// }];

									// gamesData = gamesData.concat(pushGamingGameList);
									//
									// console.log(gamesData);

									mapObject(gamesData, function (game) {
										var checkWebChannel = false;
										mapObject(game.channels, function (channel) {
											if (channel === "web") {
												checkWebChannel = true;
											}
										});

										//NOTE: mightyarthur is broken
										if (checkWebChannel && game.gameid !== "mightyarthur" && game.studio !== null) {
											var li = document.createElement("li"),
												div = document.createElement("div"),
												label = document.createElement("span"),
												playButton = document.createElement("span"),
												a = document.createElement("a");

											game.studio = game.studio.replace(/\s/g, "");

											li.dataset.id = game.gameid;
											li.dataset.studio = game.studio;
											li.setAttribute("class", "game");
											div.setAttribute("class", "game-wrapper studio-" + game.studio);
											a.setAttribute("class", game.gameid);
											a.href = "javascript:void(0);";
											a.title = game.name;

											label.setAttribute("class", "game-label");
											label.innerHTML = game.name;

											playButton.setAttribute("class", "play-button");
											playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="play-btn"><path stroke="white" fill="transparent" stroke-width="2px" d="M2.5,3.94L2.5 62.87 64.89 33.4 2.5 3.94z"></path></svg>';

											var imgSrc = "https://s3-eu-west-1.amazonaws.com/demo.competitionlabs.com/_system/relax/" + game.gameid + ".png";

											var img = a.appendChild(new Image());
											img.src = imgSrc;
											img.onload = function (event) {
												var imageRef = event.target;
												conmisio.addClass(conmisio.closest(imageRef, "a"), "loaded");
											};
											img.onerror = function (event) {
												conmisio.remove(conmisio.closest(event.target, ".game"));
											};


											a.appendChild(playButton);
											a.appendChild(label);
											div.appendChild(a);
											li.appendChild(div);

											_this.settings.productList.appendChild(li);
										}
									});
								}


							}
						}
					});

				}
			});

		};

		var _attemptLoginCount = 0;
		this._attemptLogin = function(inputValue, loginModal, preloader, callback){
			var _this = this,
				ajax = new conmisio.Ajax();

			ajax.getData({
				url: _this.settings.gateway + "/api/v1/" + _this.settings.spaceName + "/members/reference/" + inputValue.split(" ").join("") + "-" + _this.settings.accountId,
				type: "GET",
				headers: _this.settings.apiKey,
				success: function (response, dataObj, xhr) {

					if( xhr.status === 200 ) {
						var json = JSON.parse(response);

						_this.settings.memberRefId = json.data.memberRefId;

						setTimeout(function () {
							_attemptLoginCount = 0;

							conmisio.setCookie("_login", json.data.memberRefId);

							loginModal.style.display = "none";
							preloader.style.display = "none";

							conmisio.query(".header .dropdown-user").style.display = "block";
							conmisio.query(".header .dropdown-user .username").innerHTML = json.data.name;

							callback();
						}, 1000);
					}else if( _attemptLoginCount < 12 ){
						setTimeout(function(){
							_attemptLoginCount = _attemptLoginCount+1;
							_this._attemptLogin(inputValue, loginModal, preloader, callback);
						}, 2000);
					}
				}
			});
		};

		this._login = function(loginModal, preloader, callback){
			var _this = this,
				inputValue = conmisio.trim( conmisio.query(loginModal, "input[type=text]").value ),
				ajax = new conmisio.Ajax();

			if( inputValue.length > 0 ) {
				preloader.style.display = "block";

				ajax.getData({
					url: _this.settings.gateway + "/api/v1/" + _this.settings.spaceName + "/members/reference/" + inputValue.split(" ").join("") + "-" + _this.settings.accountId,
					type: "GET",
					headers: _this.settings.apiKey,
					success: function (response, dataObj, xhr) {
						var json = {};
						try {
							json = JSON.parse(response);
						} catch (e) {
						}

						if (xhr.status !== 200 && typeof json.errors !== "undefined") {
							ajax.getData({
								url: _this.settings.domain + "/api/demo/" + _this.settings.spaceName + "/member-creation/" + inputValue.split(" ").join("") + "-" + _this.settings.accountId + "/" + inputValue,
								type: "POST",
								data: [{
									memberType: "Individual",
									name: inputValue,
									memberRefId: inputValue.split(" ").join("") + "-" + _this.settings.accountId,
									groups: ["CL"]
								}],
								success: function (response, dataObj, xhr) {
									if (xhr.status === 200) {

										_this._attemptLogin(inputValue, loginModal, preloader, callback);

									}
								}
							});
						} else if (xhr.status === 200) {

							_this.settings.memberRefId = json.data.memberRefId;

							setTimeout(function () {
								conmisio.setCookie("_login", json.data.memberRefId);

								loginModal.style.display = "none";
								preloader.style.display = "none";

								conmisio.query(".header .dropdown-user .username").innerHTML = json.data.name;

								callback();
							}, 1000);
						}
					}
				});
			}
		};

		this.eventListeners = function(){
			var _this = this,
				filterList = conmisio.query(".filter-list"),
				productContainer = conmisio.query(".play-product"),
				productList = conmisio.query(".product-list"),
				widgetInstance = window._clLeaderBoardV3,
				container = conmisio.query(productContainer, ".modal-container");

			widgetInstance.settings.memberId = "";
			widgetInstance.settings.uri.gatewayDomain = _this.settings.gateway;
			widgetInstance.settings.apiKey = _this.settings.apiKey["X-API-KEY"];
			widgetInstance.settings.spaceName = _this.settings.spaceName;
			widgetInstance.settings.gameId = "fruits";
			widgetInstance.settings.bindContainer = container;
			widgetInstance.settings.messages.enable = true;
			widgetInstance.settings.resources = [
				// "https://gateway.competitionlabs.com/julian/assets/8Nlx6HABfSfuvVaBE6CQ/style.css?t=" + ( new Date().getTime() )
			];
			widgetInstance.settings.leaderboard.layoutSettings.imageBanner = true;
			widgetInstance.settings.leaderboard.layoutSettings.titleLinkToDetailsPage = false;

			_this.settings.productList.addEventListener("click", function(event){
				console.log(event.target);
				var product = conmisio.closest(event.target, ".game");

				if( product !== null ){
					var iframe = document.createElement("iframe"),
						existingIframeObj = conmisio.query(container, "iframe");

					if( getDataSet(product, "id") === "fruits" ){
						iframe.src = _this.settings.domain + "/assets/demo/fruits/index.html?memberId=" + conmisio.getCookie("_login") + "&spaceName=" + _this.settings.spaceName + "&accountid=" + _this.settings.accountId;
					}else {
						iframe.src = "https://d2drhksbtcqozo.cloudfront.net/" + (conmisio.mobileCheck() ? "m" : "") + "casino/competitionlabs/" + getDataSet(product, "id") + "/index.html?lang=en-GB&partnerid=195&moneymode=real&productid=" + getDataSet(product, "id") + "&clientid=web&ticket=" + conmisio.getCookie("_login") + "&token=" + conmisio.getCookie("_login") + ":" + _this.settings.spaceName;
					}

					if( existingIframeObj !== null ){
						conmisio.remove(existingIframeObj);
					}

					iframe.style.width = "100%";
					iframe.style.height = "100%";
					iframe.setAttribute("scrolling", "no");
					iframe.setAttribute("frameborder", "0");
					iframe.setAttribute("allowfullscreen", "");

					container.appendChild(iframe);
					_this.settings.activeGameId = getDataSet(product, "id");

					window.scrollTo(0, 0);

					setTimeout(function(){
						conmisio.addClass(document.body, "product-opened");
					}, 50);

					// load widget data
					widgetInstance.settings.memberId = _this.settings.memberRefId;
					widgetInstance.settings.gameId = getDataSet(product, "id");
					widgetInstance.settings.language = "en";

					console.log(widgetInstance.settings);

					widgetInstance.init();
					// alert(widgetInstance.isMobile());

					productContainer.style.display = "block";
				}
			});

			filterList.addEventListener("click", function(event){
				if( event.target.nodeName === "LI" && !conmisio.hasClass(event.target, "active") ){
					conmisio.removeClass(conmisio.query(filterList, ".active"), "active");

					conmisio.addClass(event.target, "active");

					if( event.target.dataset.id === "all" ){
						objectIterator(conmisio.query(productList, ".game"), function(obj){
							obj.style.display = "block";
						});
					}else{
						objectIterator(conmisio.query(productList, ".game"), function(obj){
							if( obj.dataset.studio.toLocaleLowerCase() !== event.target.dataset.id.toLocaleLowerCase() ){
								obj.style.display = "none";
							}else{
								obj.style.display = "block";
							}
						});
					}
				}
			});

			conmisio.query(".header .logout").addEventListener("click", function(event){
				conmisio.removeCookie("_login");
				window.location = window.location;
			});

			var dropdownUser = conmisio.query(".dropdown-user"),
				accountMenu = conmisio.query(dropdownUser, ".account-menu");
			conmisio.query(".dropdown-user .dropdown-toggle").addEventListener("click", function(event){
				if( conmisio.hasClass(accountMenu, "open") ){
					conmisio.removeClass(accountMenu, "open");
				}else{
					conmisio.addClass(accountMenu, "open");
				}
			});
			conmisio.query("body").addEventListener("click", function(event){

				/**
				 * CLOSING modal/overlay widgets
				 */
				if( (conmisio.hasClass(event.target, "overlay") && conmisio.closest(event.target, ".play-product") !== null) || (event.target.nodeName === "A" && conmisio.closest(event.target, ".close-modal") !== null && conmisio.closest(event.target, ".play-product") !== null) ){
					productContainer.style.display = "none";

					var existingIframeObj = conmisio.query(productContainer, "iframe");
					if( existingIframeObj !== null ){
						conmisio.remove(existingIframeObj);
					}


					conmisio.removeClass(document.body, "product-opened");
				}

				if( !conmisio.hasClass(event.target, "account-menu") && conmisio.closest(event.target, ".account-menu") === null && conmisio.closest(event.target, ".dropdown-user") === null ){
					conmisio.removeClass(conmisio.query(".header .dropdown-user .account-menu"), "open");
				}
			});
		};

		this.init = function(){
			var _this = this;

			_this.loadGames();
			_this.eventListeners();
		};

	};

	window.demoWidget = _demoWidget;
})(window, document);

(function(window, document, undefined) {
	'use strict';

	if (window.conmisio !== undefined) {

		var preloader = conmisio.query('.preloader'),
			loginModal = conmisio.query('.login-modal'),
			loginValue = conmisio.getCookie("_login"),
			demoWidgetInstance = new window.demoWidget({
				container: conmisio.query(".wrapper"),
				productList: conmisio.query(".wrapper .product-list"),
				memberRefId: ( loginValue.length === 0 ) ? "" : loginValue,
				apiKey: {"X-API-KEY": "9c9a36737bd64e76bdae451cfc4ae811"},
				domain: "https://app.competitionlabs.com",
				gateway: "https://gateway.competitionlabs.com",
				spaceName: "julian",
				accountId: "AV4t1OhS3ucbdxof-WGh"
			});

		if( loginValue.length === 0 ){
			loginModal.style.display = "block";

			loginModal.addEventListener("click", function (event) {
				var el = event.target;

				if (el.nodeName === "A" && conmisio.hasClass(el, "submit-btn")) {
					demoWidgetInstance._login(loginModal, preloader, function(){
						demoWidgetInstance.settings.memberRefId = conmisio.getCookie("_login");
						demoWidgetInstance.init();
					})
				}
			});

			conmisio.query(loginModal, "input[name=login_name]").addEventListener("keyup", function (event) {

				switch (event.keyCode) {
					case 13: // on enter
						demoWidgetInstance._login(loginModal, preloader, function(){
							demoWidgetInstance.init();
						});
						break;
				}


			});
		}else {
			demoWidgetInstance.init();
		}
	}

})(window, document);
