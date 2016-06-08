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
  teamKeys["PASTRIKERS"] = {
    name: "pa-strikers-10-u-black",
    teamId: "56ee2d0ef706440024c745ab",
    season: "spring-2016",
    displayName: "PA Strikers 10U"
  };
  teamKeys["MDLEGENDS"] = {
    name: "maryland-legends-10u",
    teamId: "571a31154cae00d826000881",
    season: "spring-2016",
    displayName: "Maryland Legends 10U"
  };
  teamKeys["LVP"] = {
    name: "10u-lehigh-valley-patriot-flames",
    teamId: "5235a511d216187dd6044a70",
    season: "spring-2016",
    displayName: "10U Lehigh Valley Patriot Flames"
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
    //statsUrl: "http://gamechanger-aec4444.rhcloud.com",
    statsUrl: "http://localhost:8081",
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
