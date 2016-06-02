app.factory("$globals", function () {
  var defaultKeys = {
    teamId: '56ede2f1deafb60023e9cdc7',
    name: "pride-10u",
    season: "spring-2016",
    displayName: "NJ Pride 10u"
  };

  var teamKeys = {};
  teamKeys["10"] = defaultKeys;
  teamKeys["12"] = {
    season: "spring-2016",
    name: "nj-pride-12u",
    teamId: "56b11e792dd00d001b519644",
    displayName: "NJ Pride 12u"
  };
  teamKeys["MSDA"] = {
    name: "mount-st-dominic-academy-lions-varsity",
    teamId: "56d09ca9ddec3a001c60b6e3",
    season: "spring-2016",
    displayName: "Mount St. Dominics"
  };
  teamKeys["VIENNA"] = {
    name: "vienna-stars-05",
    teamId: "56f69447304e46001d95bfd8",
    season: "spring-2016",
    displayName: "Vienna Stars 10U"
  };
  teamKeys["PABALLHAWKS"] = {
    name: "pa-ball-hawks-10u",
    teamId: "56ed83b2b275ff0023d3c617",
    season: "spring-2016",
    displayName: "PA Ball Hawks 10U"
  };
  teamKeys["NJFIGHT"] = {
    name: "nj-fight",
    teamId: "56f66238c7dd559da5000001",
    season: "spring-2016",
    displayName: "NJ Fight 10U"
  };
  
  return {
    defaultTeam: "10",
    teamKeys: teamKeys,
    statsUrl: "http://gamechanger-aec4444.rhcloud.com",
    //statsUrl: "http://localhost:8081",
    getKeys: function(team) {
      var keys = teamKeys[team];
      return keys || defaultKeys;
    }
  }
});

app.factory("$gameChanger", [
  "$http", "$globals",
  function ($http, $globals) {
    var getRoster = function (keys, success) {
      // build the url to get the schedule.  You have to get it from a page, there isn't a rest service.  
      var url = $globals.statsUrl + "/roster";

      return $http.get(url, {
        params: {
          season: keys.season,
          name: keys.name,
          id: keys.teamId
        }
      }).then(function (response) {
        success(response.data);
      });
    };

    var getSchedule = function (keys, success) {
      // build the url to get the schedule.  You have to get it from a page, there isn't a rest service.  
      var url = $globals.statsUrl + "/schedule";

      return $http.get(url, {
        params: {
          season: keys.season,
          name: keys.name,
          id: keys.teamId
        }
      }).then(function (response) {
        success(response.data);
      });
    };

    var getStats = function (keys, games, success) {
      // build the url to get the schedule.  You have to get it from a page, there isn't a rest service.  
      var url = $globals.statsUrl + "/stats";

      // use the games array to get a list of game IDs
      var ids = [];
      angular.forEach(games, function(game) {
        ids.push(game.id);
      });

      return $http({
        url: url,
        method: "GET",
        params: {
          season: keys.season,
          name: keys.name,
          id: keys.teamId,
          games: ids
        },
        headers: {
          'Content-Type': undefined
        }
      }).then(function (response) {
        success(response.data);
      });
    }

    return {
      getRoster: getRoster,
      getSchedule: getSchedule,
      getStats: getStats
    }
  }
]);
