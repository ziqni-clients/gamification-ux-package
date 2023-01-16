import 'regenerator-runtime/runtime';
import Identicon from 'identicon.js';
import jsSHA from 'jssha';
import cssVars from 'css-vars-ponyfill';

import mergeObjects from '../utils/mergeObjects';
import mapObject from '../utils/mapObject';
import formatNumberLeadingZeros from '../utils/formatNumberLeadingZeros';
import stringContains from '../utils/stringContains';
import objectIterator from '../utils/objectIterator';
import query from '../utils/query';
import hasClass from '../utils/hasClass';
import addClass from '../utils/addClass';
import removeClass from '../utils/removeClass';
import closest from '../utils/closest';
import isMobileTablet from '../utils/isMobileTablet';
import camelToKebabCase from '../utils/camelToKebabCase';

import cLabs from './cLabs';
import './Ajax';

import { Notifications } from './Notifications';
import { MiniScoreBoard } from './MiniScoreBoard';
import { MainWidget } from './MainWidget';
import { CanvasAnimation } from './CanvasAnimation';

import {
  AchievementRequest,
  AchievementsApiWs,
  ApiClientStomp,
  CompetitionRequest,
  CompetitionsApiWs,
  ContestRequest,
  ContestsApiWs,
  ManageOptinRequest,
  MemberRequest,
  MembersApiWs,
  OptInApiWs,
  OptInStatesRequest,
  RewardsApiWs,
  LeaderboardApiWs,
  LeaderboardSubscriptionRequest,
  MessagesApiWs,
  AwardsApiWs,
  AwardRequest,
  ClaimAwardRequest
} from '@ziqni-tech/member-api-client';

const translation = require(`../../i18n/translation_${process.env.LANG}.json`);

/**
 * Main leaderboard widget, controls all actions and initiation logic.
 * Main responsibility is to control the interactions between different widgets/plugins and user even actions
 * @param options {Object} setting parameters used to overwrite the default settings
 * @constructor
 */
