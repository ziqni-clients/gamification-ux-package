import '@ziqni-tech/gamification-ux-package';
import '@ziqni-tech/gamification-ux-package/build/css/theme/cl-style-1-light-theme.css';

var widgetInstance = window._clLeaderBoardV3;


widgetInstance.settings.enableNotifications = false; // requires a working/valid SSE channel
widgetInstance.settings.memberId = "jon-doe-Asd3-_J_CgpY-bw2S2Sy";
widgetInstance.settings.uri.gatewayDomain = "10a92458d58344458d77baad9ae1a7fe";
widgetInstance.settings.apiKey = "";
widgetInstance.settings.spaceName = "your space";
widgetInstance.settings.gameId = "fruits";
widgetInstance.settings.bindContainer = document.body;

// lookup services override
widgetInstance.settings.uri.members = "https://s3.eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/member-data-sample.json";
widgetInstance.settings.uri.competitions = "https://s3.eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/competition-list-data-sample.json";
widgetInstance.settings.uri.competitionById = "https://s3.eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/competition-data-sample_:id.json";
widgetInstance.settings.uri.memberCompetitions = "https://s3.eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/competition-list-data-sample.json";
widgetInstance.settings.uri.memberCompetitionById = "https://s3.eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/gamification-ux-package-examples/data/competition-data-sample_:competitionId.json";
widgetInstance.settings.uri.contestLeaderboard = "https://s3.eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/leaderboard-data.json";
widgetInstance.settings.uri.achievements = "https://s3.eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-list-data-sample.json";
widgetInstance.settings.uri.achievement = "https://s3.eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-data-sample.json";
widgetInstance.settings.uri.achievementsProgression = "https://s3.eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-list-perc-data-sample.json";
widgetInstance.settings.uri.achievementsIssued = "https://s3.eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/achievements-list-issued-data-sample.json";
widgetInstance.settings.uri.messages = "https://s3.eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/messages-claimed-data-sample.json";
widgetInstance.settings.uri.memberReward = "https://s3.eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/messages-reward-data-sample.json";
widgetInstance.settings.uri.messageById = "https://s3.eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/data/messages-data-sample.json";
widgetInstance.settings.uri.assets = "https://s3.eu-west-1.amazonaws.com/static.competitionlabs.com/gamification-ux-package/examples/images/:attachmentId.png";
// widgetInstance.settings.resources = [
// 	("/build/css/theme/cl-style-1-light-theme.css?t=" + ( new Date().getTime() ))
// ];

widgetInstance.init();
