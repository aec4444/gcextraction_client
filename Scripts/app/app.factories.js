(function() {
  angular
    .module("GameChangerExtraction")
    //.config(exceptionProviderConfig)
    .factory("$globals", globalsFactory)
    .factory("$gameChanger", gameChangerFactory)
    .factory("$calcs", calculationsFactory);

  function globalsFactory() {
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
      statsUrl: "http://gamechanger-aec4444.rhcloud.com",
      //statsUrl: "http://localhost:8081",
      getKeys: function(team) {
        var keys = teamKeys[team];
        return keys || defaultKeys;
      }
    }
  }

  gameChangerFactory.$inject = ['$http', '$globals'];
  function gameChangerFactory($http, $globals) {
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

  function getOPS(AB, H, Double, Triple, HR, BB, HBP) {
    return getSlg(AB, H, Double, Triple, HR) + getOBP(AB, H, BB, HBP);
  }

  function getOBP(AB, H, BB, HBP) {
    return (H + BB + HBP) / ((AB + BB + HBP) || 1);
  }

  function getSLG(AB, H, Double, Triple, HR) {
    if (AB === undefined || AB === 0)
      return 0;
    else
      return (H + Double + (Triple * 2) + (HR * 3)) / AB;
  }

  function getRC(AB, H, BB, CS, HBP, Double, Triple, HR, SAC, SB, PA, K) {
    var a = H + BB + HBP - CS;
    var tb = (H + Double + Triple * 2 + HR * 3);
    var b = tb + (0.26 * (BB + HBP)) + (0.53 * SAC) + (0.64 * SB) - (0.03 * (K || 0));
    var c = PA;

    var rc = ((a + 2.4 * c) * (b + 3 * c)) / (9 * c) - (0.9 * c);
    return rc || 0;
  };

  function getXR(AB, H, BB, CS, HBP, Double, Triple, HR, SAC, SB, PA, K) {
    var singles = H - Double - Triple - HR;
    var result = (0.5 * singles) + (0.72 * Double) + (1.04 * Triple) + (1.44 * HR) + (0.34 * (HBP + BB)) + (0.18 * SB) + (-0.32 * CS) + (-0.09 * (AB - H - K)) + (-0.098 * K) + (0.04 * SAC);
    return result || 0; 
  }

  function getRC21(AB, H, BB, CS, HBP, Double, Triple, HR, SAC, SB, PA, K) {
    var rc = getRC(AB, H, BB, CS, HBP, Double, Triple, HR, SAC, SB, PA, K);
    var d = (AB - H + CS + SAC);
    var result = rc / d * 21;

    return result || 0;
  }

  function getXR21(AB, H, BB, CS, HBP, Double, Triple, HR, SAC, SB, PA, K) {
    var xr = getXR(AB, H, BB, CS, HBP, Double, Triple, HR, SAC, SB, PA, K);
    var d = (AB - H + CS + SAC);
    var result = xr / d * 21;

    return result || 0;
  }

  function getAvg(agg, n, d, format) {

  }

  function calculationsFactory() {
    return {
      RC: getRC,
      XR: getXR,
      RC21: getRC21,
      XR21: getXR21,
      Avg: getAvg,
      OBP: getOBP,
      SLG: getSLG, 
      OPS: getOPS
    }
  }
})();