export const LbWidget = function (options) {
  this.apiClientStomp = null;

  /**
   * LbWidget settings
   * @memberOf LbWidget
   * @constant
   * @type { Object }
   */
  this.settings = {
    debug: true,
    bindContainer: document.body,
    autoStart: true,
    sseMessaging: null,
    notifications: null,
    miniScoreBoard: null,
    canvasAnimation: null,
    enableNotifications: false,
    mainWidget: null,
    globalAjax: new cLabs.Ajax(),
    checkAjax: new cLabs.Ajax(),
    language: process.env.LANG,
    currency: '',
    spaceName: '',
    memberId: '',
    memberRefId: '',
    apiClientStomp: null,
    authToken: null,
    memberNameLength: 0,
    groups: '',
    gameId: '',
    enforceGameLookup: false, // tournament lookup will include/exclude game only requests
    apiKey: '',
    expires: 36000000,
    member: null,
    itemsPerPage: 10,
    layout: {
      enableMiniScoreBoardDragging: true, // enable/disable dragging with mouse/touch
      miniScoreBoardPosition: { // default position of mini scoreboard left/right/bottom/top (Example: top: '20px')
        left: null,
        right: null,
        top: null,
        bottom: null
      },
      allowOrientationChange: true, // allows the switch between horizontal/vertical orientation
      miniScoreBoardOrientation: 'horizontal' // vertical/horizontal => default is horizontal
    },
    competition: {
      activeCompetitionId: null,
      activeContestId: null,
      activeCompetition: null,
      activeContest: null,
      refreshInterval: null,
      refreshIntervalMillis: 1000000,
      allowNegativeCountdown: false, // false: will mark competition as finishing, true: will continue to countdown into negative
      includeMetadata: false,
      extractImageHeader: true // will extract the first found image inside the body tag and move it on top
    },
    achievements: {
      activeAchievementId: null,
      limit: 100,
      totalCount: 0,
      list: [],
      availableRewards: [],
      rewards: [],
      expiredRewards: [],
      extractImageHeader: true // will extract the first found image inside the body tag and move it on top
    },
    rewards: {
      availableRewards: [],
      rewards: [],
      totalCount: 0,
      expiredRewards: [],
      rewardFormatter: function (reward) {
        let defaultRewardValue = Number.isInteger(reward.rewardValue) ? reward.rewardValue : reward.rewardValue.toFixed(6);

        if (typeof reward.unitOfMeasure !== 'undefined' && typeof reward.unitOfMeasure.symbol !== 'undefined' && reward.unitOfMeasure.symbol !== null) {
          defaultRewardValue = reward.unitOfMeasure.symbol + reward.value;
        }

        return defaultRewardValue;
      }
    },
    awards: {
      availableAwards: [],
      claimedAwards: [],
      rewards: [],
      totalCount: 0
    },
    messages: {
      messages: [],
      totalCount: 0
    },
    tournaments: {
      activeCompetitionId: null,
      readyCompetitions: [], // statusCode 3
      activeCompetitions: [], // statusCode 5
      finishedCompetitions: [] // statusCode 7
    },
    leaderboard: {
      fullLeaderboardSize: 100,
      refreshIntervalMillis: 1000000,
      refreshInterval: null,
      refreshLbDataInterval: null,
      leaderboardData: [],
      loadLeaderboardHistory: {},
      layoutSettings: {
        // tournamentList: true,
        imageBanner: true,
        // title: true,
        titleLinkToDetailsPage: false // if set to false will make the description available under title
      },
      miniScoreBoard: {
        enableRankings: true, // enabled rankings before after rankings of members [-2 YOU +2]
        rankingsCount: 2
      },
      pointsFormatter: function (points) {
        return points;
      }
    },
    navigation: { // primary navigation items, if all are disabled init will fail, if only 1 is enabled items will be hidden
      tournaments: {
        enable: true,
        navigationClass: 'cl-main-widget-navigation-lb',
        navigationClassIcon: 'cl-main-widget-navigation-lb-icon',
        containerClass: 'cl-main-widget-lb',
        order: 1
      },
      achievements: {
        enable: true,
        navigationClass: 'cl-main-widget-navigation-ach',
        navigationClassIcon: 'cl-main-widget-navigation-ach-icon',
        containerClass: 'cl-main-widget-section-ach',
        order: 2
      },
      rewards: {
        enable: true,
        navigationClass: 'cl-main-widget-navigation-rewards',
        navigationClassIcon: 'cl-main-widget-navigation-rewards-icon',
        containerClass: 'cl-main-widget-section-reward',
        order: 3
      },
      inbox: {
        enable: true,
        navigationClass: 'cl-main-widget-navigation-inbox',
        navigationClassIcon: 'cl-main-widget-navigation-inbox-icon',
        containerClass: 'cl-main-widget-section-inbox',
        order: 4
      }
    },
    apiWs: {
      achievementsApiWsClient: null,
      leaderboardApiWsClient: null,
      competitionsApiWsClient: null,
      contestsApiWsClient: null,
      membersApiWsClient: null,
      optInApiWsClient: null,
      rewardsApiWsClient: null,
      awardsApiWsClient: null,
      messagesApiWsClient: null
    },
    uri: {
      gatewayDomain: cLabs.api.url,

      // members: '/api/v1/:space/members/reference/:id',
      assets: '/assets/attachments/:attachmentId',

      memberSSE: '/api/v1/:space/sse/reference/:id',
      memberSSEHeartbeat: '/api/v1/:space/sse/reference/:id/heartbeat',

      // competitions: '/api/v1/:space/competitions',
      // competitionById: '/api/v1/:space/competitions/:id',
      // contestLeaderboard: '/api/v1/:space/contests/:id/leaderboard',

      // achievement: '/api/v1/:space/achievements/:id',
      // achievements: '/api/v1/:space/achievements/members/reference/:id',
      achievementsProgression: '/api/v1/:space/members/reference/:id/achievements',
      // achievementsIssued: '/api/v1/:space/members/reference/:id/achievements/issued',
      // /api/v1/:space/members/reference/:id/competition/:competitionId

      // messages: '/api/v1/:space/members/reference/:id/messages',
      // messageById: '/api/v1/:space/members/reference/:id/messages/:messageId',

      // memberReward: '/api/v1/:space/members/reference/:id/award/:awardId',
      memberRewardClaim: '/api/v1/:space/members/reference/:id/award/:awardId/award',

      // memberCompetitions: '/api/v1/:space/members/reference/:id/competitions',
      // memberCompetitionById: '/api/v1/:space/members/reference/:id/competition/:competitionId',
      memberCompetitionOptIn: '/api/v1/:space/members/reference/:id/competition/:competitionId/optin',
      memberCompetitionOptInCheck: '/api/v1/:space/members/reference/:id/competition/:competitionId/optin-check',

      translationPath: '' // ../i18n/translation_:language.json
    },
    loadTranslations: true,
    showCopyright: true,
    translation: translation,
    resources: [], // Example: ["http://example.com/style.css", "http://example.com/my-fonts.css"]
    styles: null, // Example: {widgetBgColor: '#1f294a', widgetIcon: 'url(../../../examples/images/logo-icon-3.png)'}
    partialFunctions: {
      uri: {
        availableCompetitionsListParameters: function (filter) {
          return filter;
        },
        finishedCompetitionsListParameters: function (filter) {
          return filter;
        },
        competitionByIdParameters: function (filter) {
          return filter;
        },
        leaderboardParameters: function (filter) {
          return filter;
        },
        achievementsAvailableForAllListParameters: function (filter) {
          return filter;
        },
        achievementsForMemberListParameters: function (filter) {
          return filter;
        },
        achievementByIdParameters: function (filter) {
          return filter;
        },
        claimedRewardsListParameters: function (filter) {
          return filter;
        },
        notClaimedRewardsListParameters: function (filter) {
          return filter;
        },
        expiredRewardsListParameters: function (filter) {
          return filter;
        },
        availableMessagesListParameters: function (filter) {
          return filter;
        }
      },
      startupCallback: function (instance) {},
      rewardFormatter: function (reward) {
        let defaultRewardValue = Number.isInteger(reward.rewardValue)
          ? reward.rewardValue
          : reward.rewardValue.toFixed(6);

        if (typeof reward.unitOfMeasure !== 'undefined' && typeof reward.unitOfMeasure.symbol !== 'undefined' && reward.unitOfMeasure.symbol !== null) {
          defaultRewardValue = reward.unitOfMeasure.symbol + reward.value;
        }

        return defaultRewardValue;
      },
      competitionDataAvailableResponseParser: function (competitionData, callback) { callback(competitionData); },
      competitionDataFinishedResponseParser: function (competitionData, callback) { callback(competitionData); },
      activeCompetitionDataResponseParser: function (competitionData, callback) { callback(competitionData); },
      activeContestDataResponseParser: function (contestData, callback) { callback(contestData); },
      leaderboardDataResponseParser: function (leaderboardData, callback) { callback(leaderboardData); },
      achievementDataForAllResponseParser: function (achievementData, callback) { callback(achievementData); },
      achievementDataForMemberGroupResponseParser: function (achievementData, callback) { callback(achievementData); },
      achievementDataResponseParser: function (achievementData, callback) { callback(achievementData); },
      rewardDataResponseParser: function (rewardData, callback) { callback(rewardData); },
      messageDataResponseParser: function (messageData, callback) { callback(messageData); },
      claimRewardDataResponseParser: function (claimRewardData, callback) { callback(claimRewardData); },
      issuedAchievementsDataResponseParser: function (issuedAchievementsData, callback) { callback(issuedAchievementsData); },
      memberAchievementsProgressionDataResponseParser: function (memberAchievementsProgressionData, callback) { callback(memberAchievementsProgressionData); },
      claimedRewardsDataResponseParser: function (claimedRewardsData, callback) { callback(claimedRewardsData); },
      notClaimedRewardsDataResponseParser: function (notClaimedRewardsData, callback) { callback(notClaimedRewardsData); },
      expiredRewardsDataResponseParser: function (expiredRewardsData, callback) { callback(expiredRewardsData); },
      availableMessagesDataResponseParser: function (availableMessagesData, callback) { callback(availableMessagesData); }
    },
    callback: null
  };

  if (typeof options !== 'undefined') {
    this.settings = mergeObjects(this.settings, options);
  }

  // alias references to modules
  this.CanvasAnimation = CanvasAnimation;
  this.Notifications = Notifications;
  this.MiniScoreBoard = MiniScoreBoard;
  this.MainWidget = MainWidget;

  this.log = function (message) {
    if (this.settings.debug) {
      console.error(message);
    }
  };

  /**
   * Format duration of Date Time from moment() object
   * @memberOf LbWidget
   * @param duration {moment}
   * @returns {string}
   */
  this.formatDateTime = function (duration) {
    var _this = this;
    var largeResult = [];
    var result = [];
    if (duration.days()) largeResult.push(duration.days() + '<span class="time-ind">' + _this.settings.translation.time.days + '</span>');
    if (duration.hours() || duration.days() > 0) {
      result.push(formatNumberLeadingZeros(duration.hours(), 2) + '<span class="time-ind">' + _this.settings.translation.time.hours + '</span>');
    } else result.push('00<span class="time-ind">' + _this.settings.translation.time.hours + '</span>');
    if (duration.minutes() || duration.hours() > 0 || duration.days() > 0) {
      result.push(formatNumberLeadingZeros(duration.minutes(), 2) + ((duration.days() > 0) ? '<span class="time-ind">' + _this.settings.translation.time.minutes + '</span>' : '<span class="time-ind">' + _this.settings.translation.time.minutesShortHand + '</span>'));
    } else (result.push('00' + ((duration.days() > 0) ? '<span class="time-ind">' + _this.settings.translation.time.minutes + '</span>' : '<span class="time-ind">' + _this.settings.translation.time.minutesShortHand + '</span>')));
    // if (duration.seconds() && duration.days() === 0){ result.push( formatNumberLeadingZeros(duration.seconds(), 2) + '<span class="time-ind">s</span>' ) }else if(duration.days() === 0){result.push( '00<span class="time-ind">s</span>' )};
    result.push(formatNumberLeadingZeros(duration.seconds(), 2) + '<span class="time-ind">' + _this.settings.translation.time.seconds + '</span>');
    return (largeResult.length > 0) ? (largeResult.join(' ') + ' ' + result.join(':')) : result.join(':');
  };

  this.populateIdenticonBase64Image = function (str) {
    if (str.length > 0) {
      /* eslint new-cap: "off" */
      var shaObj = new jsSHA('SHA-512', 'TEXT');
      shaObj.update(str);
      var hash = shaObj.getHash('HEX', 1);

      /**
       * for IE 11 comment out the lines above and use this code with the jsSHA library inside utils
       * import jsSHA from '../utils/jsSHA';
      var shaObj = new jsSHA(str, 'TEXT');
      var hash = shaObj.getHash('SHA-512', 'HEX', 1);
      */

      var data = new Identicon(hash, {
        background: [255, 255, 255, 255], // rgba white
        margin: 0.1, // 20% margin
        size: 22, // 420px square
        format: 'svg' // use SVG instead of PNG
      }).toString();

      var icon = 'data:image/svg+xml;base64,' + data;

      return icon;
    } else {
      return '';
    }
  };

  /**
   * get a list of available competition filtered by provided global criteria
   * @param callback {Function}
   */
  // const competitionCheckAjax = new cLabs.Ajax();

  this.checkForAvailableCompetitions = async function (callback) {
    const readyCompetitionRequest = CompetitionRequest.constructFromObject({
      competitionFilter: {
        statusCode: {
          moreThan: 10,
          lessThan: 20
        },
        sortBy: [{
          queryField: 'created',
          order: 'Desc'
        }],
        limit: 20,
        skip: 0
      }
    }, null);

    const activeCompetitionRequest = CompetitionRequest.constructFromObject({
      competitionFilter: {
        statusCode: {
          moreThan: 20,
          lessThan: 30
        },
        sortBy: [{
          queryField: 'created',
          order: 'Desc'
        }],
        limit: 20,
        skip: 0
      }
    }, null);

    const finishedCompetitionRequest = CompetitionRequest.constructFromObject({
      competitionFilter: {
        statusCode: {
          moreThan: 30,
          lessThan: 50
        },
        sortBy: [{
          queryField: 'created',
          order: 'Desc'
        }],
        limit: 20,
        skip: 0
      }
    }, null);

    // this.getCompetitionsApi(readyCompetitionRequest)
    //   .then(data => {
    //     this.settings.tournaments.readyCompetitions = data;
    //   })
    //   .catch(error => this.log(error));
    //
    // this.getCompetitionsApi(activeCompetitionRequest)
    //   .then(data => {
    //     this.settings.tournaments.activeCompetitions = data;
    //   })
    //   .catch(error => this.log(error));
    //
    // this.getCompetitionsApi(finishedCompetitionRequest)
    //   .then(data => {
    //     this.settings.tournaments.finishedCompetitions = data;
    //   })
    //   .catch(error => this.log(error));
    this.settings.tournaments.readyCompetitions = await this.getCompetitionsApi(readyCompetitionRequest);
    this.settings.tournaments.activeCompetitions = await this.getCompetitionsApi(activeCompetitionRequest);
    this.settings.tournaments.finishedCompetitions = await this.getCompetitionsApi(finishedCompetitionRequest);

    if (typeof callback === 'function') {
      callback();
    }

    // var filters = [
    //   'statusCode>==3',
    //   'statusCode<==5',
    //   '_sortByFields=options.scheduledDates.end:desc',
    //   ('_lang=' + _this.settings.language),
    //   '_limit=999'
    // ];
    // var ajaxInstanceToUse = (typeof ajaxInstance !== 'undefined' && ajaxInstance !== null) ? ajaxInstance : competitionCheckAjax;
    //
    // if (typeof _this.settings.currency === 'string' && _this.settings.currency.length > 0) {
    //   filters.push('_uomKey=' + _this.settings.currency);
    // }
    //
    // if (_this.settings.gameId.length > 0 && _this.settings.enforceGameLookup) {
    //   filters.push('options.products.productRefId=' + _this.settings.gameId);
    // }
    //
    // if (_this.settings.groups.length > 0 && _this.settings.memberId.length === 0) {
    //   filters.push('options.limitEntrantsTo=' + _this.settings.groups);
    // }
    //
    // filters = _this.settings.partialFunctions.uri.availableCompetitionsListParameters(filters);
    //
    // ajaxInstanceToUse.abort().getData({
    //   type: 'GET',
    //   url: _this.settings.uri.gatewayDomain + url + ((filters.length > 0) ? '?' + filters.join('&') : ''),
    //   headers: {
    //     'X-API-KEY': _this.settings.apiKey
    //   },
    //   success: function (response, dataObj, xhr) {
    //     if (xhr.status === 200) {
    //       var json = JSON.parse(response);
    //
    //       _this.settings.partialFunctions.competitionDataAvailableResponseParser(json.data, function (compData) {
    //         _this.settings.tournaments.readyCompetitions = [];
    //         _this.settings.tournaments.activeCompetitions = [];
    //
    //         mapObject(compData, function (comp) {
    //           if (comp.statusCode === 3) {
    //             _this.settings.tournaments.readyCompetitions.push(comp);
    //           } else if (comp.statusCode === 5) {
    //             _this.settings.tournaments.activeCompetitions.push(comp);
    //           }
    //         });
    //
    //         _this.checkForFinishedCompetitions(callback, ajaxInstance);
    //       });
    //     } else {
    //       _this.log('failed to checkForActiveCompetitions ' + response);
    //     }
    //   }
    // });
  };

  this.getCompetitionsApi = async (competitionRequest) => {
    if (!this.settings.apiWs.competitionsApiWsClient) {
      this.settings.apiWs.competitionsApiWsClient = new CompetitionsApiWs(this.apiClientStomp);
    }
    return new Promise((resolve, reject) => {
      this.settings.apiWs.competitionsApiWsClient.getCompetitions(competitionRequest, (json) => {
        resolve(json.data);
      });
    });
  };

  /**
   * get a list of finished competition filtered by provided global criteria
   * @param callback {Function}
   */
  // const competitionFinishedCheckAjax = new cLabs.Ajax();

  // this.checkForFinishedCompetitions = function (callback, ajaxInstance) {
  //   var _this = this;
  //   var url = (_this.settings.memberId.length === 0) ? (
  //     _this.settings.uri.competitions.replace(':space', _this.settings.spaceName)
  //   ) : (
  //     _this.settings.uri.memberCompetitions.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId)
  //   );
  //   var filters = [
  //     'statusCode=7',
  //     '_limit=10',
  //     '_sortByFields=options.scheduledDates.end:desc',
  //     ('_lang=' + _this.settings.language)
  //   ];
  //   var ajaxInstanceToUse = (typeof ajaxInstance !== 'undefined' && ajaxInstance !== null) ? ajaxInstance : competitionFinishedCheckAjax;
  //
  //   if (typeof _this.settings.currency === 'string' && _this.settings.currency.length > 0) {
  //     filters.push('_uomKey=' + _this.settings.currency);
  //   }
  //
  //   if (_this.settings.gameId.length > 0 && _this.settings.enforceGameLookup) {
  //     filters.push('options.products.productRefId=' + _this.settings.gameId);
  //   }
  //
  //   if (_this.settings.groups.length > 0 && _this.settings.memberId.length === 0) {
  //     filters.push('options.limitEntrantsTo=' + _this.settings.groups);
  //   }
  //
  //   filters = _this.settings.partialFunctions.uri.finishedCompetitionsListParameters(filters);
  //
  //   ajaxInstanceToUse.abort().getData({
  //     type: 'GET',
  //     url: _this.settings.uri.gatewayDomain + url + ((filters.length > 0) ? '?' + filters.join('&') : ''),
  //     headers: {
  //       'X-API-KEY': _this.settings.apiKey
  //     },
  //     success: function (response, dataObj, xhr) {
  //       if (xhr.status === 200) {
  //         var json = JSON.parse(response);
  //
  //         _this.settings.partialFunctions.competitionDataFinishedResponseParser(json.data, function (compData) {
  //           _this.settings.tournaments.finishedCompetitions = [];
  //
  //           mapObject(compData, function (comp) {
  //             if (comp.statusCode === 7) {
  //               _this.settings.tournaments.finishedCompetitions.push(comp);
  //             }
  //           });
  //
  //           if (typeof callback === 'function') {
  //             callback();
  //           }
  //         });
  //       } else {
  //         _this.log('failed to checkForActiveCompetitions ' + response);
  //       }
  //     }
  //   });
  // };

  this.prepareActiveCompetition = async function (callback) {
    const _this = this;
    let activeCompetition = null;
    let activeCompetitionId = null;

    if (_this.settings.tournaments.activeCompetitionId !== null) {
      mapObject(_this.settings.tournaments.activeCompetitions, function (comp) {
        if (comp.id === _this.settings.tournaments.activeCompetitionId) {
          activeCompetition = comp;
        }
      });
      mapObject(_this.settings.tournaments.readyCompetitions, function (comp) {
        if (comp.id === _this.settings.tournaments.activeCompetitionId) {
          activeCompetition = comp;
        }
      });
      mapObject(_this.settings.tournaments.finishedCompetitions, function (comp) {
        if (comp.id === _this.settings.tournaments.activeCompetitionId) {
          activeCompetition = comp;
        }
      });

      if (activeCompetition !== null) {
        activeCompetitionId = _this.settings.tournaments.activeCompetitionId;
      } else {
        _this.settings.tournaments.activeCompetitionId = null;
      }
    }

    if (activeCompetition === null && _this.settings.tournaments.activeCompetitions.length > 0) {
      activeCompetition = _this.settings.tournaments.activeCompetitions[0];
      activeCompetitionId = activeCompetition.id;
    } else if (activeCompetition === null && _this.settings.tournaments.readyCompetitions.length > 0) {
      activeCompetition = _this.settings.tournaments.readyCompetitions[0];
      activeCompetitionId = activeCompetition.id;
    }

    if (activeCompetitionId === null) { // no active or ready competitions found
      _this.deactivateCompetitionsAndLeaderboards();
    } else {
      if (_this.settings.competition.activeCompetitionId !== activeCompetitionId && activeCompetitionId !== null) {
        _this.settings.competition.activeCompetition = activeCompetition;
        _this.settings.competition.activeCompetitionId = activeCompetitionId;
      }

      if (activeCompetitionId !== null) {
        _this.loadActiveCompetition(async function (json) {
          await _this.setActiveCompetition(json, callback);
        });
      } else if (typeof callback === 'function') {
        callback();
      }
    }
  };

  this.loadActiveCompetition = function (callback) {
    const availableCompetitions = [
      ...this.settings.tournaments.activeCompetitions,
      ...this.settings.tournaments.readyCompetitions,
      ...this.settings.tournaments.finishedCompetitions
    ];

    const competition = availableCompetitions.filter(c => {
      return c.id === this.settings.competition.activeCompetitionId;
    });

    this.settings.partialFunctions.activeCompetitionDataResponseParser(competition, function (compData) {
      if (typeof callback === 'function') {
        callback(compData);
      }
    });
    // var _this = this;
    // var url = (_this.settings.memberId.length === 0) ? (
    //   _this.settings.uri.competitionById.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.competition.activeCompetitionId)
    // ) : (
    //   _this.settings.uri.memberCompetitionById.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId).replace(':competitionId', _this.settings.competition.activeCompetitionId)
    // );
    // var filters = [
    //   ('_include=strategy' + (_this.settings.competition.includeMetadata ? ',metadata' : '')),
    //   ('_lang=' + _this.settings.language)
    // ];
    //
    // if (typeof _this.settings.currency === 'string' && _this.settings.currency.length > 0) {
    //   filters.push('_uomKey=' + _this.settings.currency);
    // }
    //
    // filters = _this.settings.partialFunctions.uri.competitionByIdParameters(filters);
    //
    // _this.settings.globalAjax.abort().getData({
    //   type: 'GET',
    //   url: _this.settings.uri.gatewayDomain + url + ((filters.length > 0) ? '?' + filters.join('&') : ''),
    //   headers: {
    //     'X-API-KEY': _this.settings.apiKey
    //   },
    //   success: function (response, dataObj, xhr) {
    //     if (xhr.status === 200) {
    //       var json = JSON.parse(response);
    //
    //       _this.settings.partialFunctions.activeCompetitionDataResponseParser(json, function (compData) {
    //         if (typeof callback === 'function') {
    //           callback(compData);
    //         }
    //       });
    //     } else {
    //       _this.log('failed to loadActiveCompetition ' + response);
    //     }
    //   }
    // });
  };

  this.setActiveCompetition = async function (json, callback) {
    this.settings.competition.activeCompetition = json[0];
    this.settings.competition.activeContest = null;
    this.settings.competition.activeContestId = null;

    const contestRequest = ContestRequest.constructFromObject({
      contestFilter: {
        productIds: [],
        tags: [],
        startDate: null,
        endDate: null,
        sortBy: [],
        ids: [],
        competitionIds: [json[0].id],
        statusCode: {
          moreThan: 0,
          lessThan: 100
        },
        constraints: [],
        limit: 10,
        skip: 0
      }
    }, null);

    const contests = await this.getContests(contestRequest);

    if (contests.length) {
      contests.forEach(contest => {
        if (contest.statusCode < 30 && this.settings.competition.activeContest === null) {
          this.settings.competition.activeContest = contest;
          this.settings.competition.activeContestId = contest.id;

          if (typeof this.settings.competition.activeContest.rewards === 'undefined') {
            this.settings.competition.activeContest.rewards = [];
          }
        }
      });
    }

    if (typeof callback === 'function') {
      callback();
    }

    this.settings.mainWidget.leaderboardDetailsUpdate();

    // if (isLeaderboardUpdate) {
    //   this.settings.mainWidget.leaderboardDetailsUpdate();
    // }

    // if (json.data && json.data.contests && typeof json.data.contests !== 'undefined' && json.data.contests.length > 0) {
    //   _this.settings.partialFunctions.activeContestDataResponseParser(json.data.contests, function (contests) {
    //     mapObject(contests, function (contest) {
    //       if (contest.statusCode < 7 && _this.settings.competition.activeContest === null) {
    //         _this.settings.competition.activeContest = contest;
    //         _this.settings.competition.activeContestId = contest.id;
    //
    //         if (typeof _this.settings.competition.activeContest.rewards === 'undefined') {
    //           _this.settings.competition.activeContest.rewards = [];
    //         }
    //
    //         var rewards = [];
    //         mapObject(_this.settings.competition.activeContest.rewards, function (reward) {
    //           if (typeof reward.rewardRank === 'string') {
    //             var rankParts = reward.rewardRank.split(',');
    //             var rewardRank = [];
    //
    //             mapObject(rankParts, function (part) {
    //               if (stringContains(part, '-')) {
    //                 var rankRange = part.split('-');
    //                 var rageStart = parseInt(rankRange[0]);
    //                 var rangeEnd = parseInt(rankRange[1]);
    //                 for (var i = rageStart; i <= rangeEnd; i++) {
    //                   rewardRank.push(i);
    //                 }
    //               } else {
    //                 rewardRank.push(parseInt(part));
    //               }
    //             });
    //
    //             reward.rewardRank = rewardRank;
    //           }
    //
    //           rewards.push(reward);
    //         });
    //
    //         _this.settings.competition.activeContest.rewards = rewards;
    //       }
    //     });
    //   });
    // }
  };

  this.getContests = async (contestRequest) => {
    if (!this.settings.apiWs.contestsApiWsClient) {
      this.settings.apiWs.contestsApiWsClient = new ContestsApiWs(this.apiClientStomp);
    }
    return new Promise((resolve, reject) => {
      this.settings.apiWs.contestsApiWsClient.getContests(contestRequest, (json) => {
        resolve(json.data);
      });
    });
  };

  this.getLeaderboardData = async function (count, callback) {
    const _this = this;
    if (this.settings.competition.activeContestId !== null) {
      if (!this.settings.apiWs.leaderboardApiWsClient) {
        this.settings.apiWs.leaderboardApiWsClient = new LeaderboardApiWs(this.apiClientStomp);
      }

      let ranksAboveToInclude = 0;
      let ranksBelowToInclude = 0;

      if (this.settings.leaderboard.miniScoreBoard.enableRankings) {
        ranksAboveToInclude = this.settings.leaderboard.miniScoreBoard.rankingsCount;
        ranksBelowToInclude = this.settings.leaderboard.miniScoreBoard.rankingsCount;
      }

      const leaderboardSubscriptionRequest = LeaderboardSubscriptionRequest.constructFromObject({
        entityId: this.settings.competition.activeContestId,
        action: 'Subscribe',
        leaderboardFilter: {
          topRanksToInclude: count,
          ranksAboveToInclude: ranksAboveToInclude,
          ranksBelowToInclude: ranksBelowToInclude
        }
      });

      // this.settings.apiWs.leaderboardApiWsClient.subscribeToLeaderboard(leaderboardSubscriptionRequest)
      //   .then(json => {
      //     if (json.data && json.data.leaderboardEntries) {
      //       this.settings.leaderboard.leaderboardData = json.data.leaderboardEntries;
      //     } else {
      //       this.settings.leaderboard.leaderboardData = [];
      //     }
      //     callback(this.settings.leaderboard.leaderboardData);
      //   })
      //   .catch(error => {
      //     _this.log('failed to getLeaderboardData ' + error);
      //   });

      this.settings.apiWs.leaderboardApiWsClient.subscribeToLeaderboard(
        leaderboardSubscriptionRequest,
        (json) => {
          console.warn('subscribeToLeaderboard json', json);
          if (json.data && json.data.leaderboardEntries) {
            _this.settings.leaderboard.leaderboardData = json.data.leaderboardEntries;
          }
          // } else {
          //   _this.settings.leaderboard.leaderboardData = [];
          // }
          callback(_this.settings.leaderboard.leaderboardData);
        }
      );

      // var _this = this;
      // var url = _this.settings.uri.contestLeaderboard.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.competition.activeContestId);
      // var filters = [
      //   '_limit=' + count
      // ];
      //
      // if (_this.settings.leaderboard.miniScoreBoard.enableRankings) {
      //   filters.push('rankings=' + _this.settings.leaderboard.miniScoreBoard.rankingsCount);
      // }
      //
      // if (typeof _this.settings.memberId === 'string' && _this.settings.memberId.length > 0) {
      //   filters.push('memberId=' + _this.settings.memberId);
      // }
      //
      // filters = _this.settings.partialFunctions.uri.leaderboardParameters(filters);
      //
      // _this.settings.globalAjax.abort().getData({
      //   type: 'GET',
      //   url: _this.settings.uri.gatewayDomain + url + ((filters.length > 0) ? '?' + filters.join('&') : ''),
      //   headers: {
      //     'X-API-KEY': _this.settings.apiKey
      //   },
      //   success: function (response, dataObj, xhr) {
      //     if (xhr.status === 200) {
      //       var json = JSON.parse(response);
      //       _this.settings.partialFunctions.leaderboardDataResponseParser(json.data, function (lbData) {
      //         _this.settings.leaderboard.leaderboardData = lbData;
      //
      //         callback(lbData);
      //       });
      //     } else {
      //       _this.log('failed to getLeaderboardData ' + response);
      //     }
      //   }
      // });
    } else {
      this.settings.leaderboard.leaderboardData = [];
      callback();
    }
  };

  this.updateLeaderboardNavigationCounts = function () {
    var _this = this;

    if (_this.settings.mainWidget.settings.navigation !== null) {
      var menuItemCount = query(_this.settings.mainWidget.settings.navigation, '.' + _this.settings.navigation.tournaments.navigationClass + ' .cl-main-navigation-item-count');
      menuItemCount.innerHTML = _this.settings.tournaments.activeCompetitions.length;
    }
  };

  this.updateAchievementNavigationCounts = function () {
    var _this = this;

    if (_this.settings.mainWidget.settings.navigation !== null) {
      var menuItemCount = query(_this.settings.mainWidget.settings.navigation, '.' + _this.settings.navigation.achievements.navigationClass + ' .cl-main-navigation-item-count');
      menuItemCount.innerHTML = _this.settings.achievements.totalCount;
    }
  };

  this.updateRewardsNavigationCounts = function () {
    const _this = this;
    if (_this.settings.mainWidget.settings.navigation !== null) {
      const menuItemCount = query(
        _this.settings.mainWidget.settings.navigation,
        '.' + _this.settings.navigation.rewards.navigationClass + ' .cl-main-navigation-item-count'
      );
      menuItemCount.innerHTML = _this.settings.awards.totalCount;
    }
  };

  this.updateMessagesNavigationCounts = function () {
    const _this = this;

    if (_this.settings.mainWidget.settings.navigation !== null) {
      const menuItemCount = query(_this.settings.mainWidget.settings.navigation, '.' + _this.settings.navigation.inbox.navigationClass + ' .cl-main-navigation-item-count');
      menuItemCount.innerHTML = _this.settings.messages.totalCount;
    }
  };

  // var checkAchievementsAjax = new cLabs.Ajax();
  this.checkForAvailableAchievements = function (pageNumber, callback) {
    const _this = this;

    if (!this.settings.apiWs.achievementsApiWsClient) {
      this.settings.apiWs.achievementsApiWsClient = new AchievementsApiWs(this.apiClientStomp);
    }

    const achievementRequest = AchievementRequest.constructFromObject({
      achievementFilter: {
        productIds: [],
        tags: [],
        startDate: null,
        endDate: null,
        ids: [],
        statusCode: {
          moreThan: 20,
          lessThan: 30
        },
        sortBy: [{
          queryField: 'created',
          order: 'Desc'
        }],
        skip: (pageNumber - 1) * this.settings.itemsPerPage,
        limit: this.settings.itemsPerPage,
        constraints: []
      }
    }, null);

    this.settings.apiWs.achievementsApiWsClient.getAchievements(achievementRequest, async (json) => {
      _this.settings.achievements.list = json.data;
      _this.settings.achievements.totalCount = json.meta.totalRecordsFound || 0;
      const optInAchievements = json.data.filter(a => a.constraints && a.constraints.includes('optinRequiredForEntrants'));
      let optInIds = [];
      if (optInAchievements.length) {
        optInIds = optInAchievements.map(a => {
          if (a.constraints && a.constraints.includes('optinRequiredForEntrants')) {
            return a.id;
          }
        });
      }

      if (optInIds.length) {
        const statuses = await _this.getMemberAchievementsOptInStatuses(optInIds);
        if (statuses.length) {
          statuses.forEach(s => {
            const idx = _this.settings.achievements.list.findIndex(a => a.id === s.entityId);
            if (idx !== -1) {
              _this.settings.achievements.list[idx].optInStatus = s.status;
            }
          });
        }
      }

      if (typeof callback === 'function') callback(_this.settings.achievements.list);
    });

    // if (typeof _this.settings.currency === 'string' && _this.settings.currency.length > 0) {
    //   basicFilters.push('_uomKey=' + _this.settings.currency);
    // }
    //
    // basicFilters = _this.settings.partialFunctions.uri.achievementsAvailableForAllListParameters(basicFilters);
    //
    // checkAchievementsAjax.abort().getData({
    //   type: 'GET',
    //   url: _this.settings.uri.gatewayDomain + url + ((basicFilters.length > 0) ? '?' + basicFilters.join('&') : ''),
    //   headers: {
    //     'X-API-KEY': _this.settings.apiKey
    //   },
    //   success: function (response, dataObj, xhr) {
    //     if (xhr.status === 200) {
    //       var jsonData = JSON.parse(response);
    //
    //       _this.settings.partialFunctions.achievementDataForAllResponseParser(jsonData, function (jsonForAll) {
    //         _this.settings.achievements.totalCount = parseInt(jsonForAll.meta.totalRecordsFound);
    //         _this.settings.achievements.list = [];
    //
    //         mapObject(jsonForAll.data, function (ach) {
    //           _this.settings.achievements.list.push(ach);
    //         });
    //
    //         if (typeof _this.settings.member.groups !== 'undefined' && _this.settings.member.groups.length > 0) {
    //           basicFilters.push('memberGroups=' + _this.settings.member.groups.join(','));
    //
    //           basicFilters = _this.settings.partialFunctions.uri.achievementsForMemberListParameters(basicFilters);
    //
    //           var filterParameters = ((basicFilters.length > 0) ? '?' + basicFilters.join('&') : '');
    //           checkAchievementsAjax.abort().getData({
    //             type: 'GET',
    //             url: _this.settings.uri.gatewayDomain + url + filterParameters,
    //             headers: {
    //               'X-API-KEY': _this.settings.apiKey
    //             },
    //             success: function (response, dataObj, xhr) {
    //               if (xhr.status === 200) {
    //                 var json = JSON.parse(response);
    //
    //                 _this.settings.partialFunctions.achievementDataForMemberGroupResponseParser(json, function (achievmentMemberGroupData) {
    //                   mapObject(achievmentMemberGroupData.data, function (ach) {
    //                     var found = false;
    //                     mapObject(_this.settings.achievements.list, function (achCheck) {
    //                       if (achCheck.id === ach.id) {
    //                         found = true;
    //                       }
    //                     });
    //
    //                     if (!found) {
    //                       _this.settings.achievements.list.push(ach);
    //                     }
    //                   });
    //
    //                   _this.settings.achievements.totalCount = _this.settings.achievements.list.length;
    //
    //                   if (typeof callback === 'function') callback(_this.settings.achievements.list);
    //                 });
    //               } else {
    //                 _this.log('failed to checkForAvailableAchievements ' + response);
    //               }
    //             }
    //           });
    //         } else {
    //           if (typeof callback === 'function') callback(jsonForAll.data);
    //         }
    //       });
    //     } else {
    //       _this.log('failed to checkForAvailableAchievements ' + response);
    //     }
    //   }
    // });
  };

  // var getAchievementsAjax = new cLabs.Ajax();
  this.getAchievement = function (achievementId, callback) {
    const achievementData = this.settings.achievements.list.filter(a => a.id === achievementId);

    if (typeof callback === 'function' && achievementData.length) {
      callback(achievementData[0]);
    }
    // var _this = this;
    // var filters = [
    //   '_lang=' + _this.settings.language
    // ];
    //
    // if (typeof _this.settings.currency === 'string' && _this.settings.currency.length > 0) {
    //   filters.push('_uomKey=' + _this.settings.currency);
    // }
    //
    // filters = _this.settings.partialFunctions.uri.achievementByIdParameters(filters);
    //
    // getAchievementsAjax.abort().getData({
    //   url: _this.settings.uri.gatewayDomain + _this.settings.uri.achievement.replace(':space', _this.settings.spaceName).replace(':id', achievementId) + ((filters.length > 0) ? '?' + filters.join('&') : ''),
    //   headers: {
    //     'X-API-KEY': _this.settings.apiKey
    //   },
    //   type: 'GET',
    //   success: function (response, dataObj, xhr) {
    //     var json = null;
    //     if (xhr.status === 200) {
    //       try {
    //         json = JSON.parse(response);
    //       } catch (e) {
    //       }
    //     }
    //
    //     if (typeof callback === 'function') {
    //       _this.settings.partialFunctions.achievementDataResponseParser(json, function (achievementData) {
    //         callback(achievementData);
    //       });
    //     }
    //   },
    //   error: function () {
    //     if (typeof callback === 'function') {
    //       callback(null);
    //     }
    //   }
    // });
  };

  this.getAward = function (awardId, callback) {
    let awardData = null;
    const awards = [...this.settings.awards.availableAwards, ...this.settings.awards.claimedAwards];
    const idx = awards.findIndex(r => r.id === awardId);
    if (idx !== -1) {
      awardData = awards[idx];
    }

    if (typeof callback === 'function') {
      callback(awardData);
    }
  };

  // var getRewardAjax = new cLabs.Ajax();
  this.getReward = function (rewardId, callback) {
    let rewardData = null;
    const idx = this.settings.rewards.rewards.findIndex(r => r.id === rewardId);
    if (idx !== -1) {
      rewardData = this.settings.rewards.rewards[idx];
    }

    if (typeof callback === 'function') {
      callback(rewardData);
    }

    // var _this = this;

    // getRewardAjax.abort().getData({
    //   url: _this.settings.uri.gatewayDomain + _this.settings.uri.memberReward.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId).replace(':awardId', rewardId),
    //   headers: {
    //     'X-API-KEY': _this.settings.apiKey
    //   },
    //   type: 'GET',
    //   success: function (response, dataObj, xhr) {
    //     var json = null;
    //     if (xhr.status === 200) {
    //       try {
    //         json = JSON.parse(response);
    //       } catch (e) {
    //       }
    //     }
    //
    //     if (typeof callback === 'function') {
    //       _this.settings.partialFunctions.rewardDataResponseParser(json, function (rewardData) {
    //         callback(rewardData);
    //       });
    //     }
    //   },
    //   error: function () {
    //     if (typeof callback === 'function') {
    //       callback(null);
    //     }
    //   }
    // });
  };

  this.getMessage = async function (messageId, callback, isSys = false) {
    const _this = this;
    if (!this.settings.apiWs.messagesApiWsClient) {
      this.settings.apiWs.messagesApiWsClient = new MessagesApiWs(this.apiClientStomp);
    }

    if (isSys) {
      const messageRequest = {
        messageFilter: {
          ids: [messageId],
          skip: 0,
          limit: 20
        }
      };
      await this.settings.apiWs.messagesApiWsClient.getMessages(messageRequest, (json) => {
        if (json.data && json.data.length) {
          if (json.data[0].messageType === 'InboxItem') {
            _this.checkForAvailableMessages(function () {
              _this.updateMessagesNavigationCounts();
            });
          }
        }
      });
    } else {
      const messageRequest = {
        messageFilter: {
          ids: [messageId],
          messageType: 'InboxItem', // NotificationInboxItem Achievement Ticket Reward Text Notification InboxItem
          skip: 0,
          limit: 20
        }
      };

      await this.settings.apiWs.messagesApiWsClient.getMessages(messageRequest, (json) => {
        if (json.data.length) {
          if (typeof callback === 'function') {
            callback(json.data[0]);
          }
        } else {
          if (typeof callback === 'function') {
            callback(null);
          }
        }
      });
    }
  };

  // var claimRewardAjax = new cLabs.Ajax();
  this.claimAward = async function (rewardId, callback) {
    if (!this.settings.apiWs.awardsApiWsClient) {
      this.settings.apiWs.awardsApiWsClient = new AwardsApiWs(this.apiClientStomp);
    }

    const claimAwardRequest = ClaimAwardRequest.constructFromObject({
      awardIds: [rewardId]
    });

    this.settings.apiWs.awardsApiWsClient.claimAwards(claimAwardRequest, (json) => {
      if (typeof callback === 'function') {
        callback(json);
      }
    });

    // var _this = this;
    //
    // claimRewardAjax.abort().getData({
    //   url: _this.settings.uri.gatewayDomain + _this.settings.uri.memberRewardClaim.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId).replace(':awardId', rewardId),
    //   headers: {
    //     'X-API-KEY': _this.settings.apiKey
    //   },
    //   type: 'POST',
    //   success: function (response, dataObj, xhr) {
    //     var json = null;
    //     if (xhr.status === 200) {
    //       try {
    //         json = JSON.parse(response);
    //       } catch (e) {
    //       }
    //     }
    //
    //     if (typeof callback === 'function') {
    //       _this.settings.partialFunctions.claimRewardDataResponseParser(json, function (claimRewardData) {
    //         callback(claimRewardData);
    //       });
    //     }
    //   },
    //   error: function () {
    //     if (typeof callback === 'function') {
    //       callback(null);
    //     }
    //   }
    // });
  };

  // var checkForMemberAchievementsAjax = new cLabs.Ajax();
  this.checkForMemberAchievementsIssued = function (callback) {
    console.warn('checkForMemberAchievementsIssued currently unavailable');
    // var _this = this;
    // var url = _this.settings.uri.achievementsIssued.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId);
    //
    // checkForMemberAchievementsAjax.abort().getData({
    //   type: 'GET',
    //   url: _this.settings.uri.gatewayDomain + url,
    //   headers: {
    //     'X-API-KEY': _this.settings.apiKey
    //   },
    //   success: function (response, dataObj, xhr) {
    //     if (xhr.status === 200) {
    //       var json = JSON.parse(response);
    //
    //       _this.settings.partialFunctions.issuedAchievementsDataResponseParser(json, function (issuedAchievementsData) {
    //         var idList = [];
    //
    //         if (typeof issuedAchievementsData.aggregations !== 'undefined' && issuedAchievementsData.aggregations.length > 0) {
    //           mapObject(issuedAchievementsData.aggregations[0].items, function (item) {
    //             idList.push(item.value);
    //           });
    //         }
    //
    //         if (typeof callback === 'function') callback(idList);
    //       });
    //     } else {
    //       _this.log('failed to checkForMemberAchievementsIssued ' + response);
    //     }
    //   }
    // });
  };

  var checkForMemberAchievementsProgressionAjax = new cLabs.Ajax();
  this.checkForMemberAchievementsProgression = function (idList, callback) {
    var _this = this;
    var url = _this.settings.uri.achievementsProgression.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId);

    checkForMemberAchievementsProgressionAjax.abort().getData({
      type: 'GET',
      url: _this.settings.uri.gatewayDomain + url + (idList.length > 0 ? ('?id=' + idList.join(',')) : ''),
      headers: {
        'X-API-KEY': _this.settings.apiKey
      },
      success: function (response, dataObj, xhr) {
        if (xhr.status === 200) {
          var json = JSON.parse(response);

          if (typeof callback === 'function') {
            _this.settings.partialFunctions.memberAchievementsProgressionDataResponseParser(json.data, function (memberAchievementsProgressionData) {
              callback(memberAchievementsProgressionData);
            });
          }
        } else {
          _this.log('failed to checkForMemberAchievementsProgression ' + response);
        }
      }
    });
  };

  this.checkForAvailableAwards = async function (pageNumber, callback) {
    this.settings.awards.availableAwards = [];
    this.settings.awards.claimedAwards = [];
    this.settings.awards.rewards = [];

    const availableAwardRequest = AwardRequest.constructFromObject({
      awardFilter: {
        statusCode: {
          moreThan: 14,
          lessThan: 16
        },
        sortBy: [{
          queryField: 'created',
          order: 'Desc'
        }],
        skip: (pageNumber - 1) * 10,
        limit: 10
      }
    });

    const claimedAwardRequest = AwardRequest.constructFromObject({
      awardFilter: {
        statusCode: {
          moreThan: 34,
          lessThan: 36
        },
        sortBy: [{
          queryField: 'created',
          order: 'Desc'
        }],
        skip: (pageNumber - 1) * 10,
        limit: 10
      }
    });

    this.getAwardsApi(claimedAwardRequest)
      .then(json => {
        this.settings.awards.claimedAwards = json.data;
      })
      .catch(error => {
        this.log(error);
      });

    this.getAwardsApi(availableAwardRequest)
      .then(json => {
        this.settings.awards.availableAwards = json.data;
        this.settings.awards.totalCount = (json.meta && json.meta.totalRecordsFound)
          ? json.meta.totalRecordsFound
          : 0;

        if (typeof callback === 'function') {
          callback();
        }
      })
      .catch(error => {
        this.log(error);
      });
  };

  this.getAwardsApi = function (awardRequest) {
    if (!this.settings.apiWs.awardsApiWsClient) {
      this.settings.apiWs.awardsApiWsClient = new AwardsApiWs(this.apiClientStomp);
    }

    return new Promise((resolve, reject) => {
      this.settings.apiWs.awardsApiWsClient.getAwards(awardRequest, (json) => {
        resolve(json);
      });
    });
  };

  this.checkForAvailableRewards = function (pageNumber, callback) {
    this.settings.rewards.rewards = [];
    this.settings.rewards.availableRewards = [];
    this.settings.rewards.expiredRewards = [];
    this.settings.rewards.totalCount = 0;

    if (this.settings.competition.activeContestId) {
      const rewardRequest = {
        entityFilter: [{
          entityType: 'Contest',
          entityIds: [this.settings.competition.activeContestId]
        }],
        limit: 10,
        skip: (pageNumber - 1) * 10
      };

      this.getRewardsApi(rewardRequest)
        .then(json => {
          this.settings.rewards.rewards = json.data ?? [];
          this.settings.rewards.availableRewards = json.data ?? [];
          this.settings.rewards.expiredRewards = [];
          this.settings.rewards.totalCount = (json.meta && json.meta.totalRecordsFound) ? json.meta.totalRecordsFound : 0;
          if (this.settings.competition.activeContest && json.data) {
            this.settings.competition.activeContest.rewards = json.data;
          }
          if (typeof callback === 'function') {
            callback(
              this.settings.rewards.rewards,
              this.settings.rewards.availableRewards,
              this.settings.rewards.expiredRewards
            );
          }
        })
        .catch(error => this.log(error));

      // const json = await this.getRewardsApi(rewardRequest);
      //
      // this.settings.rewards.rewards = json.data ?? [];
      // this.settings.rewards.availableRewards = json.data ?? [];
      // this.settings.rewards.expiredRewards = [];
      // this.settings.rewards.totalCount = (json.meta && json.meta.totalRecordsFound) ? json.meta.totalRecordsFound : 0;
      // if (this.settings.competition.activeContest && json.data) {
      //   this.settings.competition.activeContest.rewards = json.data;
      // }
      // if (typeof callback === 'function') {
      //   callback(
      //     this.settings.rewards.rewards,
      //     this.settings.rewards.availableRewards,
      //     this.settings.rewards.expiredRewards
      //   );
      // }
    } else if (typeof callback === 'function') {
      callback(
        this.settings.rewards.rewards,
        this.settings.rewards.availableRewards,
        this.settings.rewards.expiredRewards
      );
    }

    // var url = _this.settings.uri.messages.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId);
    // var claimedFilters = [
    //   '_sortByFields=created:desc',
    //   'messageType=Reward',
    //   'prize.claimed=true',
    //   '_hasValuesFor=prize',
    //   '_limit=100'
    // ];
    // var notClaimedFilters = [
    //   '_sortByFields=created:desc',
    //   'messageType=Reward',
    //   'prize.claimed=false',
    //   '_hasValuesFor=prize',
    //   '_limit=100'
    // ];
    //
    // claimedFilters = _this.settings.partialFunctions.uri.claimedRewardsListParameters(claimedFilters);

    // claimed rewards
    // checkForAvailableRewardsAjax.abort().getData({
    //   type: 'GET',
    //   url: _this.settings.uri.gatewayDomain + url + ((claimedFilters.length > 0) ? '?' + claimedFilters.join('&') : ''),
    //   headers: {
    //     'X-API-KEY': _this.settings.apiKey
    //   },
    //   success: function (response, dataObj, xhr) {
    //     if (xhr.status === 200) {
    //       var jsonClaimedPrizes = JSON.parse(response);
    //
    //       _this.settings.rewards.rewards = [];
    //       _this.settings.rewards.availableRewards = [];
    //       _this.settings.rewards.expiredRewards = [];
    //
    //       _this.settings.partialFunctions.claimedRewardsDataResponseParser(jsonClaimedPrizes.data, function (claimedRewardsData) {
    //         mapObject(claimedRewardsData, function (message) {
    //           var expired = (typeof message.expiry === 'undefined') ? false : (moment(message.expiry).diff(moment()) < 0);
    //
    //           if (!expired) {
    //             _this.settings.rewards.rewards.push(message);
    //           }
    //         });
    //
    //         notClaimedFilters = _this.settings.partialFunctions.uri.notClaimedRewardsListParameters(notClaimedFilters);
    //
    //         // not-claimed rewards
    //         checkForAvailableRewardsAjax.abort().getData({
    //           type: 'GET',
    //           url: _this.settings.uri.gatewayDomain + url + ((notClaimedFilters.length > 0) ? '?' + notClaimedFilters.join('&') : ''),
    //           headers: {
    //             'X-API-KEY': _this.settings.apiKey
    //           },
    //           success: function (response, dataObj, xhr) {
    //             if (xhr.status === 200) {
    //               var jsonNotClaimed = JSON.parse(response);
    //
    //               _this.settings.partialFunctions.notClaimedRewardsDataResponseParser(jsonNotClaimed.data, function (notClaimedRewardsData) {
    //                 mapObject(notClaimedRewardsData, function (message) {
    //                   var expired = (typeof message.expiry === 'undefined') ? false : (moment(message.expiry).diff(moment()) < 0);
    //
    //                   if (!expired) {
    //                     _this.settings.rewards.availableRewards.push(message);
    //                   }
    //                 });
    //
    //                 // expired rewards
    //                 var date = new Date();
    //                 var utcDate = date.getUTCFullYear() + '-' + formatNumberLeadingZeros((date.getUTCMonth() + 1), 2) + '-' + formatNumberLeadingZeros(date.getUTCDate(), 2) + 'T' + formatNumberLeadingZeros(date.getUTCHours(), 2) + ':' + formatNumberLeadingZeros(date.getUTCMinutes(), 2) + ':00';
    //                 var expiredFilters = [
    //                   '_sortByFields=created:desc',
    //                   'messageType=Reward',
    //                   '_hasValuesFor=expiry',
    //                   '_limit=100',
    //                   'expiry<==' + utcDate
    //                 ];
    //
    //                 expiredFilters = _this.settings.partialFunctions.uri.expiredRewardsListParameters(expiredFilters);
    //
    //                 checkForAvailableRewardsAjax.abort().getData({
    //                   type: 'GET',
    //                   url: _this.settings.uri.gatewayDomain + url + ((expiredFilters.length > 0) ? '?' + expiredFilters.join('&') : ''),
    //                   headers: {
    //                     'X-API-KEY': _this.settings.apiKey
    //                   },
    //                   success: function (response, dataObj, xhr) {
    //                     if (xhr.status === 200) {
    //                       var jsonExpiredRewards = JSON.parse(response);
    //
    //                       _this.settings.partialFunctions.expiredRewardsDataResponseParser(jsonExpiredRewards.data, function (expiredRewardsData) {
    //                         mapObject(expiredRewardsData, function (message) {
    //                           _this.settings.rewards.expiredRewards.push(message);
    //                         });
    //
    //                         if (typeof callback === 'function') callback(_this.settings.rewards.rewards, _this.settings.rewards.availableRewards, _this.settings.rewards.expiredRewards);
    //                       });
    //                     } else {
    //                       _this.log('failed to checkForAvailableRewards expired ' + response);
    //                     }
    //                   }
    //                 });
    //               });
    //             } else {
    //               _this.log('failed to checkForAvailableRewards not-claimed ' + response);
    //             }
    //           }
    //         });
    //       });
    //     } else {
    //       _this.log('failed to checkForAvailableRewards claimed ' + response);
    //     }
    //   }
    // });
  };

  this.getRewardsApi = async function (rewardRequest) {
    if (!this.settings.apiWs.rewardsApiWsClient) {
      this.settings.apiWs.rewardsApiWsClient = new RewardsApiWs(this.apiClientStomp);
    }
    return new Promise((resolve, reject) => {
      this.settings.apiWs.rewardsApiWsClient.getRewards(rewardRequest, (json) => {
        resolve(json);
      });
    });
  };

  this.checkForAvailableMessages = async function (callback) {
    const messageRequest = {
      messageFilter: {
        messageType: 'InboxItem', // NotificationInboxItem Achievement Ticket Reward Text Notification InboxItem
        skip: 0,
        limit: 20
      }
    };

    this.getMessagesApi(messageRequest)
      .then(json => {
        this.settings.messages.messages = json.data ?? [];
        this.settings.messages.totalCount = (json.meta && json.meta.totalRecordsFound) ? json.meta.totalRecordsFound : 0;
        if (typeof callback === 'function') {
          callback(this.settings.messages.messages);
        }
      })
      .catch(error => {
        this.log(error);
      });

    // await this.settings.apiWs.messagesApiWsClient.getMessages(messageRequest, (json) => {
    //   this.settings.messages.messages = json.data ?? [];
    //   this.settings.messages.totalCount = (json.meta && json.meta.totalRecordsFound) ? json.meta.totalRecordsFound : 0;
    //   if (typeof callback === 'function') {
    //     callback(this.settings.messages.messages);
    //   }
    // });
  };

  this.getMessagesApi = async function (messageRequest) {
    if (!this.settings.apiWs.messagesApiWsClient) {
      this.settings.apiWs.messagesApiWsClient = new MessagesApiWs(this.apiClientStomp);
    }
    return new Promise((resolve, reject) => {
      this.settings.apiWs.messagesApiWsClient.getMessages(messageRequest, (json) => {
        resolve(json);
      });
    });
  };

  this.optInMemberToActiveCompetition = async function (callback) {
    if (!this.settings.apiWs.optInApiWsClient) {
      this.settings.apiWs.optInApiWsClient = new OptInApiWs(this.apiClientStomp);
    }

    const optInRequest = ManageOptinRequest.constructFromObject({
      entityId: this.settings.competition.activeCompetition.id,
      entityType: 'Competition',
      action: 'join'
    }, null);

    await this.settings.apiWs.optInApiWsClient.manageOptin(optInRequest, (json) => {
      console.warn('optInMemberToActiveCompetition json:', json);
    });
  };

  // var optInMemberAjax = new cLabs.Ajax();
  // this.optInMemberToActiveCompetition = function (callback) {
  //   var _this = this;
  //   var url = _this.settings.uri.memberCompetitionOptIn.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId).replace(':competitionId', _this.settings.competition.activeCompetitionId);
  //
  //   optInMemberAjax.abort().getData({
  //     type: 'GET',
  //     url: _this.settings.uri.gatewayDomain + url,
  //     headers: {
  //       'X-API-KEY': _this.settings.apiKey
  //     },
  //     success: function (response, dataObj, xhr) {
  //       if (xhr.status === 200) {
  //         callback();
  //       } else {
  //         _this.log('failed to optInMemberToActiveCompetition ' + response);
  //       }
  //     }
  //   });
  // };

  var revalidationCount = 0;
  this.revalidateIfSuccessfullOptIn = function (callback) {
    var _this = this;

    _this.loadActiveCompetition(function (competitionJson) {
      if (typeof competitionJson.data.optin === 'boolean' && !competitionJson.data.optin) {
        revalidationCount++;

        if (revalidationCount < 5) {
          setTimeout(function () {
            _this.revalidateIfSuccessfullOptIn(callback);
          }, 100);
        } else {
          revalidationCount = 0;
        }
      } else if (typeof competitionJson.data.optin === 'boolean' && competitionJson.data.optin) {
        callback(competitionJson);
      }
    });
  };

  this.leaderboardDataRefresh = function () {
    var _this = this;

    if (_this.settings.leaderboard.refreshLbDataInterval) {
      clearTimeout(_this.settings.leaderboard.refreshLbDataInterval);
    }

    if (
      (
        _this.settings.competition.activeCompetition !== null &&
        (
          !_this.settings.competition.activeCompetition.constraints ||
          !_this.settings.competition.activeCompetition.constraints.includes('optinRequiredForEntrants')
        )
      ) ||
      (
        _this.settings.competition.activeCompetition !== null &&
        typeof _this.settings.competition.activeCompetition.optin === 'boolean' &&
        _this.settings.competition.activeCompetition.optin
      )
    ) {
      var count = (_this.settings.miniScoreBoard.settings.active) ? 0 : _this.settings.leaderboard.fullLeaderboardSize;
      _this.getLeaderboardData(count, function (data) {
        if (_this.settings.miniScoreBoard.settings.active) _this.settings.miniScoreBoard.loadScoreBoard();
        if (_this.settings.mainWidget.settings.active) _this.settings.mainWidget.loadLeaderboard();
      });
    }

    _this.settings.leaderboard.refreshLbDataInterval = setTimeout(function () {
      _this.leaderboardDataRefresh();
    }, _this.settings.leaderboard.refreshIntervalMillis);
  };

  this.activeDataRefresh = function (callback) {
    var _this = this;

    if (_this.settings.competition.refreshInterval) {
      clearTimeout(_this.settings.competition.refreshInterval);
    }

    _this.checkForAvailableCompetitions(async function () {
      _this.updateLeaderboardNavigationCounts();
      await _this.prepareActiveCompetition(function () {
        var count = (_this.settings.miniScoreBoard.settings.active) ? 0 : _this.settings.leaderboard.fullLeaderboardSize;

        // clear to not clash with LB refresh that could happen at same time
        if (_this.settings.leaderboard.refreshInterval) {
          clearTimeout(_this.settings.leaderboard.refreshInterval);
        }

        if (_this.settings.miniScoreBoard.settings.active || _this.settings.mainWidget.settings.active) {
          if (
            (_this.settings.competition.activeCompetition !== null && typeof _this.settings.competition.activeCompetition.optinRequired === 'boolean' && !_this.settings.competition.activeCompetition.optinRequired) ||
            (_this.settings.competition.activeCompetition !== null && typeof _this.settings.competition.activeCompetition.optin === 'boolean' && _this.settings.competition.activeCompetition.optin)
          ) {
            _this.getLeaderboardData(count, function (data) {
              if (_this.settings.miniScoreBoard.settings.active) _this.settings.miniScoreBoard.loadScoreBoard();
              if (_this.settings.mainWidget.settings.active) _this.settings.mainWidget.loadLeaderboard();

              // re-start leaderboard refresh
              _this.leaderboardDataRefresh();

              if (typeof callback === 'function') {
                callback();
              }
            });
          } else {
            if (_this.settings.miniScoreBoard.settings.active) {
              _this.settings.miniScoreBoard.loadScoreBoard();
            }
            if (_this.settings.mainWidget.settings.active) {
              _this.getLeaderboardData(count, function (data) {
                _this.settings.mainWidget.loadLeaderboard();
              });
            }

            // restart leaderboard refresh
            _this.leaderboardDataRefresh();

            if (typeof callback === 'function') {
              callback();
            }
          }
        } else {
          if (_this.settings.miniScoreBoard.settings.active) _this.settings.miniScoreBoard.loadScoreBoard();

          if (typeof callback === 'function') {
            callback();
          }
        }
        _this.checkForAvailableAwards(1, function () {
          _this.updateRewardsNavigationCounts();
        });
        _this.checkForAvailableRewards(1);
      });
    });

    _this.settings.competition.refreshInterval = setTimeout(function () {
      _this.activeDataRefresh();
    }, _this.settings.competition.refreshIntervalMillis);
  };

  this.deactivateCompetitionsAndLeaderboards = function (callback) {
    var _this = this;

    if (_this.settings.leaderboard.refreshInterval) {
      clearTimeout(_this.settings.leaderboard.refreshInterval);
    }

    if (_this.settings.miniScoreBoard) {
      _this.settings.miniScoreBoard.clearAll();
    }
    if (_this.settings.mainWidget) {
      _this.settings.mainWidget.clearAll();
    }

    if (typeof callback === 'function') {
      callback();
    }
  };

  this.stopActivity = function (callback) {
    var _this = this;

    if (_this.settings.leaderboard.refreshInterval) {
      clearTimeout(_this.settings.leaderboard.refreshInterval);
      clearInterval(_this.settings.leaderboard.refreshInterval);
    }

    if (_this.settings.competition.refreshInterval) {
      clearTimeout(_this.settings.competition.refreshInterval);
      clearInterval(_this.settings.competition.refreshInterval);
    }

    if (_this.settings.leaderboard.refreshLbDataInterval) {
      clearTimeout(_this.settings.leaderboard.refreshLbDataInterval);
      clearInterval(_this.settings.leaderboard.refreshLbDataInterval);
    }

    if (_this.settings.miniScoreBoard.settings.updateInterval) {
      clearTimeout(_this.settings.miniScoreBoard.settings.updateInterval);
      clearInterval(_this.settings.leaderboard.refreshInterval);
    }

    if (typeof callback === 'function') {
      callback();
    }
  };

  this.restartActivity = function (callback) {
    var _this = this;

    _this.activeDataRefresh();
    _this.settings.miniScoreBoard.updateScoreBoard();

    if (typeof callback === 'function') {
      callback();
    }
  };

  this.loadMember = async function (callback) {
    if (!this.settings.apiWs.membersApiWsClient) {
      this.settings.apiWs.membersApiWsClient = new MembersApiWs(this.apiClientStomp);
    }

    const memberRequest = MemberRequest.constructFromObject({
      includeFields: [
        'id',
        'memberRefId',
        'memberType',
        'name',
        'jsonClass',
        'accountId',
        'groups',
        'created'
      ],
      includeCustomFields: [],
      includeMetaDataFields: []
    }, null);

    await this.settings.apiWs.membersApiWsClient.getMember(memberRequest, (json) => {
      this.settings.member = json.data;
      callback(json.data);
    });

    // _this.settings.globalAjax.abort().getData({
    //   type: 'GET',
    //   url: _this.settings.uri.gatewayDomain + _this.settings.uri.members.replace(':space', _this.settings.spaceName).replace(':id', _this.settings.memberId),
    //   headers: {
    //     'X-API-KEY': _this.settings.apiKey
    //   },
    //   success: function (response, dataObj, xhr) {
    //     if (xhr.status === 200) {
    //       var json = JSON.parse(response);
    //
    //       _this.settings.member = json.data;
    //
    //       callback(json.data);
    //     } else {
    //       _this.log('failed to loadMember ' + response);
    //     }
    //   }
    // });
  };

  this.loadWidgetTranslations = function (callback) {
    var _this = this;

    if (typeof _this.settings.uri.translationPath === 'string' && _this.settings.uri.translationPath.length > 0 && _this.settings.loadTranslations) {
      var url = (stringContains(_this.settings.uri.translationPath, 'http')) ? _this.settings.uri.translationPath.replace(':language', _this.settings.language) : _this.settings.uri.gatewayDomain + _this.settings.uri.translationPath.replace(':language', _this.settings.language);

      _this.settings.globalAjax.abort().getData({
        type: 'GET',
        url: url,
        headers: {
          'X-API-KEY': _this.settings.apiKey
        },
        success: function (response, dataObj, xhr) {
          if (xhr.status === 200) {
            var json = JSON.parse(response);

            _this.settings.translation = mergeObjects(_this.settings.translation, json);

            callback();
          } else {
            _this.log('no translation foound ' + response);

            callback();
          }
        }
      });
    } else {
      callback();
    }
  };

  this.startup = function () {
    var _this = this;

    _this.settings.miniScoreBoard.initLayout(function () {
      _this.settings.miniScoreBoard.settings.active = true;
      _this.activeDataRefresh(function () {
        _this.settings.partialFunctions.startupCallback(_this);
      });

      if (_this.settings.enableNotifications) {
        _this.settings.notifications.init();
        _this.settings.canvasAnimation.init();
      }

      _this.cleanup();

      if (typeof _this.settings.callback === 'function') {
        _this.settings.callback();
      }
    });
  };

  var _cleanupInstance;
  this.cleanup = function () {
    var _this = this;

    if (_cleanupInstance) {
      clearTimeout(_cleanupInstance);
    }

    _cleanupInstance = setTimeout(function () {
      _this.settings.mainWidget.preLoaderRerun();

      _this.cleanup();
    }, 3000);
  };

  this.loadStylesheet = function (callback) {
    var _this = this;
    var createdResources = false;
    var availableLinks = [];

    objectIterator(query('link'), function (link) {
      if (link !== null) {
        availableLinks.push(new URL(link.href, document.baseURI).href);
      }
    });

    mapObject(_this.settings.resources, function (resource, key, count) {
      var exists = false;

      mapObject(availableLinks, function (link) {
        if (link === new URL(resource, document.baseURI).href) {
          exists = true;
        }
      });

      if (!exists) {
        var link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', resource);

        if (count === 0) {
          link.onload = function () {
            if (typeof callback === 'function') {
              callback();
            }
          };

          link.onerror = function (e) {
            if (typeof callback === 'function') {
              callback();
            }
          };
        }

        document.body.appendChild(link);

        createdResources = true;
      }
    });

    if (!createdResources && typeof callback === 'function') {
      callback();
    }
  };

  this.clickedMiniScoreBoard = function () {
    var _this = this;

    if (!_this.settings.miniScoreBoard.settings.dragging) {
      _this.deactivateCompetitionsAndLeaderboards(function () {
        _this.settings.leaderboard.leaderboardData = [];
        _this.settings.mainWidget.initLayout(function () {
          // load tournaments data
          if (_this.settings.navigation.tournaments.enable) {
            _this.activeDataRefresh();
          }

          // load achievement data
          if (_this.settings.navigation.achievements.enable) {
            _this.checkForAvailableAchievements(1, function () {
              _this.updateAchievementNavigationCounts();
            });
          }

          // load initial available reward data
          if (_this.settings.navigation.rewards.enable) {
            _this.checkForAvailableAwards(1, function () {
              _this.updateRewardsNavigationCounts();
            });
            _this.checkForAvailableRewards(1);
          }

          // load initial available messages data
          if (_this.settings.navigation.inbox.enable) {
            _this.checkForAvailableMessages(function () {
              _this.updateMessagesNavigationCounts();
            });
          }
        });
        setTimeout(function () {
          _this.settings.miniScoreBoard.settings.container.style.display = 'none';
        }, 200);
      });
    }
  };

  /**
   * Open main widget and open specific tab and loads relevant action
   * @memberOf LbWidget
   * @param tab String
   * @param actionCallback Function
   */
  this.openWithTabAndAction = function (tab, actionCallback) {
    var _this = this;

    if (_this.settings.mainWidget.settings.active) {
      var loadTab = query(_this.settings.mainWidget.settings.container, tab);
      _this.settings.mainWidget.navigationSwitch(loadTab, function () {
        _this.activeDataRefresh();

        if (typeof actionCallback === 'function') {
          actionCallback();
        }
      });

      setTimeout(function () {
        _this.settings.miniScoreBoard.settings.container.style.display = 'none';
      }, 200);
    } else {
      _this.deactivateCompetitionsAndLeaderboards(function () {
        _this.settings.mainWidget.initLayout(function () {
          _this.settings.mainWidget.navigationSwitch(query(_this.settings.mainWidget.settings.container, tab), function () {
            _this.activeDataRefresh();

            if (typeof actionCallback === 'function') {
              actionCallback();
            }
          });
        });
        setTimeout(function () {
          _this.settings.miniScoreBoard.settings.container.style.display = 'none';
        }, 200);
      });
    }
  };

  var loadCompetitionListAjax = new cLabs.Ajax();
  this.eventHandlers = async function (el) {
    var _this = this;

    // mini scoreboard opt-in action
    if (hasClass(el, 'cl-widget-ms-optin-action') && !hasClass(el, 'checking')) {
      addClass(el, 'checking');

      await this.optInMemberToActiveCompetition();

      // _this.optInMemberToActiveCompetition(function () {
      //   _this.revalidateIfSuccessfullOptIn(function (competitionJson) {
      //     _this.settings.competition.activeCompetition = competitionJson.data;
      //
      //     // extra action to load competition details on mini scoreboard opt-in - Product request
      //     _this.deactivateCompetitionsAndLeaderboards(function () {
      //       _this.settings.leaderboard.leaderboardData = [];
      //       _this.settings.mainWidget.initLayout(function () {
      //         _this.activeDataRefresh();
      //
      //         _this.settings.mainWidget.loadCompetitionDetails(function () {
      //
      //         });
      //       });
      //       setTimeout(function () {
      //         _this.settings.miniScoreBoard.settings.container.style.display = 'none';
      //       }, 200);
      //     });
      //
      //     removeClass(el, 'checking');
      //   });
      // });

      // Leaderboard details opt-in action
    } else if (hasClass(el, 'cl-main-widget-lb-details-optin-action') && !hasClass(el, 'checking')) {
      addClass(el, 'checking');

      _this.optInMemberToActiveCompetition(function () {
        _this.revalidateIfSuccessfullOptIn(function (competitionJson) {
          _this.settings.competition.activeCompetition = competitionJson.data;
          _this.settings.mainWidget.competitionDetailsOptInButtonState();

          removeClass(el, 'checking');
        });
      });

      // Leaderboard details opt-in action
    } else if (hasClass(el, 'cl-main-widget-lb-optin-action') && !hasClass(el, 'checking')) {
      addClass(el, 'checking');

      await this.optInMemberToActiveCompetition();

      // _this.optInMemberToActiveCompetition(function () {
      //   _this.revalidateIfSuccessfullOptIn(function (competitionJson) {
      //     _this.settings.competition.activeCompetition = competitionJson.data;
      //
      //     _this.settings.mainWidget.loadCompetitionDetails(function () {
      //     });
      //
      //     removeClass(el, 'checking');
      //     el.parentNode.style.display = 'none';
      //   });
      // });

      // Achievement details opt-in action
    } else if (hasClass(el, 'cl-main-widget-ach-details-optin-action')) {
      if (_this.settings.achievements.activeAchievementId) {
        if (!this.settings.apiWs.optInApiWsClient) {
          this.settings.apiWs.optInApiWsClient = new OptInApiWs(this.apiClientStomp);
        }

        let optInRequest = ManageOptinRequest.constructFromObject({
          entityId: _this.settings.achievements.activeAchievementId,
          entityType: 'Achievement',
          action: 'join'
        }, null);

        if (hasClass(el, 'leave-achievement')) {
          optInRequest = ManageOptinRequest.constructFromObject({
            entityId: _this.settings.achievements.activeAchievementId,
            entityType: 'Achievement',
            action: 'leave'
          }, null);
        }

        await this.settings.apiWs.optInApiWsClient.manageOptin(optInRequest, (json) => {
          _this.settings.mainWidget.hideAchievementDetails(
            _this.checkForAvailableAchievements(1)
          );
        });
      }

      // Achievement list opt-in action
    } else if (hasClass(el, 'cl-ach-list-enter')) {
      const activeAchievementId = el.dataset.id;
      if (!this.settings.apiWs.optInApiWsClient) {
        this.settings.apiWs.optInApiWsClient = new OptInApiWs(this.apiClientStomp);
      }

      const optInRequest = ManageOptinRequest.constructFromObject({
        entityId: activeAchievementId,
        entityType: 'Achievement',
        action: 'join'
      }, null);

      await this.settings.apiWs.optInApiWsClient.manageOptin(optInRequest, (json) => {
        console.warn('manageOptin data:', json.data);
      });

      // Achievement list leave action
    } else if (hasClass(el, 'cl-ach-list-leave')) {
      const activeAchievementId = el.dataset.id;
      if (!this.settings.apiWs.optInApiWsClient) {
        this.settings.apiWs.optInApiWsClient = new OptInApiWs(this.apiClientStomp);
      }

      const optInRequest = ManageOptinRequest.constructFromObject({
        entityId: activeAchievementId,
        entityType: 'Achievement',
        action: 'leave'
      }, null);

      await this.settings.apiWs.optInApiWsClient.manageOptin(optInRequest, (json) => {
        console.warn('manageOptin data:', json.data);
      });

      // close mini scoreboard info area
    } else if (hasClass(el, 'cl-widget-ms-information-close') && !hasClass(el, 'checking')) {
      _this.settings.miniScoreBoard.clearAll();

      // close notification window
    } else if (hasClass(el, 'cl-widget-notif-information-close') && !hasClass(el, 'checking')) {
      _this.settings.notifications.hideNotification();

      // close leaderboard window
    } else if (hasClass(el, 'cl-main-widget-lb-header-close') || hasClass(el, 'cl-main-widget-ach-header-close') || hasClass(el, 'cl-main-widget-reward-header-close') || hasClass(el, 'cl-main-widget-inbox-header-close') || hasClass(el, 'cl-widget-main-widget-overlay-wrapper')) {
      _this.settings.mainWidget.hide(function () {
        _this.settings.miniScoreBoard.settings.active = true;
        _this.settings.miniScoreBoard.settings.container.style.display = 'block';

        _this.activeDataRefresh();
      });

      // load embedded competition details
    } else if (!_this.settings.leaderboard.layoutSettings.titleLinkToDetailsPage && (hasClass(el, 'cl-main-widget-lb-details-content-label') || closest(el, '.cl-main-widget-lb-details-content-label') !== null)) {
      _this.settings.mainWidget.showEmbeddedCompetitionDetailsContent(function () {});

      // hide embedded competition details
    } else if (!_this.settings.leaderboard.layoutSettings.titleLinkToDetailsPage && hasClass(el, 'cl-main-widget-lb-details-description-close')) {
      _this.settings.mainWidget.hideEmbeddedCompetitionDetailsContent(function () {});

      // load competition details
    } else if (hasClass(el, 'cl-main-widget-lb-details-content-label') || closest(el, '.cl-main-widget-lb-details-content-label') !== null) {
      if (_this.settings.competition.activeContest !== null) {
        _this.settings.mainWidget.loadCompetitionDetails(function () {
        });
      }

      // pagination
    } else if (hasClass(el, 'paginator-item')) {
      if (el.closest('.cl-main-widget-ach-list-body-res')) {
        _this.settings.mainWidget.loadAchievements(el.dataset.page);
      }
      if (el.closest('.cl-main-widget-reward-list-body-res')) {
        _this.settings.mainWidget.loadAwards(el.dataset.page);
      }

      // load achievement details
    } else if (hasClass(el, 'cl-ach-list-more')) {
      _this.getAchievement(el.dataset.id, function (data) {
        _this.settings.achievements.activeAchievementId = data.id;
        _this.settings.mainWidget.loadAchievementDetails(data, function () {
        });
      });

      // leaderboard details back button
    } else if (hasClass(el, 'cl-main-widget-lb-details-back-btn')) {
      _this.settings.mainWidget.hideCompetitionDetails();

      // achievements details back button
    } else if (hasClass(el, 'cl-main-widget-ach-details-back-btn')) {
      _this.settings.mainWidget.hideAchievementDetails(function () {
      });

      // rewards details back button
    } else if (hasClass(el, 'cl-main-widget-reward-details-back-btn')) {
      _this.settings.mainWidget.hideRewardDetails(function () {
      });

      // messages details back button
    } else if (hasClass(el, 'cl-main-widget-inbox-details-back-btn')) {
      _this.settings.mainWidget.hideMessageDetails(function () {
      });

      // load rewards details
    } else if (hasClass(el, 'cl-rew-list-item') || closest(el, '.cl-rew-list-item') !== null) {
      var awardId = (hasClass(el, 'cl-rew-list-item')) ? el.dataset.id : closest(el, '.cl-rew-list-item').dataset.id;
      _this.getAward(awardId, function (data) {
        _this.settings.mainWidget.loadRewardDetails(data, function () {
        });
      });

      // load inbox details
    } else if (hasClass(el, 'cl-inbox-list-item') || closest(el, '.cl-inbox-list-item') !== null) {
      var messageId = (hasClass(el, 'cl-inbox-list-item')) ? el.dataset.rewardId : closest(el, '.cl-inbox-list-item').dataset.id;
      _this.getMessage(messageId, function (data) {
        _this.settings.mainWidget.loadMessageDetails(data, function () {
        });
      });

      // claim reward
    } else if (hasClass(el, 'cl-main-widget-reward-claim-btn')) {
      _this.claimAward(el.dataset.id, function (data) {
        if (data.data[0].claimed) {
          // _this.settings.mainWidget.loadAwards(1);
          addClass(el, 'cl-claimed');
          el.innerHTML = _this.settings.translation.rewards.claimed;
        } else {
          removeClass(el, 'cl-claimed');
          el.innerHTML = _this.settings.translation.rewards.claim;
        }
      });

      // load achievement details window from notification window
    } else if (hasClass(el, 'cl-widget-notif-information-details-wrapper') || closest(el, '.cl-widget-notif-information-details-wrapper') !== null) {
      _this.openWithTabAndAction('.cl-main-widget-navigation-ach-icon', function () {
        var id = (hasClass(el, 'cl-widget-notif-information-details-wrapper')) ? el.dataset.id : closest(el, '.cl-widget-notif-information-details-wrapper').dataset.id;
        _this.settings.notifications.hideNotification();
        _this.settings.mainWidget.hideAchievementDetails(function () {
          _this.getAchievement(id, function (data) {
            _this.settings.mainWidget.loadAchievementDetails(data);
          });
        });
      });

      // primary widget navigation
    } else if (hasClass(el, 'cl-main-navigation-item')) {
      _this.settings.mainWidget.navigationSwitch(el);

      // competition list
    } else if (hasClass(el, 'cl-main-widget-lb-header-list-icon')) {
      if (_this.settings.leaderboard.refreshInterval) {
        clearTimeout(_this.settings.leaderboard.refreshInterval);
      }
      _this.settings.mainWidget.loadCompetitionList(function () {
        _this.activeDataRefresh();
      }, loadCompetitionListAjax);

      // load competition
    } else if (hasClass(el, 'cl-tour-list-item') || closest(el, '.cl-tour-list-item') !== null) {
      var tournamentId = (hasClass(el, 'cl-tour-list-item')) ? el.dataset.id : closest(el, '.cl-tour-list-item').dataset.id;
      var preLoader = _this.settings.mainWidget.preloader();

      preLoader.show(function () {
        _this.settings.mainWidget.settings.active = true;
        _this.settings.tournaments.activeCompetitionId = tournamentId;
        _this.activeDataRefresh(function () {
          _this.settings.mainWidget.hideCompetitionList(function () {
            if (!_this.settings.leaderboard.layoutSettings.titleLinkToDetailsPage) {
              _this.settings.mainWidget.showEmbeddedCompetitionDetailsContent(function () {});
            } else if (_this.settings.competition.activeContest !== null) {
              _this.settings.mainWidget.loadCompetitionDetails(function () {});
            }

            preLoader.hide();
          });
        });
      });

      // hide competition list view
    } else if (hasClass(el, 'cl-main-widget-tournaments-back-btn')) {
      _this.settings.mainWidget.hideCompetitionList();

      // mini scoreboard action to open primary widget
    } else if ((hasClass(el, 'cl-widget-ms-icon-wrapper') || closest(el, '.cl-widget-ms-icon-wrapper') !== null) || (hasClass(el, 'cl-widget-ms-information-wrapper') || closest(el, '.cl-widget-ms-information-wrapper') !== null)) {
      _this.clickedMiniScoreBoard();

      // accordion navigation
    } else if (hasClass(el, 'cl-accordion-label')) {
      _this.settings.mainWidget.accordionNavigation(el);
    }
  };

  this.eventListeners = function () {
    var _this = this;

    document.body.addEventListener('keyup', function (event) {
      switch (event.keyCode) {
        case 27: // on escape
          if (_this.settings.mainWidget.settings.active) {
            _this.settings.mainWidget.hide(function () {
              _this.settings.miniScoreBoard.settings.active = true;
              _this.settings.miniScoreBoard.settings.container.style.display = 'block';

              _this.activeDataRefresh();
            });
          }
          break;
      }
    });

    if (_this.isMobile()) {
      document.body.addEventListener('touchend', function (event) {
        var el = event.target;

        if (!_this.settings.miniScoreBoard.settings.dragging) {
          _this.eventHandlers(el);
        }
      });
    } else {
      document.body.addEventListener('click', function (event) {
        var el = event.target;

        _this.eventHandlers(el);
      });
    }
  };

  this.getCompetitionOptInStatus = async function (competitionId) {
    if (!this.settings.apiWs.optInApiWsClient) {
      this.settings.apiWs.optInApiWsClient = new OptInApiWs(this.apiClientStomp);
    }

    const optInStatesRequest = OptInStatesRequest.constructFromObject({
      optinStatesFilter: {
        entityTypes: ['Competition'],
        ids: [competitionId],
        statusCodes: {
          gt: -5,
          lt: 40
        },
        skip: 0,
        limit: 1
      }
    }, null);

    return new Promise((resolve, reject) => {
      this.settings.apiWs.optInApiWsClient.optInStates(optInStatesRequest, (json) => {
        resolve(json.data);
      });
    });
  };

  this.getMemberAchievementOptInStatus = async function (achievementId) {
    if (!this.settings.apiWs.optInApiWsClient) {
      this.settings.apiWs.optInApiWsClient = new OptInApiWs(this.apiClientStomp);
    }

    const optInStatesRequest = OptInStatesRequest.constructFromObject({
      optinStatesFilter: {
        entityTypes: ['Achievement'],
        ids: [achievementId],
        statusCodes: {
          gt: -5,
          lt: 40
        },
        skip: 0,
        limit: 1
      }
    }, null);

    return new Promise((resolve, reject) => {
      this.settings.apiWs.optInApiWsClient.optInStates(optInStatesRequest, (json) => {
        resolve(json.data);
      });
    });
  };

  this.getMemberAchievementsOptInStatuses = async function (achievementIds) {
    if (!this.settings.apiWs.optInApiWsClient) {
      this.settings.apiWs.optInApiWsClient = new OptInApiWs(this.apiClientStomp);
    }

    const optInStatesRequest = OptInStatesRequest.constructFromObject({
      optinStatesFilter: {
        entityTypes: ['Achievement'],
        ids: achievementIds,
        statusCodes: {
          gt: -5,
          lt: 40
        },
        skip: 0,
        limit: 1
      }
    }, null);

    return new Promise((resolve, reject) => {
      this.settings.apiWs.optInApiWsClient.optInStates(optInStatesRequest, (json) => {
        resolve(json.data);
      });
    });
  };

  this.closeEverything = function () {
    var _this = this;

    _this.deactivateCompetitionsAndLeaderboards(function () {
      _this.settings.leaderboard.leaderboardData = [];
      setTimeout(function () {
        _this.settings.miniScoreBoard.settings.container.style.display = 'none';
      }, 200);
    });

    _this.settings.mainWidget.hide();
    _this.settings.mainWidget.settings.preLoader.preLoaderActive = false;
    this.stopActivity();
    this.apiClientStomp.disconnect();
    this.apiClientStomp = null;
  };

  var restartReloadInterval;
  this.restart = function () {
    var _this = this;

    _this.settings.mainWidget.hide(() => {
      _this.deactivateCompetitionsAndLeaderboards(() => {
        _this.stopActivity(() => {
          _this.loadMember((member) => {
            _this.loadWidgetTranslations(() => {
              if (restartReloadInterval) {
                clearTimeout(restartReloadInterval);
              }
              _this.settings.mainWidget.destroyLayout();

              restartReloadInterval = setTimeout(function () {
                _this.settings.miniScoreBoard.settings.active = true;
                _this.settings.miniScoreBoard.settings.container.style.display = 'block';
                _this.startup();
              }, 300);
            });
          });
        });
      });
    });
  };

  this.isMobile = function () {
    return isMobileTablet();
  };

  this.applyAppearance = function () {
    if (this.settings.styles !== null) {
      const styles = Object.keys(this.settings.styles).reduce((accumulator, currentValue) => {
        return {
          ...accumulator,
          [`--lb3-${camelToKebabCase(currentValue)}`]: this.settings.styles[currentValue]
        };
      }, {});

      cssVars({
        include: 'link[rel=stylesheet],style',
        watch: true,
        onlyLegacy: false,
        variables: { ...styles }
      });
    }
  };

  this.initApiClientStomp = async function () {
    const _this = this;
    this.settings.authToken = null;
    await this.generateUserToken();

    if (this.apiClientStomp) {
      await this.apiClientStomp.disconnect();
      this.apiClientStomp = null;
    }

    if (this.settings.authToken) {
      this.apiClientStomp = ApiClientStomp.instance;
      await this.apiClientStomp.connect({ token: this.settings.authToken });
      this.apiClientStomp.sendSys('', {}, (json, headers) => {
        // console.warn('sendSys json:', json);
        // console.warn('sendSys headers:', headers);
        if (headers.objectType === 'Leaderboard') {
          this.settings.leaderboard.leaderboardData = json.leaderboardEntries;
          this.settings.miniScoreBoard.loadScoreBoard();
          this.settings.mainWidget.loadLeaderboard();
        }
        if (json.entityType === 'Message') {
          this.getMessage(json.entityId, null, true);
        }
        if (json.entityType === 'Award') {
          _this.settings.mainWidget.loadAwards(1);
        }
        if (json.entityType === 'Contest') {
          _this.checkForAvailableCompetitions(async function () {
            _this.updateLeaderboardNavigationCounts();
          });
        }
        if (json.entityType === 'Competition') {
          _this.checkForAvailableCompetitions(async function () {
            _this.updateLeaderboardNavigationCounts();
          });
        }
        if (json.entityType === 'Achievement') {
          _this.settings.mainWidget.loadAchievements();
        }
      });
    }
  };

  this.generateUserToken = async function () {
    const memberTokenRequest = {
      member: this.settings.memberRefId,
      apiKey: this.settings.apiKey,
      isReferenceId: true,
      expires: this.settings.expires,
      resource: 'ziqni-gapi'
    };

    const response = await fetch('https://api.ziqni.com/member-token', {
      method: 'post',
      body: JSON.stringify(memberTokenRequest),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const body = await response.json();

    if (body.data && body.data.jwtToken) {
      this.settings.authToken = body.data.jwtToken;
    } else {
      console.error('Member Token Error');
    }
  };

  /**
   * Init LbWidget method
   * @method
   * @memberOf LbWidget
   * @return {undefined}
   */
  this.init = async function () {
    await this.initApiClientStomp();

    setInterval(async () => {
      await this.initApiClientStomp();
    }, this.settings.expires);

    this.loadStylesheet(() => {
      this.applyAppearance();

      this.loadMember((member) => {
        this.loadWidgetTranslations(() => {
          if (this.settings.miniScoreBoard === null) {
            this.settings.canvasAnimation = new CanvasAnimation();
            this.settings.notifications = new Notifications({
              canvasInstance: this.settings.canvasAnimation
            });
            this.settings.miniScoreBoard = new MiniScoreBoard({
              active: true
            });
            this.settings.mainWidget = new MainWidget();

            this.settings.notifications.settings.lbWidget = this;
            this.settings.miniScoreBoard.settings.lbWidget = this;
            this.settings.mainWidget.settings.lbWidget = this;
            this.settings.canvasAnimation.settings.lbWidget = this;

            this.startup();
            this.eventListeners();
          } else {
            this.settings.mainWidget.hide(() => {
              this.deactivateCompetitionsAndLeaderboards(() => {
                this.settings.miniScoreBoard.settings.active = true;
                this.settings.miniScoreBoard.settings.container.style.display = 'block';
                this.startup();
              });
            });
          }
        });
      });
    });
  };

  if (this.settings.autoStart) {
    this.init();
  }
};
