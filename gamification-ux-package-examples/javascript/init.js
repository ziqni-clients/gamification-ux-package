(function(){
	const isElement = function (o) {
		return (
			typeof HTMLElement === 'object'
				? o instanceof HTMLElement
				: /* DOM2 */ o && typeof o === 'object' && o !== null && o.nodeType === 1 && typeof o.nodeName === 'string'
		);
	};

	const sizeof = function (obj) {
		let size = 0; let key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}

		if (size === 0 && isElement(obj)) {
			size = 1;
		}

		return size;
	};

	const mergeObjects = function (obj1, obj2, arrayType) {
		var obj3 = (typeof arrayType === 'undefined' || arrayType === false) ? {} : [];

		for (const i in obj1) {
			obj3[i] = obj1[i];
		}

		for (const k in obj2) {
			if (typeof obj1[k] !== 'object') {
				obj3[k] = obj2[k];
			} else if (obj1[k] instanceof Array) {
				obj3[k] = obj2[k]; // arrays get overwritten and not extended
			} else if (typeof obj1[k] !== 'undefined' && typeof obj1[k] === 'object' && obj1[k] !== null && typeof obj1[k].nodeType === 'undefined' && sizeof(obj1[k]) > 0) {
				obj3[k] = mergeObjects(obj1[k], obj2[k]);
			} else if (typeof obj1[k] !== 'undefined' && typeof obj1[k] === 'object') {
				obj3[k] = obj2[k];
			} else {
				console.log('fail');
			}

			if (obj3[k] === undefined) {
				delete obj3[k];
			}
		}

		return obj3;
	};

	const addClass = function (element, className) {
		try {
			if (element.classList) {
				element.classList.add(className);
			} else {
				element.className += ' ' + className;
			}
		} catch (e) {
			console.trace();
		}

		return element;
	};

	const removeClass = function (element, className) {
		try {
			if (element.classList) {
				element.classList.remove(className);
			} else {
				element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
			}
		} catch (e) {
			console.log(element, className);
			// console.error(e);
			// console.trace();
		}

		return element;
	};

	function _hasClass (element, className) {
		className = className.replace('.', '');

		try {
			if (element.classList) {
				return element.classList.contains(className);
			} else {
				return new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
			}
		} catch (e) {
			if (typeof e.stack !== 'undefined') {
				console.log(e.stack);
			}
			console.log(e, element, className);

			return false;
		}
	}

	const hasClass = function (element, className) {
		if (typeof className === 'string') {
			return _hasClass(element, className);
		} else if (className instanceof Array) {
			var hasClass = false;
			for (var i in className) {
				if (typeof className[i] === 'string' && _hasClass(element, className[i])) {
					hasClass = true;
				}
			}
			return hasClass;
		}
	};

	const mapObject = function (obj, callback) {
		if (obj !== null) {
			var count = 0;
			for (var key in obj) {
				if (obj.hasOwnProperty(key)) {
					var ret = callback(obj[key], key, count);
					if (typeof ret !== 'undefined') obj[key] = ret;

					count++;
				}
			}
		} else {
			console.log('returned object is null', typeof obj);
		}

		return obj;
	};

	const objectIterator = function (obj, callback) {
		if (typeof obj !== 'undefined' && obj !== null && typeof obj.length !== 'undefined' && obj instanceof Array) {
			let count = 0;
			for (const key in obj) {
				callback(obj[key], key, count, obj.length);

				count++;
			}
		} else if (typeof obj !== 'undefined' && obj !== null) {
			callback(obj, 0, 0, 1);
		}
	};

	const stringContains = function (str, partial) {
		return (str.indexOf(partial) > -1);
	};

	const remove = function (el) {
		if (el !== null) {
			el.parentElement.removeChild(el);
		}
	};

	function syntaxHighlight(json) {
		json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
			var cls = 'number';
			if (/^"/.test(match)) {
				if (/:$/.test(match)) {
					cls = 'key';
				} else {
					cls = 'string';
				}
			} else if (/true|false/.test(match)) {
				cls = 'boolean';
			} else if (/null/.test(match)) {
				cls = 'null';
			}
			return '<span class="' + cls + '">' + match + '</span>';
		});
	}

	const WidgetSetup = function ( options ){

		this.settings = {
			container: null,
			widgetInstance: null,
			widgetInnerContainer: null,
			defaultSettings: {
				memberId: "jon-doe-Asd3-_J_CgpY-bw2S2Sy",
				apiKey: "",
				spaceName: "your space",
				gameId: "fruits",
				resources: [

				]
			},
			activeStyle: "",
			styles: []
		};

		if (typeof options !== 'undefined') {
			this.settings = mergeObjects(this.settings, options);
		}

		this.demoData = function () {
			// lookup services override
			this.settings.widgetInstance.settings.uri.gatewayDomain = "";
			this.settings.widgetInstance.settings.uri.members = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/member-data-sample.json";
			this.settings.widgetInstance.settings.uri.competitions = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/competition-list-data-sample.json";
			this.settings.widgetInstance.settings.uri.competitionById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/competition-data-sample_:id.json";
			this.settings.widgetInstance.settings.uri.memberCompetitions = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/competition-list-data-sample.json";
			this.settings.widgetInstance.settings.uri.memberCompetitionById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/competition-data-sample_:competitionId.json";
			this.settings.widgetInstance.settings.uri.contestLeaderboard = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/leaderboard-data.json";
			this.settings.widgetInstance.settings.uri.achievements = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-list-data-sample.json";
			this.settings.widgetInstance.settings.uri.achievement = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-data-sample.json";
			this.settings.widgetInstance.settings.uri.achievementsProgression = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-list-perc-data-sample.json";
			this.settings.widgetInstance.settings.uri.achievementsIssued = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-list-issued-data-sample.json";
			this.settings.widgetInstance.settings.uri.messages = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/messages-claimed-data-sample.json";
			this.settings.widgetInstance.settings.uri.memberReward = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/messages-reward-data-sample.json";
			this.settings.widgetInstance.settings.uri.messageById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/messages-data-sample.json";
			this.settings.widgetInstance.settings.uri.assets = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/images/:attachmentId.png";
		};

		this.navigation = function () {
			var _this = this,
				navigation = _this.settings.container.querySelector(".widget-theme-container");

			navigation.innerHTML = "";
			mapObject(_this.settings.styles, function(style){
				var li = document.createElement("li");

				if (style.id === _this.settings.activeStyle) {
					addClass(li, "active");
				}

				li.dataset.id = style.id;

				if( typeof style.data === "undefined" ) {
					li.setAttribute("class", "cl-theme-list-item");
					li.innerHTML = style.name;
				}else{
					var select = document.createElement("select"),
						selected = "";
					mapObject(style.data, function(data){
						var option = document.createElement("option");
						option.value = data.key;
						option.innerHTML = data.label;

						if( typeof data.selected !== "undefined"){
							selected = data.key;
						}

						select.appendChild(option);
					});

					if (selected.length !== 0){
						select.value = selected;
					}

					li.setAttribute("class", "select " + style.id);

					li.appendChild(select);
				}

				navigation.appendChild(li);

			});
		};

		this.animateMiniScoreboardClick = function ( callback ) {
			var _this = this;

			const clickContainer = document.querySelector(".click-container");
			setTimeout(function (){
				clickContainer.style.display = "block";
				clickContainer.style.opacity = "1";
				setTimeout(function (){
					addClass(clickContainer.querySelector(".click-circle"), "animated-click");
					setTimeout(function (){
						clickContainer.style.opacity = "0";
						clickContainer.style.display = "none";
						_this.settings.widgetInstance.clickedMiniScoreBoard();

						if( typeof callback === "function"){
							callback(_this.settings.widgetInstance);
						}
					}, 500);
				}, 500);
			}, 500);
		};

		this.miniScoreboardInitPositioning = function () {
			var _this = this;
			_this.settings.widgetInstance.settings.layout.miniScoreBoardPosition.left = "30px";
			_this.settings.widgetInstance.settings.layout.miniScoreBoardPosition.top = "30px";
		};

		this.eventListeners = function () {
			var _this = this;


			_this.settings.container.querySelector(".view-options").addEventListener("click", function (event) {
				var el = event.target;

				var modal = _this.settings.container.querySelector(".view-options-modal");
				var modalContainer = _this.settings.container.querySelector(".view-options-container pre");

				modal.style.display = "block";
				modalContainer.innerHTML = syntaxHighlight(JSON.stringify(widgetSetup.settings.defaultSettings, undefined, 4));

			});

			_this.settings.container.querySelector(".view-options-container .view-options-close").addEventListener("click", function (event) {
				var el = event.target;

				var modal = _this.settings.container.querySelector(".view-options-modal");

				modal.style.display = "none";

			});
		};

		this.init = function ( callback ){
			var _this = this;

			_this.navigation();

			_this.settings.widgetInstance = new window._clLeaderBoardV3SelfInit({
				enableNotifications: false,
				autoStart: false
			});

			_this.settings.widgetInstance.settings.bindContainer = _this.settings.widgetInnerContainer;

			_this.miniScoreboardInitPositioning();
			// widgetInstance.settings.layout.miniScoreBoardOrientation = 'vertical';
			// widgetInstance.settings.layout.allowOrientationChange = false;
			// widgetInstance.settings.layout.enableMiniScoreBoardDragging = false;
			// _this.settings.widgetInstance.settings.resources = [
			// 	("https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/themes/css/theme/cl-style-1-light-theme.css?t=" + ( new Date().getTime() ))
			// ];

			_this.settings.defaultSettings.resources = [
				("https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/themes/css/theme/" + _this.settings.activeStyle + ".css?t=" + ( new Date().getTime() ))
			];
			_this.settings.widgetInstance.settings = mergeObjects(_this.settings.widgetInstance.settings, _this.settings.defaultSettings);

			_this.demoData( this.settings.defaultSettings.language );

			_this.settings.widgetInstance.settings.startupCallback = function () {
				_this.animateMiniScoreboardClick( callback );

				const widgetTheme = document.querySelector(".widget-theme-container");
				widgetTheme.addEventListener("click", function (event){
					var el = event.target;

					if( el.nodeName === "LI" && hasClass(el, "cl-theme-list-item") && !hasClass(el, "active") ){


						_this.settings.widgetInnerContainer.style.opacity = 0;

						setTimeout(function (){
							var list = document.querySelectorAll("link");

							if (list !== null && list !== undefined && list.nodeType) {

							} else if (list !== null && list !== undefined && list.length === 1) {
								list = list[0];
							} else if (list !== null && list !== undefined && list.length > 0) {
								list = Array.prototype.slice.call(list);
							}

							objectIterator(list, function (obj){
								if(_this.settings.widgetInstance.settings.resources.indexOf(obj.href) !== -1){
									remove(obj);
								}
							});

							const updateResource = [
								("https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/themes/css/theme/" + el.dataset.id + ".css?t=" + ( new Date().getTime() ))
							];
							_this.settings.widgetInstance.settings.resources = updateResource;

							_this.settings.defaultSettings.resources = updateResource

							removeClass(widgetTheme.querySelector(".active"), "active");
							addClass(el, "active");

							_this.settings.widgetInstance.loadStylesheet();


							setTimeout(function (){
								_this.settings.widgetInnerContainer.style.opacity = 1;
							}, 1000);
						}, 400);

					}
				});

				widgetTheme.querySelector(".cl-language-select select").addEventListener("change", function (ev) {
					const el = ev.target;
					const languageChange = el.value;

					_this.settings.widgetInstance.settings.language = languageChange;
					_this.settings.defaultSettings.language = languageChange;

					_this.demoData( languageChange );

					_this.settings.widgetInstance.restart();

				});


				_this.eventListeners();
			};
		}
	};





	/**
	 * ********************************
	 * ***** CL Style 1 examples ******
	 * ********************************
	 */
	// CL Style 1 - Basic layout
	var clStyle1BasicLayoutPage = document.querySelector(".cl-style-1-basic-layout");
	if( clStyle1BasicLayoutPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle1BasicLayoutPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-1-light-theme",
			styles: [
				{
					id: "cl-style-1-light-theme",
					name: "Light theme"
				},
				{
					id: "cl-style-1-dark-theme",
					name: "Dark theme"
				}
			]
		});

		widgetSetup.init();
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 1 - Leaderboard layout
	var clStyle1LeaderboardOnlyPage = document.querySelector(".cl-style-1-leaderboard-only");
	if( clStyle1LeaderboardOnlyPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle1LeaderboardOnlyPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-1-light-theme",
			styles: [
				{
					id: "cl-style-1-light-theme",
					name: "Light theme"
				},
				{
					id: "cl-style-1-dark-theme",
					name: "Dark theme"
				}
			],
			defaultSettings: {
				navigation: {
					achievements: {
						enable: false
					},
					rewards: {
						enable: false
					},
					inbox: {
						enable: false
					}
				}
			}
		});
		widgetSetup.init();
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 1 - Navigation menu order
	var clStyle1NavigationMenuOrderPage = document.querySelector(".cl-style-1-navigation-menu-order");
	if( clStyle1NavigationMenuOrderPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle1NavigationMenuOrderPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-1-light-theme",
			styles: [
				{
					id: "cl-style-1-light-theme",
					name: "Light theme"
				},
				{
					id: "cl-style-1-dark-theme",
					name: "Dark theme"
				}
			],
			defaultSettings: {
				navigation: {
					tournaments: {
						order: 2
					},
					achievements: {
						order: 1
					},
					rewards: {
						order: 3
					},
					inbox: {
						order: 4
					}
				}
			}
		});
		widgetSetup.init();
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 1 - Tournament details
	var clStyle1TournamentDetailsPage = document.querySelector(".cl-style-1-tournament-details-page");
	if( clStyle1TournamentDetailsPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle1TournamentDetailsPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-1-light-theme",
			styles: [
				{
					id: "cl-style-1-light-theme",
					name: "Light theme"
				},
				{
					id: "cl-style-1-dark-theme",
					name: "Dark theme"
				}
			],
			defaultSettings: {
				leaderboard: {
					layoutSettings: {
						titleLinkToDetailsPage: true
					}
				}
			}
		});
		widgetSetup.init( function(){
			setTimeout(function (){

				const contentArea = widgetSetup.settings.widgetInstance.settings.mainWidget.settings.container.querySelector(".cl-main-widget-lb-details-content");
				contentArea.style.transition = "background-color 0.3s ease";
				setTimeout(function (){
					contentArea.style.backgroundColor = "rgba(196,114,95, 0.8)";

					setTimeout(function () {
						widgetSetup.settings.widgetInstance.settings.mainWidget.loadCompetitionDetails(function () {});
						contentArea.style.backgroundColor = "";
						contentArea.style.transition = "";
					}, 800);
				}, 50);
			}, 1200);
		} );
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 1 - Vertical MiniScoreboard
	var clStyle1VerticalMiniScoreboardPage = document.querySelector(".cl-style-1-vertical-miniscoreboard");
	if( clStyle1VerticalMiniScoreboardPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle1VerticalMiniScoreboardPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-1-light-theme",
			styles: [
				{
					id: "cl-style-1-light-theme",
					name: "Light theme"
				},
				{
					id: "cl-style-1-dark-theme",
					name: "Dark theme"
				}
			],
			defaultSettings: {
				layout: {
					miniScoreBoardOrientation: 'vertical'
				}
			}
		});
		widgetSetup.animateMiniScoreboardClick = function ( callback ) {};
		widgetSetup.miniScoreboardInitPositioning = function () {
			var _this = this;
			_this.settings.widgetInstance.settings.layout.miniScoreBoardPosition.left = "170px";
			_this.settings.widgetInstance.settings.layout.miniScoreBoardPosition.top = "0px";
		};
		widgetSetup.init();
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 1 - Positioning MiniScoreboard
	var clStyle1PositioningMiniScoreboardPage = document.querySelector(".cl-style-1-positioning-miniscoreboard");
	if( clStyle1PositioningMiniScoreboardPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle1PositioningMiniScoreboardPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-1-light-theme",
			styles: [
				{
					id: "cl-style-1-light-theme",
					name: "Light theme"
				},
				{
					id: "cl-style-1-dark-theme",
					name: "Dark theme"
				}
			],
			defaultSettings: {
				layout: {
					miniScoreBoardPosition: {
						left: "200px",
						top: "200px"
					}
				}
			}
		});
		const clickContainer = document.querySelector(".click-container");
		clickContainer.style.left = "309px";
		clickContainer.style.top = "233px";

		widgetSetup.animateMiniScoreboardClick = function ( callback ) {};
		widgetSetup.init();
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 1 - Languages translation
	var clStyle1LanguagesTranslationPage = document.querySelector(".cl-style-1-languages-translation");
	if( clStyle1LanguagesTranslationPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle1LanguagesTranslationPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-1-light-theme",
			styles: [
				{
					id: "cl-style-1-light-theme",
					name: "Light theme"
				},
				{
					id: "cl-style-1-dark-theme",
					name: "Dark theme"
				},
				{
					id: "cl-language-select",
					name: "Select language",
					data: [{
						key: 'cs',
						label: "Czech [CS]"
					}, {
						key: 'da',
						label: "Danish [DA]"
					}, {
						key: 'de',
						label: "German [DE]"
					}, {
						key: 'en',
						label: "English [EN]"
					}, {
						key: 'es',
						label: "Spanish [ES]"
					}, {
						key: 'fi',
						label: "Finnish [FI]"
					}, {
						key: 'fr',
						label: "French [FR]"
					}, {
						key: 'hr',
						label: "Croatian [HR]"
					}, {
						key: 'it',
						label: "Italian [IT]"
					}, {
						key: 'ja',
						label: "Japanese [JA]",
						selected: true
					}, {
						key: 'ko',
						label: "Korean [KO]"
					}, {
						key: 'lt',
						label: "Lithuanian [LT]"
					}, {
						key: 'lv',
						label: "Latvian [LV]"
					}, {
						key: 'no',
						label: "Norwegian [NO]"
					}, {
						key: 'pl',
						label: "Polish [PL]"
					}, {
						key: 'pt',
						label: "Portuguese [PT]"
					}, {
						key: 'ro',
						label: "Romanian [RO]"
					}, {
						key: 'ru',
						label: "Russian [RU]"
					}, {
						key: 'th',
						label: "Thai [TH]"
					}, {
						key: 'uk',
						label: "Ukrainian [UK]"
					}, {
						key: 'vi',
						label: "Vietnamese [VI]"
					}, {
						key: 'zh',
						label: "Chinese - Simplified [ZH]"
					}, {
						key: 'zh_TW',
						label: "Chinese - Traditional [zh_TW]"
					}]
				}
			],
			defaultSettings: {
				language: "ja",
				uri: {
					translationPath: "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/build/i18n/translation_:language.json"
				}
			}
		});


		widgetSetup.demoData = function ( lang ) {
			// lookup services override
			const language = (lang === "ja") ? lang + "/" : "";
			this.settings.widgetInstance.settings.uri.gatewayDomain = "";
			this.settings.widgetInstance.settings.uri.members = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/member-data-sample.json";
			this.settings.widgetInstance.settings.uri.competitions = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "competition-list-data-sample.json";
			this.settings.widgetInstance.settings.uri.competitionById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "competition-data-sample_:id.json";
			this.settings.widgetInstance.settings.uri.memberCompetitions = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "competition-list-data-sample.json";
			this.settings.widgetInstance.settings.uri.memberCompetitionById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "competition-data-sample_:competitionId.json";
			this.settings.widgetInstance.settings.uri.contestLeaderboard = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/leaderboard-data.json";
			this.settings.widgetInstance.settings.uri.achievements = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "achievements-list-data-sample.json";
			this.settings.widgetInstance.settings.uri.achievement = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "achievements-data-sample_id:id.json";
			this.settings.widgetInstance.settings.uri.achievementsProgression = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-list-perc-data-sample.json";
			this.settings.widgetInstance.settings.uri.achievementsIssued = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-list-issued-data-sample.json";
			this.settings.widgetInstance.settings.uri.messages = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "messages-claimed-data-sample.json";
			this.settings.widgetInstance.settings.uri.memberReward = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "messages-reward-data-sample.json";
			this.settings.widgetInstance.settings.uri.messageById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "messages-data-sample.json";
			this.settings.widgetInstance.settings.uri.assets = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/images/:attachmentId.png";
			this.settings.widgetInstance.settings.uri.memberCompetitionOptIn = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/competition-opt-in-sample.json";
		};

		widgetSetup.init();
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 1 - Lock orientation
	var clStyle1LockOrientationPage = document.querySelector(".cl-style-1-lock-orientation");
	if( clStyle1LockOrientationPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle1LockOrientationPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-1-light-theme",
			styles: [
				{
					id: "cl-style-1-light-theme",
					name: "Light theme"
				},
				{
					id: "cl-style-1-dark-theme",
					name: "Dark theme"
				}
			],
			defaultSettings: {
				layout: {
					allowOrientationChange: false
				}
			}
		});

		widgetSetup.animateMiniScoreboardClick = function ( callback ) {};
		widgetSetup.init();
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 1 - Disable dragging
	var clStyle1DisableDraggingPage = document.querySelector(".cl-style-1-disable-dragging");
	if( clStyle1DisableDraggingPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle1DisableDraggingPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-1-light-theme",
			styles: [
				{
					id: "cl-style-1-light-theme",
					name: "Light theme"
				},
				{
					id: "cl-style-1-dark-theme",
					name: "Dark theme"
				}
			],
			defaultSettings: {
				layout: {
					enableMiniScoreBoardDragging: false
				}
			}
		});

		widgetSetup.animateMiniScoreboardClick = function ( callback ) {};
		widgetSetup.init();
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 1 - Opt-in example
	var clStyle1OptInExamplePage = document.querySelector(".cl-style-1-opt-in-example");
	if( clStyle1OptInExamplePage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle1OptInExamplePage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-1-light-theme",
			styles: [
				{
					id: "cl-style-1-light-theme",
					name: "Light theme"
				},
				{
					id: "cl-style-1-dark-theme",
					name: "Dark theme"
				}
			],
			defaultSettings: {

			}
		});

		widgetSetup.animateMiniScoreboardClick = function ( callback ) {};
		widgetSetup.demoData = function () {
			// lookup services override
			this.settings.widgetInstance.settings.uri.gatewayDomain = "";
			this.settings.widgetInstance.settings.uri.members = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/member-data-sample.json";
			this.settings.widgetInstance.settings.uri.competitions = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/competition-list-data-sample.json";
			this.settings.widgetInstance.settings.uri.competitionById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/competition-data-sample-opt-in_:id.json";
			this.settings.widgetInstance.settings.uri.memberCompetitions = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/competition-list-data-sample.json";
			this.settings.widgetInstance.settings.uri.memberCompetitionById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/competition-data-sample-opt-in_:competitionId.json";
			this.settings.widgetInstance.settings.uri.contestLeaderboard = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/leaderboard-data.json";
			this.settings.widgetInstance.settings.uri.achievements = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-list-data-sample.json";
			this.settings.widgetInstance.settings.uri.achievement = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-data-sample.json";
			this.settings.widgetInstance.settings.uri.achievementsProgression = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-list-perc-data-sample.json";
			this.settings.widgetInstance.settings.uri.achievementsIssued = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-list-issued-data-sample.json";
			this.settings.widgetInstance.settings.uri.messages = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/messages-claimed-data-sample.json";
			this.settings.widgetInstance.settings.uri.memberReward = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/messages-reward-data-sample.json";
			this.settings.widgetInstance.settings.uri.messageById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/messages-data-sample.json";
			this.settings.widgetInstance.settings.uri.assets = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/images/:attachmentId.png";
			this.settings.widgetInstance.settings.uri.memberCompetitionOptIn = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/competition-opt-in-sample.json";
		};

		widgetSetup.init();

		widgetSetup.settings.widgetInstance.optInMemberToActiveCompetition = function (callback) {
			var _this = this;
			var url = _this.settings.uri.memberCompetitionOptIn.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId).replace(':competitionId', _this.settings.competition.activeCompetitionId);

			widgetSetup.settings.widgetInstance.settings.globalAjax.abort().getData({
				type: 'GET',
				url: _this.settings.uri.gatewayDomain + url,
				headers: {
					'X-API-KEY': _this.settings.apiKey
				},
				success: function (response, dataObj, xhr) {
					if (xhr.status === 200) {


						widgetSetup.settings.widgetInstance.settings.uri.competitionById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/competition-data-sample-opted-in_:id.json";
						widgetSetup.settings.widgetInstance.settings.uri.memberCompetitionById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/competition-data-sample-opted-in_:competitionId.json";

						callback();
					} else {
						_this.log('failed to optInMemberToActiveCompetition ' + response);
					}
				}
			});
		};
		widgetSetup.settings.widgetInstance.init();
	}

































	/**
	 * ********************************
	 * ***** CL Style 2 examples ******
	 * ********************************
	 */
		// CL Style 2 - Basic layout
	var clStyle2BasicLayoutPage = document.querySelector(".cl-style-2-basic-layout");
	if( clStyle2BasicLayoutPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle2BasicLayoutPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-2-default-theme",
			styles: [
				{
					id: "cl-style-2-default-theme",
					name: "Default theme"
				},
				{
					id: "cl-style-2-dark-theme",
					name: "Dark theme"
				},
				{
					id: "cl-style-2-blue-theme",
					name: "Blue theme"
				},
				{
					id: "cl-style-2-green-theme",
					name: "Green theme"
				},
				{
					id: "cl-style-2-grey-theme",
					name: "Grey theme"
				},
				{
					id: "cl-style-2-red-theme",
					name: "Red theme"
				},
				{
					id: "cl-style-2-orange-theme",
					name: "Orange theme"
				},
				{
					id: "cl-style-2-black-theme",
					name: "Black theme"
				}
			]
		});

		widgetSetup.init();
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 2 - Leaderboard layout
	var clStyle2LeaderboardOnlyPage = document.querySelector(".cl-style-2-leaderboard-only");
	if( clStyle2LeaderboardOnlyPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle2LeaderboardOnlyPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-2-default-theme",
			styles: [
				{
					id: "cl-style-2-default-theme",
					name: "Default theme"
				},
				{
					id: "cl-style-2-dark-theme",
					name: "Dark theme"
				},
				{
					id: "cl-style-2-blue-theme",
					name: "Blue theme"
				},
				{
					id: "cl-style-2-green-theme",
					name: "Green theme"
				},
				{
					id: "cl-style-2-grey-theme",
					name: "Grey theme"
				},
				{
					id: "cl-style-2-red-theme",
					name: "Red theme"
				},
				{
					id: "cl-style-2-orange-theme",
					name: "Orange theme"
				},
				{
					id: "cl-style-2-black-theme",
					name: "Black theme"
				}
			],
			defaultSettings: {
				navigation: {
					achievements: {
						enable: false
					},
					rewards: {
						enable: false
					},
					inbox: {
						enable: false
					}
				}
			}
		});
		widgetSetup.init();
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 2 - Navigation menu order
	var clStyle2NavigationMenuOrderPage = document.querySelector(".cl-style-2-navigation-menu-order");
	if( clStyle2NavigationMenuOrderPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle2NavigationMenuOrderPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-2-default-theme",
			styles: [
				{
					id: "cl-style-2-default-theme",
					name: "Default theme"
				},
				{
					id: "cl-style-2-dark-theme",
					name: "Dark theme"
				},
				{
					id: "cl-style-2-blue-theme",
					name: "Blue theme"
				},
				{
					id: "cl-style-2-green-theme",
					name: "Green theme"
				},
				{
					id: "cl-style-2-grey-theme",
					name: "Grey theme"
				},
				{
					id: "cl-style-2-red-theme",
					name: "Red theme"
				},
				{
					id: "cl-style-2-orange-theme",
					name: "Orange theme"
				},
				{
					id: "cl-style-2-black-theme",
					name: "Black theme"
				}
			],
			defaultSettings: {
				navigation: {
					tournaments: {
						order: 2
					},
					achievements: {
						order: 1
					},
					rewards: {
						order: 3
					},
					inbox: {
						order: 4
					}
				}
			}
		});
		widgetSetup.init();
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 2 - Tournament details
	var clStyle2TournamentDetailsPage = document.querySelector(".cl-style-2-tournament-details-page");
	if( clStyle2TournamentDetailsPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle2TournamentDetailsPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-2-default-theme",
			styles: [
				{
					id: "cl-style-2-default-theme",
					name: "Default theme"
				},
				{
					id: "cl-style-2-dark-theme",
					name: "Dark theme"
				},
				{
					id: "cl-style-2-blue-theme",
					name: "Blue theme"
				},
				{
					id: "cl-style-2-green-theme",
					name: "Green theme"
				},
				{
					id: "cl-style-2-grey-theme",
					name: "Grey theme"
				},
				{
					id: "cl-style-2-red-theme",
					name: "Red theme"
				},
				{
					id: "cl-style-2-orange-theme",
					name: "Orange theme"
				},
				{
					id: "cl-style-2-black-theme",
					name: "Black theme"
				}
			],
			defaultSettings: {
				leaderboard: {
					layoutSettings: {
						titleLinkToDetailsPage: true
					}
				}
			}
		});
		widgetSetup.init( function(){
			setTimeout(function (){

				const contentArea = widgetSetup.settings.widgetInstance.settings.mainWidget.settings.container.querySelector(".cl-main-widget-lb-details-content");
				contentArea.style.transition = "background-color 0.3s ease";
				setTimeout(function (){
					contentArea.style.backgroundColor = "rgba(196,114,95, 0.8)";

					setTimeout(function () {
						widgetSetup.settings.widgetInstance.settings.mainWidget.loadCompetitionDetails(function () {});
						contentArea.style.backgroundColor = "";
						contentArea.style.transition = "";
					}, 800);
				}, 50);
			}, 1200);
		} );
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 2 - Vertical MiniScoreboard
	var clStyle2VerticalMiniScoreboardPage = document.querySelector(".cl-style-2-vertical-miniscoreboard");
	if( clStyle2VerticalMiniScoreboardPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle2VerticalMiniScoreboardPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-2-default-theme",
			styles: [
				{
					id: "cl-style-2-default-theme",
					name: "Default theme"
				},
				{
					id: "cl-style-2-dark-theme",
					name: "Dark theme"
				},
				{
					id: "cl-style-2-blue-theme",
					name: "Blue theme"
				},
				{
					id: "cl-style-2-green-theme",
					name: "Green theme"
				},
				{
					id: "cl-style-2-grey-theme",
					name: "Grey theme"
				},
				{
					id: "cl-style-2-red-theme",
					name: "Red theme"
				},
				{
					id: "cl-style-2-orange-theme",
					name: "Orange theme"
				},
				{
					id: "cl-style-2-black-theme",
					name: "Black theme"
				}
			],
			defaultSettings: {
				layout: {
					miniScoreBoardOrientation: 'vertical'
				}
			}
		});
		widgetSetup.animateMiniScoreboardClick = function ( callback ) {};
		widgetSetup.miniScoreboardInitPositioning = function () {
			var _this = this;
			_this.settings.widgetInstance.settings.layout.miniScoreBoardPosition.left = "170px";
			_this.settings.widgetInstance.settings.layout.miniScoreBoardPosition.top = "0px";
		};
		widgetSetup.init();
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 2 - Positioning MiniScoreboard
	var clStyle2PositioningMiniScoreboardPage = document.querySelector(".cl-style-2-positioning-miniscoreboard");
	if( clStyle2PositioningMiniScoreboardPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle2PositioningMiniScoreboardPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-2-default-theme",
			styles: [
				{
					id: "cl-style-2-default-theme",
					name: "Default theme"
				},
				{
					id: "cl-style-2-dark-theme",
					name: "Dark theme"
				},
				{
					id: "cl-style-2-blue-theme",
					name: "Blue theme"
				},
				{
					id: "cl-style-2-green-theme",
					name: "Green theme"
				},
				{
					id: "cl-style-2-grey-theme",
					name: "Grey theme"
				},
				{
					id: "cl-style-2-red-theme",
					name: "Red theme"
				},
				{
					id: "cl-style-2-orange-theme",
					name: "Orange theme"
				},
				{
					id: "cl-style-2-black-theme",
					name: "Black theme"
				}
			],
			defaultSettings: {
				layout: {
					miniScoreBoardPosition: {
						left: "200px",
						top: "200px"
					}
				}
			}
		});
		const clickContainer = document.querySelector(".click-container");
		clickContainer.style.left = "309px";
		clickContainer.style.top = "233px";

		widgetSetup.animateMiniScoreboardClick = function ( callback ) {};
		widgetSetup.init();
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 2 - Languages translation
	var clStyle2LanguagesTranslationPage = document.querySelector(".cl-style-2-languages-translation");
	if( clStyle2LanguagesTranslationPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle2LanguagesTranslationPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-2-default-theme",
			styles: [
				{
					id: "cl-style-2-default-theme",
					name: "Default theme"
				},
				{
					id: "cl-style-2-dark-theme",
					name: "Dark theme"
				},
				{
					id: "cl-style-2-blue-theme",
					name: "Blue theme"
				},
				{
					id: "cl-style-2-green-theme",
					name: "Green theme"
				},
				{
					id: "cl-style-2-grey-theme",
					name: "Grey theme"
				},
				{
					id: "cl-style-2-red-theme",
					name: "Red theme"
				},
				{
					id: "cl-style-2-orange-theme",
					name: "Orange theme"
				},
				{
					id: "cl-style-2-black-theme",
					name: "Black theme"
				},
				{
					id: "cl-language-select",
					name: "Select language",
					data: [{
						key: 'cs',
						label: "Czech [CS]"
					}, {
						key: 'da',
						label: "Danish [DA]"
					}, {
						key: 'de',
						label: "German [DE]"
					}, {
						key: 'en',
						label: "English [EN]"
					}, {
						key: 'es',
						label: "Spanish [ES]"
					}, {
						key: 'fi',
						label: "Finnish [FI]"
					}, {
						key: 'fr',
						label: "French [FR]"
					}, {
						key: 'hr',
						label: "Croatian [HR]"
					}, {
						key: 'it',
						label: "Italian [IT]"
					}, {
						key: 'ja',
						label: "Japanese [JA]",
						selected: true
					}, {
						key: 'ko',
						label: "Korean [KO]"
					}, {
						key: 'lt',
						label: "Lithuanian [LT]"
					}, {
						key: 'lv',
						label: "Latvian [LV]"
					}, {
						key: 'no',
						label: "Norwegian [NO]"
					}, {
						key: 'pl',
						label: "Polish [PL]"
					}, {
						key: 'pt',
						label: "Portuguese [PT]"
					}, {
						key: 'ro',
						label: "Romanian [RO]"
					}, {
						key: 'ru',
						label: "Russian [RU]"
					}, {
						key: 'th',
						label: "Thai [TH]"
					}, {
						key: 'uk',
						label: "Ukrainian [UK]"
					}, {
						key: 'vi',
						label: "Vietnamese [VI]"
					}, {
						key: 'zh',
						label: "Chinese - Simplified [ZH]"
					}, {
						key: 'zh_TW',
						label: "Chinese - Traditional [zh_TW]"
					}]
				}
			],
			defaultSettings: {
				language: "ja",
				uri: {
					translationPath: "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/build/i18n/translation_:language.json"
				}
			}
		});

		widgetSetup.demoData = function ( lang ) {
			// lookup services override
			const language = (lang === "ja") ? lang + "/" : "";
			this.settings.widgetInstance.settings.uri.gatewayDomain = "";
			this.settings.widgetInstance.settings.uri.members = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/member-data-sample.json";
			this.settings.widgetInstance.settings.uri.competitions = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "competition-list-data-sample.json";
			this.settings.widgetInstance.settings.uri.competitionById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "competition-data-sample_:id.json";
			this.settings.widgetInstance.settings.uri.memberCompetitions = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "competition-list-data-sample.json";
			this.settings.widgetInstance.settings.uri.memberCompetitionById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "competition-data-sample_:competitionId.json";
			this.settings.widgetInstance.settings.uri.contestLeaderboard = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/leaderboard-data.json";
			this.settings.widgetInstance.settings.uri.achievements = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "achievements-list-data-sample.json";
			this.settings.widgetInstance.settings.uri.achievement = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "achievements-data-sample_id:id.json";
			this.settings.widgetInstance.settings.uri.achievementsProgression = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-list-perc-data-sample.json";
			this.settings.widgetInstance.settings.uri.achievementsIssued = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-list-issued-data-sample.json";
			this.settings.widgetInstance.settings.uri.messages = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "messages-claimed-data-sample.json";
			this.settings.widgetInstance.settings.uri.memberReward = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "messages-reward-data-sample.json";
			this.settings.widgetInstance.settings.uri.messageById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/" + language + "messages-data-sample.json";
			this.settings.widgetInstance.settings.uri.assets = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/images/:attachmentId.png";
			this.settings.widgetInstance.settings.uri.memberCompetitionOptIn = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/competition-opt-in-sample.json";
		};

		widgetSetup.init();
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 2 - Lock orientation
	var clStyle2LockOrientationPage = document.querySelector(".cl-style-2-lock-orientation");
	if( clStyle2LockOrientationPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle2LockOrientationPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-2-default-theme",
			styles: [
				{
					id: "cl-style-2-default-theme",
					name: "Default theme"
				},
				{
					id: "cl-style-2-dark-theme",
					name: "Dark theme"
				},
				{
					id: "cl-style-2-blue-theme",
					name: "Blue theme"
				},
				{
					id: "cl-style-2-green-theme",
					name: "Green theme"
				},
				{
					id: "cl-style-2-grey-theme",
					name: "Grey theme"
				},
				{
					id: "cl-style-2-red-theme",
					name: "Red theme"
				},
				{
					id: "cl-style-2-orange-theme",
					name: "Orange theme"
				},
				{
					id: "cl-style-2-black-theme",
					name: "Black theme"
				}
			],
			defaultSettings: {
				layout: {
					allowOrientationChange: false
				}
			}
		});

		widgetSetup.animateMiniScoreboardClick = function ( callback ) {};
		widgetSetup.init();
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 2 - Disable dragging
	var clStyle2DisableDraggingPage = document.querySelector(".cl-style-2-disable-dragging");
	if( clStyle2DisableDraggingPage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle2DisableDraggingPage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-2-default-theme",
			styles: [
				{
					id: "cl-style-2-default-theme",
					name: "Default theme"
				},
				{
					id: "cl-style-2-dark-theme",
					name: "Dark theme"
				},
				{
					id: "cl-style-2-blue-theme",
					name: "Blue theme"
				},
				{
					id: "cl-style-2-green-theme",
					name: "Green theme"
				},
				{
					id: "cl-style-2-grey-theme",
					name: "Grey theme"
				},
				{
					id: "cl-style-2-red-theme",
					name: "Red theme"
				},
				{
					id: "cl-style-2-orange-theme",
					name: "Orange theme"
				},
				{
					id: "cl-style-2-black-theme",
					name: "Black theme"
				}
			],
			defaultSettings: {
				layout: {
					enableMiniScoreBoardDragging: false
				}
			}
		});

		widgetSetup.animateMiniScoreboardClick = function ( callback ) {};
		widgetSetup.init();
		widgetSetup.settings.widgetInstance.init();
	}

	// CL Style 2 - Opt-in example
	var clStyle2OptInExamplePage = document.querySelector(".cl-style-2-opt-in-example");
	if( clStyle2OptInExamplePage !== null ) {
		var widgetSetup = new WidgetSetup({
			container: clStyle2OptInExamplePage,
			widgetInnerContainer: document.querySelector(".widget-inner-container"),
			activeStyle: "cl-style-2-default-theme",
			styles: [
				{
					id: "cl-style-2-default-theme",
					name: "Default theme"
				},
				{
					id: "cl-style-2-dark-theme",
					name: "Dark theme"
				},
				{
					id: "cl-style-2-blue-theme",
					name: "Blue theme"
				},
				{
					id: "cl-style-2-green-theme",
					name: "Green theme"
				},
				{
					id: "cl-style-2-grey-theme",
					name: "Grey theme"
				},
				{
					id: "cl-style-2-red-theme",
					name: "Red theme"
				},
				{
					id: "cl-style-2-orange-theme",
					name: "Orange theme"
				},
				{
					id: "cl-style-2-black-theme",
					name: "Black theme"
				}
			],
			defaultSettings: {

			}
		});

		widgetSetup.animateMiniScoreboardClick = function ( callback ) {};
		widgetSetup.demoData = function () {
			// lookup services override
			this.settings.widgetInstance.settings.uri.gatewayDomain = "";
			this.settings.widgetInstance.settings.uri.members = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/member-data-sample.json";
			this.settings.widgetInstance.settings.uri.competitions = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/competition-list-data-sample.json";
			this.settings.widgetInstance.settings.uri.competitionById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/competition-data-sample-opt-in_:id.json";
			this.settings.widgetInstance.settings.uri.memberCompetitions = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/competition-list-data-sample.json";
			this.settings.widgetInstance.settings.uri.memberCompetitionById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/competition-data-sample-opt-in_:competitionId.json";
			this.settings.widgetInstance.settings.uri.contestLeaderboard = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/leaderboard-data.json";
			this.settings.widgetInstance.settings.uri.achievements = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-list-data-sample.json";
			this.settings.widgetInstance.settings.uri.achievement = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-data-sample.json";
			this.settings.widgetInstance.settings.uri.achievementsProgression = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-list-perc-data-sample.json";
			this.settings.widgetInstance.settings.uri.achievementsIssued = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-list-issued-data-sample.json";
			this.settings.widgetInstance.settings.uri.messages = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/messages-claimed-data-sample.json";
			this.settings.widgetInstance.settings.uri.memberReward = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/messages-reward-data-sample.json";
			this.settings.widgetInstance.settings.uri.messageById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/messages-data-sample.json";
			this.settings.widgetInstance.settings.uri.assets = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/images/:attachmentId.png";
			this.settings.widgetInstance.settings.uri.memberCompetitionOptIn = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/competition-opt-in-sample.json";
		};

		widgetSetup.init();

		widgetSetup.settings.widgetInstance.optInMemberToActiveCompetition = function (callback) {
			var _this = this;
			var url = _this.settings.uri.memberCompetitionOptIn.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId).replace(':competitionId', _this.settings.competition.activeCompetitionId);

			widgetSetup.settings.widgetInstance.settings.globalAjax.abort().getData({
				type: 'GET',
				url: _this.settings.uri.gatewayDomain + url,
				headers: {
					'X-API-KEY': _this.settings.apiKey
				},
				success: function (response, dataObj, xhr) {
					if (xhr.status === 200) {


						widgetSetup.settings.widgetInstance.settings.uri.competitionById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/competition-data-sample-opted-in_:id.json";
						widgetSetup.settings.widgetInstance.settings.uri.memberCompetitionById = "https://s3-eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/competition-data-sample-opted-in_:competitionId.json";

						callback();
					} else {
						_this.log('failed to optInMemberToActiveCompetition ' + response);
					}
				}
			});
		};
		widgetSetup.settings.widgetInstance.init();
	}

})();
